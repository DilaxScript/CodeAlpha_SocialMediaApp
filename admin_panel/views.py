# admin_panel/views.py (Create this file)
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAdminUser
from django.db.models import Count, Q
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class AdminDashboard(APIView):
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        try:
            from users.models import CustomUser
            from posts.models import Post, Comment, Like
            
            # Basic statistics
            total_users = CustomUser.objects.count()
            active_users = CustomUser.objects.filter(is_active=True).count()
            total_posts = Post.objects.count()
            total_comments = Comment.objects.count()
            total_likes = Like.objects.count()
            
            # Recent activity (last 7 days)
            week_ago = datetime.now() - timedelta(days=7)
            recent_users = CustomUser.objects.filter(date_joined__gte=week_ago).count()
            recent_posts = Post.objects.filter(created_at__gte=week_ago).count()
            
            data = {
                'stats': {
                    'total_users': total_users,
                    'active_users': active_users,
                    'total_posts': total_posts,
                    'total_comments': total_comments,
                    'total_likes': total_likes,
                    'recent_users': recent_users,
                    'recent_posts': recent_posts,
                }
            }
            
            logger.info(f"📊 Admin dashboard accessed by {request.user.email}")
            return Response(data)
            
        except Exception as e:
            logger.error(f"❌ Error in admin dashboard: {e}")
            return Response(
                {'error': 'Could not fetch dashboard data'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class UserManagement(APIView):
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        try:
            from users.models import CustomUser
            from django.core.paginator import Paginator
            
            users = CustomUser.objects.all().order_by('-date_joined')
            
            # Pagination
            page = request.GET.get('page', 1)
            paginator = Paginator(users, 20)  # 20 users per page
            
            user_data = []
            for user in paginator.get_page(page):
                user_data.append({
                    'id': user.id,
                    'email': user.email,
                    'name': user.name,
                    'is_active': user.is_active,
                    'is_staff': user.is_staff,
                    'date_joined': user.date_joined,
                    'post_count': user.posts.count() if hasattr(user, 'posts') else 0,
                })
            
            return Response({
                'users': user_data,
                'total_pages': paginator.num_pages,
                'current_page': page,
                'total_users': paginator.count
            })
            
        except Exception as e:
            logger.error(f"❌ Error in user management: {e}")
            return Response(
                {'error': 'Could not fetch users'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class UserDetail(APIView):
    permission_classes = [IsAdminUser]
    
    def get(self, request, user_id):
        try:
            from users.models import CustomUser
            
            user = CustomUser.objects.get(id=user_id)
            user_data = {
                'id': user.id,
                'email': user.email,
                'name': user.name,
                'bio': user.bio,
                'is_active': user.is_active,
                'is_staff': user.is_staff,
                'is_superuser': user.is_superuser,
                'date_joined': user.date_joined,
                'last_login': user.last_login,
            }
            
            # Add post statistics if posts app is available
            try:
                from posts.models import Post
                user_data.update({
                    'post_count': user.posts.count(),
                    'comment_count': Comment.objects.filter(user=user).count(),
                    'like_count': Like.objects.filter(user=user).count(),
                })
            except ImportError:
                pass
            
            return Response(user_data)
            
        except CustomUser.DoesNotExist:
            return Response(
                {'error': 'User not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"❌ Error fetching user detail: {e}")
            return Response(
                {'error': 'Could not fetch user data'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class PostManagement(APIView):
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        try:
            from posts.models import Post
            from django.core.paginator import Paginator
            
            posts = Post.objects.all().order_by('-created_at')
            
            # Pagination
            page = request.GET.get('page', 1)
            paginator = Paginator(posts, 15)  # 15 posts per page
            
            post_data = []
            for post in paginator.get_page(page):
                post_data.append({
                    'id': post.id,
                    'user_email': post.user.email,
                    'content': post.content[:100] + "..." if len(post.content) > 100 else post.content,
                    'has_image': bool(post.image),
                    'created_at': post.created_at,
                    'comment_count': post.comments.count(),
                    'like_count': post.likes.count(),
                })
            
            return Response({
                'posts': post_data,
                'total_pages': paginator.num_pages,
                'current_page': page,
                'total_posts': paginator.count
            })
            
        except Exception as e:
            logger.error(f"❌ Error in post management: {e}")
            return Response(
                {'error': 'Could not fetch posts'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class AnalyticsView(APIView):
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        # This would typically contain more complex analytics
        return Response({
            'message': 'Analytics endpoint - implement detailed analytics here',
            'available_endpoints': [
                '/api/admin/dashboard/',
                '/api/admin/users/',
                '/api/admin/posts/',
                '/api/admin/analytics/',
            ]
        })

class ReportsView(APIView):
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        return Response({
            'message': 'Reports endpoint - implement reporting functionality here'
        })