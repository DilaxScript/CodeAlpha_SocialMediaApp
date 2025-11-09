#!/bin/bash
echo "🔧 Fixing URLs Configuration..."

# Backup current urls.py
cp social_media_backend/urls.py social_media_backend/urls.py.backup

# Create fixed urls.py
cat > social_media_backend/urls.py << 'URLS'
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView, TokenVerifyView

def health_check(request):
    return JsonResponse({
        'status': 'healthy', 
        'service': 'Social Media Backend',
        'version': '1.0.0'
    })

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/admin/', include('admin_panel.urls')), 
    path('api/users/', include('users.urls')),
    path('api/', include('posts.urls')),  
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    path('api/health/', health_check, name='health_check'),
]

# Serve static and media files in development
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
URLS

echo "✅ URLs configuration updated!"
echo "🔄 Restarting server..."
python manage.py runserver
