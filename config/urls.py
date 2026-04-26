from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/production/', include('production.urls')),
    path('api/trade/', include('trade.urls')),
    path('api/points/', include('points.urls')),
    path('api/accounting/', include('accounting.urls')),
    path('api/dashboard/', include('dashboard.urls')),
    path('api/hr/', include('hr.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
