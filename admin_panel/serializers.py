from rest_framework import serializers
from django.contrib.auth import get_user_model
from posts.models import Post, Comment

CustomUser = get_user_model()

# 1. Admin User Management Serializer
class AdminUserSerializer(serializers.ModelSerializer):
    post_count = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomUser
        fields = ('id', 'email', 'name', 'is_active', 'is_staff', 'date_joined', 'post_count')
        read_only_fields = ('date_joined',)
    
    def get_post_count(self, obj):
        return obj.posts.count()

# 2. Admin Post/Content Management Serializer
class AdminPostSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.name', read_only=True)
    comment_count = serializers.IntegerField(read_only=True)
    like_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Post
        fields = ('id', 'user', 'user_email', 'user_name', 'content', 'image', 'created_at', 'is_active', 'comment_count', 'like_count')
        read_only_fields = ('user', 'created_at', 'comment_count', 'like_count')

# 3. Admin Comment Management Serializer
class AdminCommentSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.name', read_only=True)
    post_id = serializers.IntegerField(source='post.id', read_only=True)

    class Meta:
        model = Comment
        fields = ('id', 'post', 'post_id', 'user', 'user_email', 'user_name', 'text', 'created_at')
        read_only_fields = ('user', 'post', 'created_at')