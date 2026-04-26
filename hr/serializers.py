from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (Position, Employee, PieceworkRate, Attendance,
                     Bonus, Penalty, Advance, SalaryPayment)

User = get_user_model()


class PositionSerializer(serializers.ModelSerializer):
    salary_type_display = serializers.CharField(source='get_salary_type_display', read_only=True)
    employee_count = serializers.SerializerMethodField()

    class Meta:
        model = Position
        fields = '__all__'

    def get_employee_count(self, obj):
        return obj.employees.filter(status='active').count()


class EmployeeSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    username = serializers.CharField(source='user.username', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    phone = serializers.CharField(source='user.phone', read_only=True)
    role_display = serializers.CharField(source='user.get_role_display', read_only=True)
    position_name = serializers.CharField(source='position.name', read_only=True, default=None)
    position_salary_type = serializers.CharField(source='position.salary_type', read_only=True, default=None)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Employee
        fields = ['id', 'user', 'username', 'full_name', 'first_name', 'last_name', 'phone',
                  'role_display', 'position', 'position_name', 'position_salary_type',
                  'hire_date', 'dismiss_date', 'status', 'status_display',
                  'fixed_salary', 'address', 'note']

    def get_full_name(self, obj):
        return obj.user.get_full_name() or obj.user.username


class CreateEmployeeSerializer(serializers.Serializer):
    """Yangi xodim yaratish (User + Employee birga)"""
    username = serializers.CharField()
    first_name = serializers.CharField()
    last_name = serializers.CharField(required=False, allow_blank=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    role = serializers.CharField(required=False, default='seller')
    password = serializers.CharField(required=False, default='pass123')

    position = serializers.IntegerField(required=False, allow_null=True)
    hire_date = serializers.DateField(required=False)
    fixed_salary = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, default=0)
    address = serializers.CharField(required=False, allow_blank=True)


class PieceworkRateSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    employee_name = serializers.CharField(source='employee.user.get_full_name', read_only=True)

    class Meta:
        model = PieceworkRate
        fields = '__all__'


class AttendanceSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.get_full_name', read_only=True)
    shift_display = serializers.CharField(source='get_shift_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    hours_worked = serializers.FloatField(read_only=True)

    class Meta:
        model = Attendance
        fields = '__all__'


class BonusSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.get_full_name', read_only=True)

    class Meta:
        model = Bonus
        fields = '__all__'
        read_only_fields = ['created_by']


class PenaltySerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.get_full_name', read_only=True)

    class Meta:
        model = Penalty
        fields = '__all__'
        read_only_fields = ['created_by']


class AdvanceSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.get_full_name', read_only=True)
    cash_register_name = serializers.CharField(source='cash_register.name', read_only=True, default=None)

    class Meta:
        model = Advance
        fields = '__all__'
        read_only_fields = ['created_by']


class SalaryPaymentSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.get_full_name', read_only=True)
    position_name = serializers.CharField(source='employee.position.name', read_only=True, default=None)
    cash_register_name = serializers.CharField(source='cash_register.name', read_only=True, default=None)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = SalaryPayment
        fields = '__all__'
