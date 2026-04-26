from rest_framework import serializers
from .models import (RawMaterialCategory, RawMaterial, RawMaterialIncome,
                     Product, Recipe, DailyProduction, FinishedProductStock)


class RawMaterialCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = RawMaterialCategory
        fields = '__all__'


class RawMaterialSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    unit_display = serializers.CharField(source='get_unit_display', read_only=True)

    class Meta:
        model = RawMaterial
        fields = '__all__'


class RawMaterialIncomeSerializer(serializers.ModelSerializer):
    material_name = serializers.CharField(source='material.name', read_only=True)

    class Meta:
        model = RawMaterialIncome
        fields = '__all__'
        read_only_fields = ['total_price', 'created_by', 'date']


class RecipeSerializer(serializers.ModelSerializer):
    material_name = serializers.CharField(source='material.name', read_only=True)
    material_unit = serializers.CharField(source='material.get_unit_display', read_only=True)

    class Meta:
        model = Recipe
        fields = '__all__'


class ProductSerializer(serializers.ModelSerializer):
    stock_quantity = serializers.IntegerField(source='stock.quantity', read_only=True, default=0)
    recipes = RecipeSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = '__all__'


class DailyProductionSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    baker_name = serializers.CharField(source='baker.get_full_name', read_only=True, default=None)

    class Meta:
        model = DailyProduction
        fields = '__all__'
        read_only_fields = ['is_processed', 'created_at', 'baker']


class FinishedProductStockSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_price = serializers.DecimalField(source='product.price', max_digits=12,
                                              decimal_places=2, read_only=True)

    class Meta:
        model = FinishedProductStock
        fields = '__all__'
