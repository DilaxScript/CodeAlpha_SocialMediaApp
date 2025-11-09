# admin_panel/urls.py (Create this file)
from django.urls import path
from . import views

app_name = 'admin_panel'

urlpatterns = [
    path('dashboard/', views.AdminDashboard.as_view(), name='dashboard'),
    path('users/', views.UserManagement.as_view(), name='user_management'),
    path('users/<int:user_id>/', views.UserDetail.as_view(), name='user_detail'),
    path('posts/', views.PostManagement.as_view(), name='post_management'),
    path('analytics/', views.AnalyticsView.as_view(), name='analytics'),
    path('reports/', views.ReportsView.as_view(), name='reports'),
]