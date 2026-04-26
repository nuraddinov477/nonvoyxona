from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db import transaction as db_transaction
from django.db.models import Sum
from django.utils import timezone
from datetime import datetime, timedelta
from .models import SalesPoint, PointStock, ProductTransfer, TransferItem, PointReturn
from .serializers import (SalesPointSerializer, PointStockSerializer,
                          ProductTransferSerializer, CreateTransferSerializer,
                          PointReturnSerializer)
from production.models import Product, FinishedProductStock
from trade.models import Sale, SaleItem


def parse_date(s, fallback):
    if not s:
        return fallback
    try:
        return datetime.strptime(s, '%Y-%m-%d').date()
    except (ValueError, TypeError):
        return fallback


class SalesPointViewSet(viewsets.ModelViewSet):
    queryset = SalesPoint.objects.all()
    serializer_class = SalesPointSerializer
    filterset_fields = ['is_active']
    search_fields = ['name', 'address']

    @action(detail=True, methods=['get'])
    def stock(self, request, pk=None):
        """Nuqta omboridagi mahsulotlar"""
        point = self.get_object()
        stocks = PointStock.objects.filter(point=point).select_related('product')
        return Response(PointStockSerializer(stocks, many=True).data)

    @action(detail=True, methods=['get'])
    def employees(self, request, pk=None):
        """Nuqtaga biriktirilgan xodimlar"""
        point = self.get_object()
        employees = point.employees.values('id', 'first_name', 'last_name', 'username', 'phone', 'role')
        return Response(list(employees))

    @action(detail=True, methods=['get'])
    def plan_fact(self, request, pk=None):
        """Plan-fakt taqqoslash: jo'natilgan vs sotilgan vs qaytarilgan vs qoldiq"""
        point = self.get_object()
        today = timezone.localdate()
        date_from = parse_date(request.GET.get('date_from'), today)
        date_to = parse_date(request.GET.get('date_to'), today)
        if date_from > date_to:
            date_from, date_to = date_to, date_from

        # Mahsulot bo'yicha jamlanma
        result = []
        # Tegishli barcha mahsulotlar (jo'natilganlar yoki omborda bo'lganlar)
        product_ids = set()
        product_ids.update(
            TransferItem.objects.filter(
                transfer__point=point,
                transfer__status='accepted',
                transfer__date__date__gte=date_from,
                transfer__date__date__lte=date_to,
            ).values_list('product_id', flat=True)
        )
        product_ids.update(
            SaleItem.objects.filter(
                sale__point=point,
                sale__date__date__gte=date_from,
                sale__date__date__lte=date_to,
            ).values_list('product_id', flat=True)
        )
        product_ids.update(
            PointStock.objects.filter(point=point).values_list('product_id', flat=True)
        )

        for pid in product_ids:
            product = Product.objects.get(id=pid)
            sent = TransferItem.objects.filter(
                transfer__point=point, transfer__status='accepted',
                transfer__date__date__gte=date_from, transfer__date__date__lte=date_to,
                product_id=pid,
            ).aggregate(t=Sum('quantity'))['t'] or 0
            sold = SaleItem.objects.filter(
                sale__point=point,
                sale__date__date__gte=date_from, sale__date__date__lte=date_to,
                product_id=pid,
            ).aggregate(t=Sum('quantity'))['t'] or 0
            returned = PointReturn.objects.filter(
                point=point, product_id=pid,
                date__date__gte=date_from, date__date__lte=date_to,
            ).aggregate(t=Sum('quantity'))['t'] or 0
            stock = PointStock.objects.filter(point=point, product_id=pid).first()
            current_stock = stock.quantity if stock else 0

            # Plan-fakt: sent should equal sold + returned + current_stock
            # Kamomat = sent - sold - returned - current_stock
            shortage = sent - sold - returned - current_stock
            result.append({
                'product_id': pid,
                'product_name': product.name,
                'sent': sent,
                'sold': sold,
                'returned': returned,
                'current_stock': current_stock,
                'shortage': max(0, shortage),
                'has_shortage': shortage > 0,
            })

        result.sort(key=lambda x: -x['sent'])

        # Tushum
        revenue = float(Sale.objects.filter(
            point=point, date__date__gte=date_from, date__date__lte=date_to
        ).aggregate(t=Sum('total_amount'))['t'] or 0)

        return Response({
            'point_id': point.id,
            'point_name': point.name,
            'date_from': str(date_from),
            'date_to': str(date_to),
            'items': result,
            'totals': {
                'sent': sum(r['sent'] for r in result),
                'sold': sum(r['sold'] for r in result),
                'returned': sum(r['returned'] for r in result),
                'current_stock': sum(r['current_stock'] for r in result),
                'shortage': sum(r['shortage'] for r in result),
                'revenue': revenue,
            }
        })


class PointStockViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PointStock.objects.select_related('point', 'product').all()
    serializer_class = PointStockSerializer
    filterset_fields = ['point']


class ProductTransferViewSet(viewsets.ModelViewSet):
    queryset = ProductTransfer.objects.select_related('point', 'sent_by').prefetch_related('items__product').all()
    serializer_class = ProductTransferSerializer
    filterset_fields = ['point', 'status']

    @db_transaction.atomic
    def create(self, request, *args, **kwargs):
        serializer = CreateTransferSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        transfer = ProductTransfer.objects.create(
            point_id=data['point_id'],
            sent_by=request.user,
            note=data.get('note', ''),
        )

        for item_data in data['items']:
            product = Product.objects.get(id=item_data['product_id'])
            quantity = int(item_data['quantity'])

            # Tayyor mahsulot omboridan chiqarish
            stock = FinishedProductStock.objects.select_for_update().get(product=product)
            if stock.quantity < quantity:
                raise Exception(f"{product.name} omborda yetarli emas. Mavjud: {stock.quantity}")
            stock.quantity -= quantity
            stock.save()

            TransferItem.objects.create(transfer=transfer, product=product, quantity=quantity)

        return Response(ProductTransferSerializer(transfer).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        """Nuqtada mahsulotni qabul qilish"""
        transfer = self.get_object()
        if transfer.status != ProductTransfer.Status.IN_TRANSIT:
            return Response({'error': 'Bu jo\'natma allaqachon qabul qilingan'},
                          status=status.HTTP_400_BAD_REQUEST)

        with db_transaction.atomic():
            for item in transfer.items.all():
                point_stock, _ = PointStock.objects.get_or_create(
                    point=transfer.point, product=item.product)
                point_stock.quantity += item.quantity
                point_stock.save()

            transfer.status = ProductTransfer.Status.ACCEPTED
            transfer.accepted_by = request.user
            transfer.accepted_at = timezone.now()
            transfer.save()

        return Response(ProductTransferSerializer(transfer).data)


class PointReturnViewSet(viewsets.ModelViewSet):
    queryset = PointReturn.objects.select_related('point', 'product').all()
    serializer_class = PointReturnSerializer
    filterset_fields = ['point']

    @db_transaction.atomic
    def perform_create(self, serializer):
        ret = serializer.save(created_by=self.request.user)
        # Nuqta omboridan chiqarish
        point_stock = PointStock.objects.get(point=ret.point, product=ret.product)
        point_stock.quantity -= ret.quantity
        point_stock.save()
        # Markaziy omborga qaytarish
        stock, _ = FinishedProductStock.objects.get_or_create(product=ret.product)
        stock.quantity += ret.quantity
        stock.save()
