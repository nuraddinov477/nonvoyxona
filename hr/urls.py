from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register('positions', views.PositionViewSet)
router.register('employees', views.EmployeeViewSet)
router.register('piecework-rates', views.PieceworkRateViewSet)
router.register('attendance', views.AttendanceViewSet)
router.register('bonuses', views.BonusViewSet)
router.register('penalties', views.PenaltyViewSet)
router.register('advances', views.AdvanceViewSet)
router.register('salary-payments', views.SalaryPaymentViewSet)

urlpatterns = [
    path('summary/', views.hr_dashboard, name='hr-summary'),
    path('', include(router.urls)),
]
