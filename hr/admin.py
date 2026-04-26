from django.contrib import admin
from .models import (Position, Employee, PieceworkRate, Attendance,
                     Bonus, Penalty, Advance, SalaryPayment)


@admin.register(Position)
class PositionAdmin(admin.ModelAdmin):
    list_display = ('name', 'salary_type', 'default_salary')


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ('user', 'position', 'status', 'hire_date', 'fixed_salary')
    list_filter = ('status', 'position')
    search_fields = ('user__first_name', 'user__last_name')


@admin.register(PieceworkRate)
class PieceworkRateAdmin(admin.ModelAdmin):
    list_display = ('employee', 'product', 'rate_per_unit')


@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ('employee', 'date', 'shift', 'status', 'check_in', 'check_out')
    list_filter = ('date', 'shift', 'status')


@admin.register(Bonus)
class BonusAdmin(admin.ModelAdmin):
    list_display = ('employee', 'amount', 'reason', 'date', 'month')


@admin.register(Penalty)
class PenaltyAdmin(admin.ModelAdmin):
    list_display = ('employee', 'amount', 'reason', 'date', 'month')


@admin.register(Advance)
class AdvanceAdmin(admin.ModelAdmin):
    list_display = ('employee', 'amount', 'date', 'month', 'cash_register')


@admin.register(SalaryPayment)
class SalaryPaymentAdmin(admin.ModelAdmin):
    list_display = ('employee', 'month', 'total_to_pay', 'paid_amount', 'status')
    list_filter = ('month', 'status')
