from rest_framework import generics, viewsets, status, filters
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAuthenticatedOrReadOnly
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count
from django.db import transaction

from .models import CustomUser, UserFollow
from .serializers import (
    UserRegistrationSerializer, 
    UserProfileSerializer,
    PublicUserProfileSerializer,
    UserFollowSerializer,
    UserSearchSerializer,
    UserBasicSerializer,
    ChangePasswordSerializer,
    UpdateEmailSerializer
)

# 1. Registration View (POST /api/users/register/)
class UserRegistrationView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]  # Anyone can register
    parser_classes = [JSONParser]  # Only JSON for registration

    def create(self, request, *args, **kwargs):
        """Override to provide better response format."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        with transaction.atomic():
            user = serializer.save()
        
        # Return user data without password
        response_serializer = UserProfileSerializer(
            user, 
            context=self.get_serializer_context()
        )
        
        return Response(
            {
                'detail': 'User registered successfully.',
                'user': response_serializer.data
            },
            status=status.HTTP_201_CREATED
        )

# 2. Profile ViewSet (Handles listing, retrieving, and editing OWN profile)
class UserProfileViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = CustomUser.objects.all().select_related()
    permission_classes = [IsAuthenticatedOrReadOnly]  # ✅ Better permission handling
    parser_classes = [MultiPartParser, FormParser, JSONParser]  # ✅ For file uploads
    
    def get_serializer_class(self):
        """Use different serializers based on action and permissions."""
        if self.action == 'me' and self.request.method in ['PATCH', 'PUT']:
            return UserProfileSerializer
        elif self.action in ['list', 'retrieve']:
            # Public view for list/retrieve, full view for own profile
            if (self.request.user.is_authenticated and 
                self.action == 'retrieve' and 
                str(self.request.user.id) == self.kwargs.get('pk')):
                return UserProfileSerializer
            return PublicUserProfileSerializer
        return UserProfileSerializer

    def get_queryset(self):
        """Optimize queryset based on action."""
        queryset = CustomUser.objects.all()
        
        if self.action == 'list':
            # Only return active users for list view
            queryset = queryset.filter(is_active=True)
        
        return queryset.select_related().prefetch_related('followers', 'following')

    def get_serializer_context(self):
        """Add request context to serializer."""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    # Custom action to view/edit OWN profile (GET/PATCH /api/users/profiles/me/)
    @action(detail=False, methods=['get', 'patch', 'put'], permission_classes=[IsAuthenticated])
    def me(self, request):
        if request.method == 'GET':
            serializer = self.get_serializer(request.user)
            return Response(serializer.data)
        
        elif request.method in ['PATCH', 'PUT']:
            try:
                with transaction.atomic():
                    serializer = self.get_serializer(
                        request.user, 
                        data=request.data, 
                        partial=(request.method == 'PATCH')
                    )
                    serializer.is_valid(raise_exception=True)
                    updated_user = serializer.save()
                
                # Return updated data
                response_serializer = self.get_serializer(updated_user)
                return Response(
                    {
                        'detail': 'Profile updated successfully.',
                        'user': response_serializer.data
                    },
                    status=status.HTTP_200_OK
                )
                
            except Exception as e:
                return Response(
                    {'detail': f'Error updating profile: {str(e)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )

    # ✅ Custom action to get user's followers
    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticatedOrReadOnly])
    def followers(self, request, pk=None):
        """Get list of users who follow this user."""
        user = self.get_object()
        followers = user.followers.all().select_related('follower')
        page = self.paginate_queryset(followers)
        
        if page is not None:
            serializer = UserFollowSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = UserFollowSerializer(followers, many=True)
        return Response(serializer.data)

    # ✅ Custom action to get users this user is following
    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticatedOrReadOnly])
    def following(self, request, pk=None):
        """Get list of users this user follows."""
        user = self.get_object()
        following = user.following.all().select_related('followed')
        page = self.paginate_queryset(following)
        
        if page is not None:
            serializer = UserFollowSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = UserFollowSerializer(following, many=True)
        return Response(serializer.data)

    # ✅ Custom action to check if current user follows this profile
    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def check_follow(self, request, pk=None):
        """Check if current user follows this profile."""
        target_user = self.get_object()
        is_following = request.user.is_following(target_user)
        
        return Response({
            'is_following': is_following,
            'user_id': target_user.id,
            'user_name': target_user.name
        })

# 3. Follow ViewSet (Handles follow/unfollow functionality)
class FollowViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    queryset = UserFollow.objects.all()

    # POST /api/users/{user_id}/follow/
    @action(detail=True, methods=['post'])
    def follow(self, request, pk=None):
        """Follow or unfollow a user."""
        target_user = get_object_or_404(CustomUser, pk=pk, is_active=True)
        follower = request.user

        if follower == target_user:
            return Response(
                {"detail": "You cannot follow yourself."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            with transaction.atomic():
                # Use model methods for consistency
                if follower.is_following(target_user):
                    # Unfollow
                    success = follower.unfollow(target_user)
                    if success:
                        return Response(
                            {"detail": f"Unfollowed {target_user.name}."}, 
                            status=status.HTTP_200_OK
                        )
                else:
                    # Follow
                    success = follower.follow(target_user)
                    if success:
                        return Response(
                            {"detail": f"Now following {target_user.name}."}, 
                            status=status.HTTP_201_CREATED
                        )
                
                return Response(
                    {"detail": "Operation failed."}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            return Response(
                {"detail": f"Error: {str(e)}"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

    # ✅ GET /api/users/{user_id}/follow/status/
    @action(detail=True, methods=['get'])
    def status(self, request, pk=None):
        """Get follow status between current user and target user."""
        target_user = get_object_or_404(CustomUser, pk=pk, is_active=True)
        is_following = request.user.is_following(target_user)
        
        return Response({
            'is_following': is_following,
            'target_user_id': target_user.id,
            'target_user_name': target_user.name
        })

    # ✅ GET /api/users/follow/suggestions/
    @action(detail=False, methods=['get'])
    def suggestions(self, request):
        """Get follow suggestions for current user."""
        # Get users that current user doesn't follow and are not themselves
        following_ids = request.user.following.values_list('followed_id', flat=True)
        suggested_users = CustomUser.objects.filter(
            is_active=True
        ).exclude(
            Q(id__in=following_ids) | Q(id=request.user.id)
        ).order_by('?')[:10]  # Random 10 users
        
        serializer = UserBasicSerializer(suggested_users, many=True)
        return Response(serializer.data)

# 4. User Search View (GET /api/users/search/?q=query)
class UserSearchView(generics.ListAPIView):
    serializer_class = UserSearchSerializer  # ✅ Use lightweight serializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'email', 'bio']
    ordering_fields = ['name', 'date_joined', 'follower_count']
    ordering = ['name']
    
    def get_queryset(self):
        queryset = CustomUser.objects.filter(is_active=True)
        query = self.request.query_params.get('q', None)
        
        if query:
            # More comprehensive search
            queryset = queryset.filter(
                Q(name__icontains=query) | 
                Q(email__icontains=query) |
                Q(bio__icontains=query)
            )
        
        return queryset.select_related()

    def list(self, request, *args, **kwargs):
        """Override to provide search metadata."""
        response = super().list(request, *args, **kwargs)
        
        # Add search metadata
        query = self.request.query_params.get('q', '')
        response.data = {
            'query': query,
            'count': len(response.data),
            'results': response.data
        }
        
        return response

# ✅ 5. Change Password View
class ChangePasswordView(generics.UpdateAPIView):
    serializer_class = ChangePasswordSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['put', 'patch']

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        with transaction.atomic():
            user = serializer.save()
        
        return Response(
            {'detail': 'Password updated successfully.'},
            status=status.HTTP_200_OK
        )

# ✅ 6. Update Email View
class UpdateEmailView(generics.UpdateAPIView):
    serializer_class = UpdateEmailSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['put', 'patch']

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        serializer = self.get_serializer(
            self.get_object(), 
            data=request.data, 
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        
        with transaction.atomic():
            user = serializer.save()
        
        return Response(
            {
                'detail': 'Email updated successfully.',
                'new_email': user.email
            },
            status=status.HTTP_200_OK
        )

# ✅ 7. User Stats View
class UserStatsView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserProfileSerializer

    def get(self, request, *args, **kwargs):
        """Get user statistics."""
        user = request.user
        
        stats = {
            'user_id': user.id,
            'post_count': user.post_set.count(),  # Assuming Post model exists
            'follower_count': user.follower_count,
            'following_count': user.following_count,
            'account_age_days': (timezone.now() - user.date_joined).days
        }
        
        return Response(stats)