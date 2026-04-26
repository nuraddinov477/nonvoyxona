from django.contrib import admin
from .models import (RawMaterialCategory, RawMaterial, RawMaterialIncome,
                     Product, Recipe, DailyProduction, FinishedProductStock)


@admin.register(RawMaterialCategory)
class RawMaterialCategoryAdmin(admin.ModelAdmin):
    list_display = ('name',)


class RecipeInline(admin.TabularInline):
    model = Recipe
    extra = 1


@admin.register(RawMaterial)
class RawMaterialAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'quantity', 'unit', 'min_quantity', 'price_per_unit')
    list_filter = ('category',)


@admin.register(RawMaterialIncome)
class RawMaterialIncomeAdmin(admin.ModelAdmin):
    list_display = ('material', 'quantity', 'price_per_unit', 'total_price', 'supplier', 'date')
    list_filter = ('date',)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'price', 'is_active')
    inlines = [RecipeInline]


@admin.register(DailyProduction)
class DailyProductionAdmin(admin.ModelAdmin):
    list_display = ('date', 'product', 'quantity', 'baker', 'is_processed')
    list_filter = ('date', 'is_processed')


@admin.register(FinishedProductStock)
class FinishedProductStockAdmin(admin.ModelAdmin):
    list_display = ('product', 'quantity', 'updated_at')
