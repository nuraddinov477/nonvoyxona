from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db import transaction as db_transaction
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import datetime, timedelta
from .models import Sale, SaleItem, UnsoldProduct
from .serializers import (SaleSerializer, CreateSaleSerializer,
                          UnsoldProductSerializer)
from production.models import Product, FinishedProductStock
from points.models import PointStock


def parse_date(s, fallback):
    if not s:
        return fallback
    try:
        return datetime.strptime(s, '%Y-%m-%d').date()
    except (ValueError, TypeError):
        return fallback


class SaleViewSet(viewsets.ModelViewSet):
    queryset = Sale.objects.select_related('seller', 'point').prefetch_related('items__product').all()
    serializer_class = SaleSerializer
    filterset_fields = ['payment_type', 'is_bakery_sale', 'point']

    @db_transaction.atomic
    def create(self, request, *args, **kwargs):
        serializer = CreateSaleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        point_id = data.get('point')
        is_bakery = point_id is None

        sale = Sale.objects.create(
            seller=request.user,
            payment_type=data['payment_type'],
            point_id=point_id,
            is_bakery_sale=is_bakery,
        )

        for item_data in data['items']:
            product = Product.objects.get(id=item_data['product_id'])
            quantity = int(item_data['quantity'])

            # Ombordagi miqdorni tekshirish
            if is_bakery:
                stock = FinishedProductStock.objects.select_for_update().get(product=product)
                if stock.quantity < quantity:
                    raise Exception(f"{product.name} omborda yetarli emas. Mavjud: {stock.quantity}")
                stock.quantity -= quantity
                stock.save()
            else:
                point_stock = PointStock.objects.select_for_update().get(
                    point_id=point_id, product=product)
                if point_stock.quantity < quantity:
                    raise Exception(f"{product.name} nuqtada yetarli emas. Mavjud: {point_stock.quantity}")
                point_stock.quantity -= quantity
                point_stock.save()

            SaleItem.objects.create(
                sale=sale,
                product=product,
                quantity=quantity,
                price=product.price,
            )

        sale.calculate_total()
        return Response(SaleSerializer(sale).data, status=status.HTTP_201_CREATED)


class UnsoldProductViewSet(viewsets.ModelViewSet):
    queryset = UnsoldProduct.objects.select_related('product', 'point').all()
    serializer_class = UnsoldProductSerializer
    filterset_fields = ['reason', 'point']

    def perform_create(self, serializer):
        unsold = serializer.save(created_by=self.request.user)
        # Tayyor mahsulot omboridan chiqarish
        if unsold.point:
            stock, _ = PointStock.objects.get_or_create(
                point=unsold.point, product=unsold.product)
        else:
            stock, _ = FinishedProductStock.objects.get_or_create(product=unsold.product)
        stock.quantity -= unsold.quantity
        stock.save()


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def trade_reports(request):
    """Savdo bo'limi hisobotlari"""
    today = timezone.localdate()
    date_from = parse_date(request.GET.get('date_from'), today)
    date_to = parse_date(request.GET.get('date_to'), today)
    if date_from > date_to:
        date_from, date_to = date_to, date_from

    sales_qs = Sale.objects.filter(date__date__gte=date_from, date__date__lte=date_to)
    items_qs = SaleItem.objects.filter(sale__date__date__gte=date_from, sale__date__date__lte=date_to)

    # === Kassa hisoboti (to'lov turlari bo'yicha) ===
    cash_report = []
    labels = {'cash': 'Naqd', 'terminal': 'Terminal', 'click': 'Click', 'payme': 'Payme'}
    total_amount = 0
    total_count = 0
    for pt in ['cash', 'terminal', 'click', 'payme']:
        amount = float(sales_qs.filter(payment_type=pt).aggregate(t=Sum('total_amount'))['t'] or 0)
        count = sales_qs.filter(payment_type=pt).count()
        cash_report.append({'type': pt, 'label': labels[pt], 'amount': amount, 'count': count})
        total_amount += amount
        total_count += count

    # === Top mahsulotlar ===
    top_products = list(
        items_qs.values('product__name')
        .annotate(total_sold=Sum('quantity'), total_revenue=Sum('total_price'), sales_count=Count('sale', distinct=True))
        .order_by('-total_sold')[:15]
    )
    for p in top_products:
        p['total_revenue'] = float(p['total_revenue'])

    # === Sotuvchilar unumdorligi ===
    sellers_report = list(
        sales_qs.exclude(seller__isnull=True)
        .values('seller__id', 'seller__first_name', 'seller__last_name', 'seller__username')
        .annotate(
            sales_count=Count('id'),
            total_revenue=Sum('total_amount'),
            units_sold=Sum('items__quantity'),
        )
        .order_by('-total_revenue')
    )
    for s in sellers_report:
        s['total_revenue'] = float(s['total_revenue'] or 0)
        s['full_name'] = (s['seller__first_name'] + ' ' + s['seller__last_name']).strip() or s['seller__username']

    # === Brak/Sotilmagan jami ===
    unsold_qs = UnsoldProduct.objects.filter(date__date__gte=date_from, date__date__lte=date_to)
    unsold_total = unsold_qs.aggregate(t=Sum('quantity'))['t'] or 0
    unsold_by_reason = list(
        unsold_qs.values('reason').annotate(total=Sum('quantity')).order_by('-total')
    )
    reason_labels = dict(UnsoldProduct.Reason.choices)
    for u in unsold_by_reason:
        u['label'] = reason_labels.get(u['reason'], u['reason'])

    # === Soatlik sotuv (kun ichida nechinchi soatlarda ko'p sotuv) ===
    hourly = []
    for h in range(6, 22):
        amount = float(sales_qs.filter(date__hour=h).aggregate(t=Sum('total_amount'))['t'] or 0)
        count = sales_qs.filter(date__hour=h).count()
        hourly.append({'hour': str(h) + ':00', 'amount': amount, 'count': count})

    return Response({
        'date_from': str(date_from),
        'date_to': str(date_to),
        'summary': {
            'total_amount': total_amount,
            'total_sales_count': total_count,
            'total_units_sold': items_qs.aggregate(t=Sum('quantity'))['t'] or 0,
        },
        'cash_report': cash_report,
        'top_products': top_products,
        'sellers_report': sellers_report,
        'unsold_total': unsold_total,
        'unsold_by_reason': unsold_by_reason,
        'hourly': hourly,
    })
