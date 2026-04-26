from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Sum, F
from django.utils import timezone
from datetime import timedelta, datetime
from trade.models import Sale, SaleItem
from production.models import DailyProduction, FinishedProductStock, RawMaterial
from accounting.models import CashRegister, Debtor, Creditor, Transaction
from points.models import SalesPoint, PointStock


def parse_date(s, fallback):
    if not s:
        return fallback
    try:
        return datetime.strptime(s, '%Y-%m-%d').date()
    except (ValueError, TypeError):
        return fallback


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_view(request):
    today = timezone.localdate()
    yesterday = today - timedelta(days=1)

    # Sana oralig'i (default: oxirgi 7 kun)
    date_from = parse_date(request.GET.get('date_from'), today - timedelta(days=6))
    date_to = parse_date(request.GET.get('date_to'), today)
    if date_from > date_to:
        date_from, date_to = date_to, date_from

    # === Bugungi va kechagi ===
    today_sales = Sale.objects.filter(date__date=today)
    today_revenue = today_sales.aggregate(total=Sum('total_amount'))['total'] or 0
    today_sales_count = today_sales.count()
    today_units_sold = SaleItem.objects.filter(sale__date__date=today).aggregate(total=Sum('quantity'))['total'] or 0
    today_production = DailyProduction.objects.filter(date=today).aggregate(total=Sum('quantity'))['total'] or 0

    yesterday_sales = Sale.objects.filter(date__date=yesterday)
    yesterday_revenue = yesterday_sales.aggregate(total=Sum('total_amount'))['total'] or 0
    yesterday_units_sold = SaleItem.objects.filter(sale__date__date=yesterday).aggregate(total=Sum('quantity'))['total'] or 0
    yesterday_production = DailyProduction.objects.filter(date=yesterday).aggregate(total=Sum('quantity'))['total'] or 0

    # === Kunlik breakdown (tanlangan oraliq uchun) ===
    days_count = (date_to - date_from).days + 1
    daily_breakdown = []
    period_revenue = 0
    period_units_sold = 0
    period_production = 0
    period_expense = 0
    period_income = 0

    for i in range(days_count):
        d = date_from + timedelta(days=i)
        d_sales = Sale.objects.filter(date__date=d)
        d_revenue = float(d_sales.aggregate(total=Sum('total_amount'))['total'] or 0)
        d_sales_count = d_sales.count()
        d_units = SaleItem.objects.filter(sale__date__date=d).aggregate(total=Sum('quantity'))['total'] or 0
        d_production = DailyProduction.objects.filter(date=d).aggregate(total=Sum('quantity'))['total'] or 0
        d_expense = float(Transaction.objects.filter(date__date=d, type='expense').aggregate(total=Sum('amount'))['total'] or 0)
        d_income = float(Transaction.objects.filter(date__date=d, type='income').aggregate(total=Sum('amount'))['total'] or 0)

        daily_breakdown.append({
            'date': str(d),
            'day_short': d.strftime('%d %b'),
            'production': d_production,
            'units_sold': d_units,
            'sales_count': d_sales_count,
            'revenue': d_revenue,
            'expense': d_expense,
            'income': d_income,
            'profit': d_revenue + d_income - d_expense,
        })

        period_revenue += d_revenue
        period_units_sold += d_units
        period_production += d_production
        period_expense += d_expense
        period_income += d_income

    period_summary = {
        'date_from': str(date_from),
        'date_to': str(date_to),
        'days_count': days_count,
        'revenue': period_revenue,
        'units_sold': period_units_sold,
        'production': period_production,
        'expense': period_expense,
        'other_income': period_income,
        'profit': period_revenue + period_income - period_expense,
        'avg_daily_revenue': period_revenue / days_count if days_count else 0,
        'avg_daily_production': period_production / days_count if days_count else 0,
    }

    # === Tanlangan oraliq uchun top mahsulotlar ===
    period_top_products = list(
        SaleItem.objects.filter(sale__date__date__gte=date_from, sale__date__date__lte=date_to)
        .values('product__name')
        .annotate(total_sold=Sum('quantity'), total_revenue=Sum('total_price'))
        .order_by('-total_sold')[:10]
    )

    # === Xarajatlar kategoriya bo'yicha (tanlangan oraliq) ===
    expense_by_category = list(
        Transaction.objects.filter(date__date__gte=date_from, date__date__lte=date_to, type='expense')
        .values('category__name')
        .annotate(total=Sum('amount'))
        .order_by('-total')
    )
    expense_by_category = [
        {'category': e['category__name'] or 'Boshqa', 'total': float(e['total'])}
        for e in expense_by_category
    ]

    # === Qarzdorlar/Kreditorlar ===
    total_debtors = Debtor.objects.aggregate(total=Sum('total_debt'))['total'] or 0
    debtors_list = list(Debtor.objects.values('id', 'name', 'phone', 'total_debt').order_by('-total_debt')[:5])
    total_creditors = Creditor.objects.aggregate(total=Sum('total_debt'))['total'] or 0
    creditors_list = list(Creditor.objects.values('id', 'name', 'phone', 'total_debt').order_by('-total_debt')[:5])

    # === Kassalar ===
    cash_balances = list(CashRegister.objects.filter(is_active=True).values('id', 'name', 'type', 'balance'))

    # === Bugungi to'lov turlari ===
    payment_breakdown = []
    labels = {'cash': 'Naqd', 'terminal': 'Terminal', 'click': 'Click', 'payme': 'Payme'}
    for pt in ['cash', 'terminal', 'click', 'payme']:
        amount = Sale.objects.filter(date__date=today, payment_type=pt).aggregate(total=Sum('total_amount'))['total'] or 0
        count = Sale.objects.filter(date__date=today, payment_type=pt).count()
        payment_breakdown.append({'type': pt, 'label': labels[pt], 'amount': float(amount), 'count': count})

    # === Tayyor mahsulot ombori ===
    stock = list(FinishedProductStock.objects.select_related('product').values('product__name', 'quantity').order_by('-quantity'))

    # === Kam qolgan xom ashyolar ===
    low_materials = list(
        RawMaterial.objects.filter(quantity__lte=F('min_quantity'))
        .values('name', 'quantity', 'min_quantity', 'unit')[:5]
    )

    # === Nuqtalar statistikasi ===
    points_stats = []
    for pt in SalesPoint.objects.filter(is_active=True):
        pt_sales = Sale.objects.filter(point=pt, date__date=today)
        pt_revenue = pt_sales.aggregate(total=Sum('total_amount'))['total'] or 0
        pt_stock_count = PointStock.objects.filter(point=pt).aggregate(total=Sum('quantity'))['total'] or 0
        points_stats.append({
            'id': pt.id, 'name': pt.name,
            'today_revenue': float(pt_revenue),
            'stock_count': pt_stock_count,
        })

    # === Oylik xarajat dinamikasi (oxirgi 6 oy) ===
    monthly_expenses = []
    for i in range(5, -1, -1):
        # Oy boshini hisoblash
        month_start = today.replace(day=1)
        for _ in range(i):
            prev_month_end = month_start - timedelta(days=1)
            month_start = prev_month_end.replace(day=1)
        # Oy oxirini hisoblash
        if month_start.month == 12:
            next_month_start = month_start.replace(year=month_start.year + 1, month=1)
        else:
            next_month_start = month_start.replace(month=month_start.month + 1)
        month_end = next_month_start - timedelta(days=1)

        expense = float(
            Transaction.objects.filter(
                type='expense', date__date__gte=month_start, date__date__lte=month_end
            ).aggregate(t=Sum('amount'))['t'] or 0
        )
        revenue_m = float(
            Sale.objects.filter(
                date__date__gte=month_start, date__date__lte=month_end
            ).aggregate(t=Sum('total_amount'))['t'] or 0
        )
        monthly_expenses.append({
            'month': month_start.strftime('%Y-%m'),
            'month_label': month_start.strftime('%b'),
            'expense': expense,
            'revenue': revenue_m,
        })

    # === Oxirgi tranzaksiyalar ===
    recent_transactions = list(
        Transaction.objects.select_related('cash_register', 'category')
        .values('type', 'amount', 'description', 'cash_register__name', 'date')
        .order_by('-date')[:8]
    )

    # === HR statistikasi ===
    try:
        from hr.models import Employee, Attendance, SalaryPayment
        hr_today_present = Attendance.objects.filter(
            date=today, status='present'
        ).values('employee').distinct().count()
        hr_total_active = Employee.objects.filter(status='active').count()
        hr_pending_salary = float(
            SalaryPayment.objects.filter(status='draft').aggregate(t=Sum('total_to_pay'))['t'] or 0
        )
    except Exception:
        hr_today_present = 0
        hr_total_active = 0
        hr_pending_salary = 0

    return Response({
        'today': {
            'revenue': today_revenue,
            'sales_count': today_sales_count,
            'units_sold': today_units_sold,
            'production': today_production,
        },
        'yesterday': {
            'revenue': yesterday_revenue,
            'units_sold': yesterday_units_sold,
            'production': yesterday_production,
        },
        'period_summary': period_summary,
        'daily_breakdown': daily_breakdown,
        'period_top_products': period_top_products,
        'expense_by_category': expense_by_category,
        'debtors_total': total_debtors,
        'debtors_list': debtors_list,
        'creditors_total': total_creditors,
        'creditors_list': creditors_list,
        'cash_balances': cash_balances,
        'payment_breakdown': payment_breakdown,
        'stock': stock,
        'low_materials': low_materials,
        'points_stats': points_stats,
        'monthly_expenses': monthly_expenses,
        'recent_transactions': recent_transactions,
        'hr': {
            'today_present': hr_today_present,
            'total_active': hr_total_active,
            'pending_salary': hr_pending_salary,
        },
    })
