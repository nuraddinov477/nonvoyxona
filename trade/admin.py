from django.contrib import admin
from .models import Sale, SaleItem, UnsoldProduct


class SaleItemInline(admin.TabularInline):
    model = SaleItem
    extra = 1


@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    list_display = ('id', 'date', 'seller', 'payment_type', 'total_amount', 'point')
    list_filter = ('payment_type', 'date', 'is_bakery_sale')
    inlines = [SaleItemInline]


@admin.register(UnsoldProduct)
class UnsoldProductAdmin(admin.ModelAdmin):
    list_display = ('product', 'quantity', 'reason', 'date', 'point')
    list_filter = ('reason', 'date')
