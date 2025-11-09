from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)

def health_check(request):
    """✅ Health check endpoint"""
    return JsonResponse({
        'status': 'healthy', 
        'service': 'Social Media Backend',
        'version': '1.0.0'
    })

urlpatterns = [
    # Django Admin
    path('admin/', admin.site.urls),
    
    # API Endpoints
    path('api/admin/', include('admin_panel.urls')), 
    path('api/users/', include('users.urls')),
    path('api/', include('posts.urls')),  
    
    # JWT Authentication
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    
    # Health Check
    path('api/health/', health_check, name='health_check'),
]

# ✅ Serve static and media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# ✅ Use inline error handlers (optional - remove if not needed)
def custom_404_handler(request, exception=None):
    return JsonResponse({'error': 'Not found', 'status_code': 404}, status=404)

def custom_500_handler(request):
    return JsonResponse({'error': 'Server error', 'status_code': 500}, status=500)

handler404 = custom_404_handler
handler500 = custom_500_handler