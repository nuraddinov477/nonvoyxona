from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db import transaction as db_transaction
from django.db.models import Sum
from django.utils import timezone
from datetime import datetime, timedelta
from .models import (CashRegister, Transaction, TransactionCategory,
                     Debtor, DebtRecord, Creditor, CreditRecord)
from .serializers import (CashRegisterSerializer, TransactionSerializer,
                          TransactionCategorySerializer, DebtorSerializer,
                          DebtRecordSerializer, CreditorSerializer, CreditRecordSerializer)


def parse_date(s, fallback):
    if not s:
        return fallback
    try:
        return datetime.strptime(s, '%Y-%m-%d').date()
    except (ValueError, TypeError):
        return fallback


class CashRegisterViewSet(viewsets.ModelViewSet):
    queryset = CashRegister.objects.all()
    serializer_class = CashRegisterSerializer
    filterset_fields = ['type', 'is_active']

    @action(detail=True, methods=['post'])
    def transfer(self, request, pk=None):
        """Kassalar arasi o'tkazma"""
        source = self.get_object()
        target_id = request.data.get('target_id')
        amount = float(request.data.get('amount', 0))
        description = request.data.get('description', '')

        if amount <= 0:
            return Response({'error': 'Summa 0 dan katta bo\'lishi kerak'},
                          status=status.HTTP_400_BAD_REQUEST)
        if source.balance < amount:
            return Response({'error': 'Kassada yetarli mablag\' yo\'q'},
                          status=status.HTTP_400_BAD_REQUEST)

        target = CashRegister.objects.get(id=target_id)

        with db_transaction.atomic():
            source.balance -= amount
            source.save()
            target.balance += amount
            target.save()

            Transaction.objects.create(
                cash_register=source, type='transfer', amount=amount,
                description=f"O'tkazma: {source.name} -> {target.name}. {description}",
                transfer_to=target, created_by=request.user,
            )

        return Response({'status': 'ok'})


class TransactionViewSet(viewsets.ModelViewSet):
    queryset = Transaction.objects.select_related('cash_register', 'category').all()
    serializer_class = TransactionSerializer
    filterset_fields = ['type', 'cash_register', 'category']

    @db_transaction.atomic
    def perform_create(self, serializer):
        txn = serializer.save(created_by=self.request.user)
        register = txn.cash_register
        if txn.type == 'income':
            register.balance += txn.amount
        elif txn.type == 'expense':
            register.balance -= txn.amount
        register.save()


class TransactionCategoryViewSet(viewsets.ModelViewSet):
    queryset = TransactionCategory.objects.all()
    serializer_class = TransactionCategorySerializer
    filterset_fields = ['type']


class DebtorViewSet(viewsets.ModelViewSet):
    queryset = Debtor.objects.prefetch_related('records').all()
    serializer_class = DebtorSerializer
    search_fields = ['name', 'phone']

    @action(detail=True, methods=['post'])
    def add_record(self, request, pk=None):
        debtor = self.get_object()
        serializer = DebtRecordSerializer(data={**request.data, 'debtor': debtor.id})
        serializer.is_valid(raise_exception=True)
        record = serializer.save(created_by=request.user)
        if record.is_payment:
            debtor.total_debt -= record.amount
        else:
            debtor.total_debt += record.amount
        debtor.save()
        return Response(DebtorSerializer(debtor).data)


