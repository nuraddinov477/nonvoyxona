from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register('cash-registers', views.CashRegisterViewSet)
router.register('transactions', views.TransactionViewSet)
router.register('transaction-categories', views.TransactionCategoryViewSet)
router.register('debtors', views.DebtorViewSet)
router.register('creditors', views.CreditorViewSet)

urlpatterns = [
    path('profit-loss/', views.profit_loss, name='profit-loss'),
    path('profit-loss-detail/', views.profit_loss_detail, name='profit-loss-detail'),
    path('', include(router.urls)),
]
