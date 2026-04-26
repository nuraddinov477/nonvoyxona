from django.contrib import admin
from .models import SalesPoint, PointStock, ProductTransfer, TransferItem, PointReturn


class TransferItemInline(admin.TabularInline):
    model = TransferItem
    extra = 1


@admin.register(SalesPoint)
class SalesPointAdmin(admin.ModelAdmin):
    list_display = ('name', 'address', 'phone', 'is_active')


@admin.register(PointStock)
class PointStockAdmin(admin.ModelAdmin):
    list_display = ('point', 'product', 'quantity')
    list_filter = ('point',)


@admin.register(ProductTransfer)
class ProductTransferAdmin(admin.ModelAdmin):
    list_display = ('id', 'point', 'status', 'sent_by', 'date')
    list_filter = ('status', 'point')
    inlines = [TransferItemInline]


@admin.register(PointReturn)
class PointReturnAdmin(admin.ModelAdmin):
    list_display = ('point', 'product', 'quantity', 'date')
    list_filter = ('point', 'date')
