from django.db import models

# Create your models here.
from django.db import models
from django.conf import settings # Imports the AUTH_USER_MODEL ('users.CustomUser')
from django.utils import timezone

# 1. Post Model (A single shared item)
class Post(models.Model):
    # Link the post to the user who created it
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='posts')
    
    # Text content (allows null=True for image-only posts)
    content = models.TextField(blank=True, null=True, max_length=500) 
    
    # Image upload (uses the MEDIA_ROOT setting we configured)
    image = models.ImageField(upload_to='post_images/', blank=True, null=True)
    
    # Tracking
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at'] # Shows newest posts first
    
    def __str__(self):
        return f'{self.user.name} - Post {self.id}'
    
    @property
    def comment_count(self):
        # A property to easily get the number of comments for use in serializers
        return self.comments.count()
    
    @property
    def like_count(self):
        # A property to easily get the number of likes
        return self.likes.count()


# 2. Comment Model (User response to a post)
class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='comments')
    text = models.TextField(max_length=300)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['created_at'] # Shows oldest comments first

    def __str__(self):
        return f'Comment by {self.user.name} on Post {self.post.id}'


# 3. Like Model (User expressing appreciation for a post)
class Like(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='likes')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='likes')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # Ensures a user can only like a post once
        unique_together = ('post', 'user') 

    def __str__(self):
        return f'{self.user.name} likes Post {self.post.id}'
    
    from django.db import models
from django.conf import settings # Imports the AUTH_USER_MODEL ('users.CustomUser')
from django.utils import timezone

# 1. Post Model (A single shared item)
class Post(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='posts')
    content = models.TextField(blank=True, null=True, max_length=500) 
    image = models.ImageField(upload_to='post_images/', blank=True, null=True)
    
    # 🟢 ADDED: Field for Admin Moderation
    is_active = models.BooleanField(default=True) 
    
    # Tracking
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at'] # Shows newest posts first
    
    def __str__(self):
        return f'{self.user.name} - Post {self.id}'
    
    @property
    def comment_count(self):
        return self.comments.count()
    
    @property
    def like_count(self):
        return self.likes.count()


# 2. Comment Model (User response to a post)
class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='comments')
    text = models.TextField(max_length=300)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['created_at'] 

    def __str__(self):
        return f'Comment by {self.user.name} on Post {self.post.id}'


# 3. Like Model (User expressing appreciation for a post)
class Like(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='likes')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='likes')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('post', 'user') 

    def __str__(self):
        return f'{self.user.name} likes Post {self.post.id}'