from django.contrib import admin
from .models import (CashRegister, Transaction, TransactionCategory,
                     Debtor, DebtRecord, Creditor, CreditRecord)


@admin.register(CashRegister)
class CashRegisterAdmin(admin.ModelAdmin):
    list_display = ('name', 'type', 'balance', 'is_active')
    list_filter = ('type',)


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('type', 'amount', 'cash_register', 'category', 'date')
    list_filter = ('type', 'cash_register', 'date')


@admin.register(TransactionCategory)
class TransactionCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'type')


class DebtRecordInline(admin.TabularInline):
    model = DebtRecord
    extra = 0


@admin.register(Debtor)
class DebtorAdmin(admin.ModelAdmin):
    list_display = ('name', 'phone', 'total_debt')
    inlines = [DebtRecordInline]


class CreditRecordInline(admin.TabularInline):
    model = CreditRecord
    extra = 0


@admin.register(Creditor)
class CreditorAdmin(admin.ModelAdmin):
    list_display = ('name', 'phone', 'total_debt')
    inlines = [CreditRecordInline]
