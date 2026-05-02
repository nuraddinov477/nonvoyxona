from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register('categories', views.RawMaterialCategoryViewSet)
router.register('materials', views.RawMaterialViewSet)
router.register('material-incomes', views.RawMaterialIncomeViewSet)
router.register('products', views.ProductViewSet)
router.register('recipes', views.RecipeViewSet)
router.register('daily-production', views.DailyProductionViewSet)
router.register('stock', views.FinishedProductStockViewSet)

urlpatterns = [
    path('export/materials/', views.export_materials_excel, name='export-materials-excel'),
    path('', include(router.urls)),
]
