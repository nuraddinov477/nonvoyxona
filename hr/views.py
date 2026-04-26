from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.db import transaction as db_transaction
from django.db.models import Sum
from django.utils import timezone
from datetime import datetime, timedelta
from .models import (Position, Employee, PieceworkRate, Attendance,
                     Bonus, Penalty, Advance, SalaryPayment)
from .serializers import (PositionSerializer, EmployeeSerializer, CreateEmployeeSerializer,
                          PieceworkRateSerializer, AttendanceSerializer,
                          BonusSerializer, PenaltySerializer, AdvanceSerializer,
                          SalaryPaymentSerializer)

User = get_user_model()


class PositionViewSet(viewsets.ModelViewSet):
    queryset = Position.objects.all()
    serializer_class = PositionSerializer


class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.select_related('user', 'position').all()
    serializer_class = EmployeeSerializer
    filterset_fields = ['status', 'position']
    search_fields = ['user__first_name', 'user__last_name', 'user__phone']

    def create(self, request, *args, **kwargs):
        serializer = CreateEmployeeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        with db_transaction.atomic():
            user = User.objects.create_user(
                username=data['username'],
                first_name=data.get('first_name', ''),
                last_name=data.get('last_name', ''),
                phone=data.get('phone', ''),
                role=data.get('role', 'seller'),
                password=data.get('password', 'pass123'),
            )
            employee = Employee.objects.create(
                user=user,
                position_id=data.get('position'),
                hire_date=data.get('hire_date') or timezone.localdate(),
                fixed_salary=data.get('fixed_salary', 0),
                address=data.get('address', ''),
            )

        return Response(EmployeeSerializer(employee).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        employee = self.get_object()
        today = timezone.localdate()
        month = today.strftime('%Y-%m')
        last_30 = today - timedelta(days=30)
        attendances = employee.attendances.filter(date__gte=last_30)
        present_days = attendances.filter(status='present').count()
        absent_days = attendances.filter(status='absent').count()
        bonus_total = float(employee.bonuses.filter(month=month).aggregate(t=Sum('amount'))['t'] or 0)
        penalty_total = float(employee.penalties.filter(month=month).aggregate(t=Sum('amount'))['t'] or 0)
        advance_total = float(employee.advances.filter(month=month).aggregate(t=Sum('amount'))['t'] or 0)
        return Response({
            'present_days_30': present_days,
            'absent_days_30': absent_days,
            'current_month_bonus': bonus_total,
            'current_month_penalty': penalty_total,
            'current_month_advance': advance_total,
        })


class PieceworkRateViewSet(viewsets.ModelViewSet):
    queryset = PieceworkRate.objects.select_related('employee__user', 'product').all()
    serializer_class = PieceworkRateSerializer
    filterset_fields = ['employee', 'product']


class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.select_related('employee__user').all()
    serializer_class = AttendanceSerializer
    filterset_fields = ['date', 'employee', 'status', 'shift']

    @action(detail=False, methods=['get'])
    def today(self, request):
        today = timezone.localdate()
        records = self.queryset.filter(date=today)
        return Response(self.get_serializer(records, many=True).data)

    @action(detail=False, methods=['post'])
    def mark_today(self, request):
        today = timezone.localdate()
        records = request.data.get('records', [])
        results = []
        for r in records:
            employee_id = r.get('employee')
            shift = r.get('shift', 'day')
            att_status = r.get('status', 'present')
            obj, created = Attendance.objects.update_or_create(
                employee_id=employee_id, date=today, shift=shift,
                defaults={
                    'status': att_status,
                    'check_in': timezone.now() if att_status == 'present' else None,
                }
            )
            results.append(AttendanceSerializer(obj).data)
        return Response(results)


class BonusViewSet(viewsets.ModelViewSet):
    queryset = Bonus.objects.select_related('employee__user').all()
    serializer_class = BonusSerializer
    filterset_fields = ['employee', 'month']

    def perform_create(self, serializer):
        bonus = serializer.save(created_by=self.request.user)
        if not bonus.month:
            bonus.month = bonus.date.strftime('%Y-%m')
            bonus.save()


class PenaltyViewSet(viewsets.ModelViewSet):
    queryset = Penalty.objects.select_related('employee__user').all()
    serializer_class = PenaltySerializer
    filterset_fields = ['employee', 'month']

    def perform_create(self, serializer):
        penalty = serializer.save(created_by=self.request.user)
        if not penalty.month:
            penalty.month = penalty.date.strftime('%Y-%m')
            penalty.save()


class AdvanceViewSet(viewsets.ModelViewSet):
    queryset = Advance.objects.select_related('employee__user', 'cash_register').all()
    serializer_class = AdvanceSerializer
    filterset_fields = ['employee', 'month']

    @db_transaction.atomic
    def perform_create(self, serializer):
        advance = serializer.save(created_by=self.request.user)
        if not advance.month:
            advance.month = advance.date.strftime('%Y-%m')
            advance.save()
        if advance.cash_register:
            from accounting.models import Transaction, TransactionCategory
            advance.cash_register.balance -= advance.amount
            advance.cash_register.save()
            cat, _ = TransactionCategory.objects.get_or_create(
                name='Avans (xodimga)', defaults={'type': 'expense'}
            )
            Transaction.objects.create(
                cash_register=advance.cash_register, type='expense',
                amount=advance.amount,
                description='Avans: ' + (advance.employee.user.get_full_name() or advance.employee.user.username),
                category=cat, created_by=self.request.user,
            )


class SalaryPaymentViewSet(viewsets.ModelViewSet):
    queryset = SalaryPayment.objects.select_related('employee__user', 'cash_register').all()
    serializer_class = SalaryPaymentSerializer
    filterset_fields = ['month', 'employee', 'status']

    @action(detail=False, methods=['post'])
    def calculate(self, request):
        month = request.data.get('month', timezone.localdate().strftime('%Y-%m'))
        year, mo = month.split('-')
        month_start = datetime(int(year), int(mo), 1).date()
        if int(mo) == 12:
            next_month = datetime(int(year) + 1, 1, 1).date()
        else:
            next_month = datetime(int(year), int(mo) + 1, 1).date()
        month_end = next_month - timedelta(days=1)

        results = []
        from production.models import DailyProduction

        for employee in Employee.objects.filter(status='active'):
            position = employee.position
            base_salary = float(employee.fixed_salary or 0)
            piecework_amount = 0
            units_produced = 0

            if position and position.salary_type in ('piecework', 'mixed'):
                productions = DailyProduction.objects.filter(
                    baker=employee.user, date__gte=month_start, date__lte=month_end
                )
                for prod in productions:
                    rate = PieceworkRate.objects.filter(
                        employee=employee, product=prod.product
                    ).first()
                    if rate:
                        piecework_amount += float(rate.rate_per_unit) * prod.quantity
                    units_produced += prod.quantity

            bonus_total = float(employee.bonuses.filter(month=month).aggregate(t=Sum('amount'))['t'] or 0)
            penalty_total = float(employee.penalties.filter(month=month).aggregate(t=Sum('amount'))['t'] or 0)
            advance_total = float(employee.advances.filter(month=month).aggregate(t=Sum('amount'))['t'] or 0)

            total_to_pay = base_salary + piecework_amount + bonus_total - penalty_total - advance_total

            payment, _ = SalaryPayment.objects.update_or_create(
                employee=employee, month=month,
                defaults={
                    'base_salary': base_salary,
                    'piecework_amount': piecework_amount,
                    'units_produced': units_produced,
                    'bonus_total': bonus_total,
                    'penalty_total': penalty_total,
                    'advance_total': advance_total,
                    'total_to_pay': total_to_pay,
                }
            )
            results.append(SalaryPaymentSerializer(payment).data)

        return Response({'month': month, 'count': len(results), 'payments': results})

    @action(detail=True, methods=['post'])
    def pay(self, request, pk=None):
        payment = self.get_object()
        cash_register_id = request.data.get('cash_register')
        amount = float(request.data.get('amount', payment.total_to_pay))

        if not cash_register_id:
            return Response({'error': 'Kassa tanlang'}, status=400)

        from accounting.models import CashRegister, Transaction, TransactionCategory

        with db_transaction.atomic():
            register = CashRegister.objects.get(id=cash_register_id)
            if register.balance < amount:
                return Response({'error': 'Kassada yetarli mablag\' yo\'q'}, status=400)

            register.balance -= amount
            register.save()

            cat, _ = TransactionCategory.objects.get_or_create(
                name='Ish haqi', defaults={'type': 'expense'}
            )
            Transaction.objects.create(
                cash_register=register, type='expense', amount=amount,
                description='Maosh: ' + (payment.employee.user.get_full_name() or payment.employee.user.username) + ' (' + payment.month + ')',
                category=cat, created_by=request.user,
            )

            payment.paid_amount = amount
            payment.paid_date = timezone.now()
            payment.cash_register = register
            payment.status = 'paid'
            payment.save()

        return Response(SalaryPaymentSerializer(payment).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def hr_dashboard(request):
    today = timezone.localdate()
    month = today.strftime('%Y-%m')
    today_present = Attendance.objects.filter(date=today, status='present').values('employee').distinct().count()
    total_active = Employee.objects.filter(status='active').count()
    pending_salary = float(SalaryPayment.objects.filter(status='draft').aggregate(t=Sum('total_to_pay'))['t'] or 0)
    advances_total = float(Advance.objects.filter(month=month).aggregate(t=Sum('amount'))['t'] or 0)
    return Response({
        'today_present': today_present,
        'total_active_employees': total_active,
        'pending_salary': pending_salary,
        'advances_this_month': advances_total,
    })
