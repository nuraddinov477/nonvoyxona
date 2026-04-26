from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register('sales-points', views.SalesPointViewSet)
router.register('stock', views.PointStockViewSet)
router.register('transfers', views.ProductTransferViewSet)
router.register('returns', views.PointReturnViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
