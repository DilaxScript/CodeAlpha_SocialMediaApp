from rest_framework import serializers
from .models import Post, Comment, Like

# 1. Comment Serializer
class CommentSerializer(serializers.ModelSerializer):
    # Field to display the name of the user who commented
    user_name = serializers.CharField(source='user.name', read_only=True)
    # Field to link the comment back to the user's profile
    user_id = serializers.IntegerField(source='user.id', read_only=True)

    class Meta:
        model = Comment
        # FIXED: Using 'text' field as defined in the model
        fields = ('id', 'post', 'user_id', 'user_name', 'text', 'created_at') 
        read_only_fields = ('user', 'post', 'created_at') # User and Post are set automatically in the view

# 2. Post Serializer
class PostSerializer(serializers.ModelSerializer):
    # Read-only fields for display
    user_name = serializers.CharField(source='user.name', read_only=True)
    user_id = serializers.IntegerField(source='user.id', read_only=True) 
    
    # Read-only fields derived from the @property methods in the Post model
    like_count = serializers.IntegerField(read_only=True) 
    comment_count = serializers.IntegerField(read_only=True) 
    
    # Add is_liked field to check if current user liked the post
    is_liked = serializers.SerializerMethodField()
    
    # Include comments for the post
    comments = CommentSerializer(many=True, read_only=True)

    class Meta:
        model = Post
        fields = (
            'id', 
            'user', 
            'user_id',
            'user_name', 
            'content', 
            'image', 
            'created_at', 
            'like_count', 
            'comment_count',
            'is_liked',
            'comments'
        )
        read_only_fields = ('user', 'created_at', 'like_count', 'comment_count')

    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()
        return False