from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register('users', views.UserViewSet)
router.register('boss-chat', views.BossChatViewSet, basename='boss-chat')

urlpatterns = [
    path('login/', views.login_view, name='login'),
    path('me/', views.me_view, name='me'),
    path('profile/', views.profile_view, name='profile'),
    path('boss-chat/mark-read/', views.mark_messages_read, name='mark-read'),
    path('boss-chat/unread-count/', views.unread_count, name='unread-count'),
    path('', include(router.urls)),
]
