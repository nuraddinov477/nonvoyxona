from django.db import models
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import (RawMaterialCategory, RawMaterial, RawMaterialIncome,
                     Product, Recipe, DailyProduction, FinishedProductStock)
from .serializers import (RawMaterialCategorySerializer, RawMaterialSerializer,
                          RawMaterialIncomeSerializer, ProductSerializer,
                          RecipeSerializer, DailyProductionSerializer,
                          FinishedProductStockSerializer)


class RawMaterialCategoryViewSet(viewsets.ModelViewSet):
    queryset = RawMaterialCategory.objects.all()
    serializer_class = RawMaterialCategorySerializer


class RawMaterialViewSet(viewsets.ModelViewSet):
    queryset = RawMaterial.objects.select_related('category').all()
    serializer_class = RawMaterialSerializer
    filterset_fields = ['category']
    search_fields = ['name']

    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """Kam qolgan xom ashyolar"""
        materials = self.queryset.filter(quantity__lte=models.F('min_quantity'))
        return Response(self.get_serializer(materials, many=True).data)


class RawMaterialIncomeViewSet(viewsets.ModelViewSet):
    queryset = RawMaterialIncome.objects.select_related('material').all()
    serializer_class = RawMaterialIncomeSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.prefetch_related('recipes', 'stock').all()
    serializer_class = ProductSerializer
    filterset_fields = ['is_active']
    search_fields = ['name']


class RecipeViewSet(viewsets.ModelViewSet):
    queryset = Recipe.objects.select_related('product', 'material').all()
    serializer_class = RecipeSerializer
    filterset_fields = ['product']


class DailyProductionViewSet(viewsets.ModelViewSet):
    queryset = DailyProduction.objects.select_related('product', 'baker').all()
    serializer_class = DailyProductionSerializer
    filterset_fields = ['date', 'product', 'is_processed']

    def perform_create(self, serializer):
        production = serializer.save(baker=self.request.user)
        # Xom ashyolarni hisobdan chiqarish
        production.process_raw_materials()
        # Tayyor mahsulot omboriga qo'shish
        stock, _ = FinishedProductStock.objects.get_or_create(product=production.product)
        stock.quantity += production.quantity
        stock.save()


class FinishedProductStockViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = FinishedProductStock.objects.select_related('product').all()
    serializer_class = FinishedProductStockSerializer