class CreditorViewSet(viewsets.ModelViewSet):
    queryset = Creditor.objects.prefetch_related('records').all()
    serializer_class = CreditorSerializer
    search_fields = ['name', 'phone']

    @action(detail=True, methods=['post'])
    def add_record(self, request, pk=None):
        creditor = self.get_object()
        serializer = CreditRecordSerializer(data={**request.data, 'creditor': creditor.id})
        serializer.is_valid(raise_exception=True)
        record = serializer.save(created_by=request.user)
        if record.is_payment:
            creditor.total_debt -= record.amount
        else:
            creditor.total_debt += record.amount
        creditor.save()
        return Response(CreditorSerializer(creditor).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profit_loss(request):
    """Foyda-Zarar (P&L) hisoboti"""
    from trade.models import Sale, SaleItem
    from production.models import Recipe, DailyProduction

    today = timezone.localdate()
    date_from = parse_date(request.GET.get('date_from'), today.replace(day=1))
    date_to = parse_date(request.GET.get('date_to'), today)
    if date_from > date_to:
        date_from, date_to = date_to, date_from

    # === Tovarooborot (sotuv tushumi) ===
    sales_qs = Sale.objects.filter(date__date__gte=date_from, date__date__lte=date_to)
    revenue = float(sales_qs.aggregate(t=Sum('total_amount'))['t'] or 0)
    units_sold = SaleItem.objects.filter(
        sale__date__date__gte=date_from, sale__date__date__lte=date_to
    ).aggregate(t=Sum('quantity'))['t'] or 0

    # === Tannarx (sebestoyimost) - sotilgan mahsulotlar uchun xom ashyo qiymati ===
    cogs = 0  # Cost of Goods Sold
    sale_items = SaleItem.objects.filter(
        sale__date__date__gte=date_from, sale__date__date__lte=date_to
    ).select_related('product')
    for si in sale_items:
        recipes = Recipe.objects.filter(product=si.product).select_related('material')
        for r in recipes:
            material_cost = float(r.material.price_per_unit) * float(r.quantity_per_unit) * si.quantity
            cogs += material_cost

    # === Xarajatlar (kategoriya bo'yicha) ===
    expenses_qs = Transaction.objects.filter(
        type='expense', date__date__gte=date_from, date__date__lte=date_to
    )
    total_expenses = float(expenses_qs.aggregate(t=Sum('amount'))['t'] or 0)

    expenses_by_cat = list(
        expenses_qs.values('category__name').annotate(total=Sum('amount')).order_by('-total')
    )
    expenses_by_cat = [
        {'category': e['category__name'] or 'Boshqa', 'total': float(e['total'])}
        for e in expenses_by_cat
    ]

    # === Boshqa kirimlar ===
    other_income = float(
        Transaction.objects.filter(
            type='income', date__date__gte=date_from, date__date__lte=date_to
        ).aggregate(t=Sum('amount'))['t'] or 0
    )

    # === Yalpi foyda (Gross Profit) = Tushum - Tannarx ===
    gross_profit = revenue - cogs

    # === Sof foyda (Net Profit) = Yalpi foyda + Boshqa kirimlar - Xarajatlar ===
    net_profit = gross_profit + other_income - total_expenses

    # === Marja ===
    gross_margin = (gross_profit / revenue * 100) if revenue > 0 else 0
    net_margin = (net_profit / revenue * 100) if revenue > 0 else 0

    # === Oylik xarajat dinamikasi (oxirgi 6 oy) ===
    monthly_expenses = []
    today_d = today
    for i in range(5, -1, -1):
        # Oy boshini hisoblash
        month_start = today_d.replace(day=1)
        for _ in range(i):
            prev_month_end = month_start - timedelta(days=1)
            month_start = prev_month_end.replace(day=1)
        # Oy oxiri
        if month_start.month == 12:
            next_month_start = month_start.replace(year=month_start.year + 1, month=1)
        else:
            next_month_start = month_start.replace(month=month_start.month + 1)
        month_end = next_month_start - timedelta(days=1)

        amount = float(
            Transaction.objects.filter(
                type='expense', date__date__gte=month_start, date__date__lte=month_end
            ).aggregate(t=Sum('amount'))['t'] or 0
        )
        rev = float(
            Sale.objects.filter(
                date__date__gte=month_start, date__date__lte=month_end
            ).aggregate(t=Sum('total_amount'))['t'] or 0
        )
        monthly_expenses.append({
            'month': month_start.strftime('%Y-%m'),
            'month_label': month_start.strftime('%b %Y'),
            'expense': amount,
            'revenue': rev,
        })

    return Response({
        'date_from': str(date_from),
        'date_to': str(date_to),
        'revenue': revenue,
        'units_sold': units_sold,
        'cogs': cogs,
        'gross_profit': gross_profit,
        'gross_margin': gross_margin,
        'other_income': other_income,
        'total_expenses': total_expenses,
        'expenses_by_category': expenses_by_cat,
        'net_profit': net_profit,
        'net_margin': net_margin,
        'monthly_expenses': monthly_expenses,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profit_loss_detail(request):
    """P&L har bir qator uchun batafsil ma'lumot"""
    from trade.models import Sale, SaleItem
    from production.models import Recipe

    today = timezone.localdate()
    date_from = parse_date(request.GET.get('date_from'), today.replace(day=1))
    date_to = parse_date(request.GET.get('date_to'), today)
    detail_type = request.GET.get('type', 'revenue')

    if detail_type == 'revenue':
        # Sotuvlar ro'yxati (mahsulot bo'yicha)
        items = list(
            SaleItem.objects.filter(
                sale__date__date__gte=date_from, sale__date__date__lte=date_to
            )
            .values('product__name')
            .annotate(quantity=Sum('quantity'), revenue=Sum('total_price'))
            .order_by('-revenue')
        )
        for it in items:
            it['revenue'] = float(it['revenue'])

        total = sum(i['revenue'] for i in items)
        return Response({
            'title': '📈 Tovar aylanmasi (Sotuvdan tushgan daromad)',
            'description': "Tanlangan davrda har bir mahsulot bo'yicha sotilgan miqdor va tushum.",
            'columns': ['Mahsulot', 'Sotildi (dona)', 'Tushum'],
            'items': [{'name': i['product__name'], 'qty': i['quantity'], 'amount': i['revenue']} for i in items],
            'total': total,
        })

    elif detail_type == 'cogs':
        # Tannarx (har bir sotilgan mahsulot uchun xom ashyo qiymati)
        sale_items = SaleItem.objects.filter(
            sale__date__date__gte=date_from, sale__date__date__lte=date_to
        ).select_related('product')

        product_costs = {}
        for si in sale_items:
            product_name = si.product.name
            recipes = Recipe.objects.filter(product=si.product).select_related('material')
            cost_per_unit = sum(
                float(r.material.price_per_unit) * float(r.quantity_per_unit) for r in recipes
            )
            total_cost = cost_per_unit * si.quantity
            if product_name not in product_costs:
                product_costs[product_name] = {'qty': 0, 'cost_per_unit': cost_per_unit, 'total': 0}
            product_costs[product_name]['qty'] += si.quantity
            product_costs[product_name]['total'] += total_cost

        items = sorted(
            [{'name': k, 'qty': v['qty'], 'cost_per_unit': v['cost_per_unit'], 'amount': v['total']}
             for k, v in product_costs.items()],
            key=lambda x: -x['amount']
        )
        total = sum(i['amount'] for i in items)
        return Response({
            'title': '📦 Tannarx (Sebestoyimost - Cost of Goods Sold)',
            'description': "Sotilgan har bir mahsulot uchun retseptdagi xom ashyo (un, yog', achitqi va h.k.) qiymati. Bir dona uchun narx × sotilgan dona.",
            'columns': ['Mahsulot', 'Sotildi (dona)', '1 dona tannarx', 'Jami tannarx'],
            'items': [{
                'name': i['name'], 'qty': i['qty'],
                'unit_cost': i['cost_per_unit'], 'amount': i['amount']
            } for i in items],
            'total': total,
        })

    elif detail_type == 'other_income':
        # Boshqa kirimlar (sotuvdan tashqari)
        txns = list(
            Transaction.objects.filter(
                type='income', date__date__gte=date_from, date__date__lte=date_to
            ).select_related('cash_register', 'category').values(
                'date', 'amount', 'description', 'cash_register__name', 'category__name'
            ).order_by('-date')
        )
        for t in txns:
            t['amount'] = float(t['amount'])
        total = sum(t['amount'] for t in txns)
        return Response({
            'title': '💰 Boshqa kirimlar',
            'description': "Sotuvdan tashqari kirimlar: kredit, foiz, qaytarib olingan qarzlar va h.k.",
            'columns': ['Sana', 'Kategoriya', 'Kassa', 'Izoh', 'Summa'],
            'items': [{
                'date': str(t['date']),
                'category': t['category__name'] or 'Boshqa',
                'cash': t['cash_register__name'],
                'note': t['description'],
                'amount': t['amount'],
            } for t in txns],
            'total': total,
        })

    elif detail_type == 'expenses':
        # Operatsion xarajatlar
        txns = list(
            Transaction.objects.filter(
                type='expense', date__date__gte=date_from, date__date__lte=date_to
            ).select_related('cash_register', 'category').values(
                'date', 'amount', 'description', 'cash_register__name', 'category__name'
            ).order_by('-date')
        )
        for t in txns:
            t['amount'] = float(t['amount'])

        # Kategoriya bo'yicha jamlanma
        by_category = {}
        for t in txns:
            cat = t['category__name'] or 'Boshqa'
            by_category[cat] = by_category.get(cat, 0) + t['amount']

        total = sum(t['amount'] for t in txns)
        return Response({
            'title': '📉 Operatsion xarajatlar',
            'description': "Mahsulot ishlab chiqarishdan tashqari xarajatlar: ish haqi, ijara, kommunal, reklama va h.k.",
            'columns': ['Sana', 'Kategoriya', 'Kassa', 'Izoh', 'Summa'],
            'items': [{
                'date': str(t['date']),
                'category': t['category__name'] or 'Boshqa',
                'cash': t['cash_register__name'],
                'note': t['description'],
                'amount': t['amount'],
            } for t in txns],
            'total': total,
            'by_category': [{'category': k, 'amount': v} for k, v in sorted(by_category.items(), key=lambda x: -x[1])],
        })

    return Response({'error': 'Notog\'ri turi'}, status=400)
