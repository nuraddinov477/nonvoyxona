from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register('users', views.UserViewSet)

urlpatterns = [
    path('login/', views.login_view, name='login'),
    path('me/', views.me_view, name='me'),
    path('', include(router.urls)),
]
