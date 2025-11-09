from django.shortcuts import render
from rest_framework import viewsets, mixins, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q # Required for complex lookups (Search)

from .models import Post, Comment, Like
from .serializers import PostSerializer, CommentSerializer
from .permissions import IsOwnerOrReadOnly # Custom permission

class PostViewSet(viewsets.ModelViewSet):
    serializer_class = PostSerializer
    # Allow read-only access (GET) to anyone, but only owners can edit/delete
    permission_classes = [IsOwnerOrReadOnly] 
    
    def get_queryset(self):
        queryset = Post.objects.all().order_by('-created_at')
        
        # 1. Feature: Feed Logic & User-specific posts
        if self.action == 'list' and self.request.user.is_authenticated:
            # Get IDs of users the current user follows + their own posts
            followed_users_ids = self.request.user.following.values_list('followed_id', flat=True)
            queryset = queryset.filter(Q(user__in=followed_users_ids) | Q(user=self.request.user))

        # 2. Feature: Search Logic
        query = self.request.query_params.get('q', None)
        if query is not None:
            # Filter posts where content contains the query (case-insensitive)
            queryset = queryset.filter(Q(content__icontains=query) | Q(user__name__icontains=query))
        
        # Ensure only active posts are shown to regular users 
        if self.action != 'admin_list': 
             queryset = queryset.filter(is_active=True)
             
        return queryset.order_by('-created_at').distinct()

    # Automatically set the user field to the logged-in user when creating a post
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    # Nested action for COMMENTS (POST /api/posts/{post_id}/comment/)
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def comment(self, request, pk=None):
        post = self.get_object()
        
        # FIXED: Handle both 'text' and 'content' fields for compatibility
        text = request.data.get('text') or request.data.get('content')
        
        if not text:
            return Response(
                {'error': 'Comment text is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # FIXED: Use 'text' field as defined in the model
        comment = Comment.objects.create(
            post=post,
            user=request.user,
            text=text
        )
        
        # Return the created comment data
        serializer = CommentSerializer(comment)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    # Nested action for LIKES (POST /api/posts/{post_id}/like/)
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def toggle_like(self, request, pk=None):
        post = self.get_object()
        user = request.user
        
        try:
            like = Like.objects.get(post=post, user=user)
            like.delete()
            liked = False
        except Like.DoesNotExist:
            Like.objects.create(post=post, user=user)
            liked = True
            
        return Response({
            'liked': liked,
            'like_count': post.likes.count()
        }, status=status.HTTP_200_OK)

# 2. Comment ViewSet (Deletion is the main action here)
class CommentViewSet(mixins.DestroyModelMixin, viewsets.GenericViewSet):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [IsOwnerOrReadOnly] # Only comment owner can delete