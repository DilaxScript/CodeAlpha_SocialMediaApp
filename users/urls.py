# users/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserRegistrationView, UserProfileViewSet

# Create a router for viewsets (handles list, retrieve, update/patch)
router = DefaultRouter()
router.register(r'profile', UserProfileViewSet, basename='profile')

urlpatterns = [
    # API for user registration
    path('register/', UserRegistrationView.as_view(), name='user-register'),
    
    # API for user profile management
    path('', include(router.urls)),
]

# users/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserRegistrationView, UserProfileViewSet, FollowViewSet

# Create a router for viewsets
router = DefaultRouter()
# UserProfileViewSet handles listing all users and retrieving single profiles (e.g., /api/users/{id}/)
router.register(r'profiles', UserProfileViewSet, basename='user-profile') 
# FollowViewSet handles the follow/unfollow action
router.register(r'', FollowViewSet, basename='follow') # Uses the root of the user app

urlpatterns = [
    # API for user registration
    path('register/', UserRegistrationView.as_view(), name='user-register'),
    
    # API for profile management and general user list
    path('', include(router.urls)),
]
# users/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserRegistrationView, UserProfileViewSet, FollowViewSet, UserSearchView # 🟢 Import UserSearchView

router = DefaultRouter()
router.register(r'profiles', UserProfileViewSet, basename='user-profile') 
router.register(r'', FollowViewSet, basename='follow') 

urlpatterns = [
    path('register/', UserRegistrationView.as_view(), name='user-register'),
    # 🟢 NEW: User Search Endpoint
    path('search/', UserSearchView.as_view(), name='user-search'), 
    
    path('', include(router.urls)),
]