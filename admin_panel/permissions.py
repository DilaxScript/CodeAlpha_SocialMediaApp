from rest_framework import permissions

class IsSuperuser(permissions.BasePermission):
    """
    Custom permission to only allow access to users who are Superusers (is_superuser=True).
    """
    def has_permission(self, request, view):
        # Check if the user is authenticated and if they are a superuser
        return request.user and request.user.is_superuser