from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register('sales', views.SaleViewSet)
router.register('unsold', views.UnsoldProductViewSet)

urlpatterns = [
    path('reports/', views.trade_reports, name='trade-reports'),
    path('', include(router.urls)),
]
