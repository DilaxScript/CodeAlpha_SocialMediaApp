# File: users/models.py

from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone
import os
from django.core.exceptions import ValidationError

# --- 1. Custom Manager Class (Handles User and Admin creation) ---
class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        
        # ✅ Ensure name is provided
        if not extra_fields.get('name'):
            raise ValueError('The Name field must be set')
            
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)

# --- 2. Profile Picture Upload Path Function ---
def user_profile_picture_path(instance, filename):
    """
    ✅ Generate upload path for profile pictures: 
    profile_pics/user_{id}/profile_picture.{ext}
    """
    # Get file extension
    ext = filename.split('.')[-1].lower()
    
    # ✅ Validate file extension
    valid_extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp']
    if ext not in valid_extensions:
        raise ValidationError(f'Unsupported file extension. Allowed: {", ".join(valid_extensions)}')
    
    # ✅ Generate unique filename
    filename = f'profile_picture.{ext}'
    return f'profile_pics/user_{instance.id}/{filename}'

# --- 3. Custom User Model Class (The actual User table) ---
class CustomUser(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True, verbose_name='email address')
    name = models.CharField(max_length=150, verbose_name='full name')
    
    # ✅ Enhanced Profile Fields
    bio = models.TextField(
        max_length=500, 
        blank=True, 
        null=True,
        verbose_name='biography',
        help_text='Tell us about yourself (max 500 characters)'
    )
    
    # ✅ Enhanced Profile Picture Field with better configuration
    profile_picture = models.ImageField(
        upload_to=user_profile_picture_path,
        blank=True,
        null=True,
        verbose_name='profile picture',
        help_text='Upload a profile picture (JPG, PNG, GIF, WEBP)',
        # ✅ Add image dimensions validation (optional)
        # width_field='profile_picture_width',
        # height_field='profile_picture_height',
    )
    
    # ✅ Optional: Store image dimensions
    # profile_picture_width = models.IntegerField(blank=True, null=True)
    # profile_picture_height = models.IntegerField(blank=True, null=True)

    # Admin Role Flags
    is_staff = models.BooleanField(
        default=False,
        verbose_name='staff status',
        help_text='Designates whether the user can log into this admin site.'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='active',
        help_text='Designates whether this user should be treated as active. Unselect this instead of deleting accounts.'
    )
    date_joined = models.DateTimeField(default=timezone.now, verbose_name='date joined')

    # ✅ Additional useful fields
    last_login = models.DateTimeField(blank=True, null=True, verbose_name='last login')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='last updated')

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']

    objects = CustomUserManager()

    class Meta:
        verbose_name = 'user'
        verbose_name_plural = 'users'
        ordering = ['-date_joined']

    def __str__(self):
        return self.email

    def get_full_name(self):
        """Return the full name of the user."""
        return self.name

    def get_short_name(self):
        """Return the short name for the user (first name)."""
        return self.name.split()[0] if self.name else self.email

    # ✅ Property to get profile picture URL
    @property
    def profile_picture_url(self):
        """Return the profile picture URL or None if not set."""
        if self.profile_picture and hasattr(self.profile_picture, 'url'):
            return self.profile_picture.url
        return None

    # ✅ Property to get follower count
    @property
    def follower_count(self):
        """Return the number of followers."""
        return self.followers.count()

    # ✅ Property to get following count
    @property
    def following_count(self):
        """Return the number of users this user is following."""
        return self.following.count()

    # ✅ Method to check if a user is following another user
    def is_following(self, user):
        """Check if this user is following the given user."""
        return self.following.filter(followed=user).exists()

    # ✅ Method to follow a user
    def follow(self, user):
        """Follow a user if not already following."""
        if self != user and not self.is_following(user):
            UserFollow.objects.create(follower=self, followed=user)
            return True
        return False

    # ✅ Method to unfollow a user
    def unfollow(self, user):
        """Unfollow a user if currently following."""
        if self.is_following(user):
            UserFollow.objects.get(follower=self, followed=user).delete()
            return True
        return False

    # ✅ Override save method to handle file cleanup
    def save(self, *args, **kwargs):
        # Delete old profile picture when new one is uploaded
        if self.pk:
            try:
                old_instance = CustomUser.objects.get(pk=self.pk)
                if old_instance.profile_picture and old_instance.profile_picture != self.profile_picture:
                    # Delete the old file
                    old_instance.profile_picture.delete(save=False)
            except CustomUser.DoesNotExist:
                pass
        
        super().save(*args, **kwargs)

    # ✅ Override delete method to clean up files
    def delete(self, *args, **kwargs):
        # Delete profile picture file
        if self.profile_picture:
            self.profile_picture.delete(save=False)
        super().delete(*args, **kwargs)

# --- 4. Follow System Model (The connection between users) ---
class UserFollow(models.Model):
    follower = models.ForeignKey(
        CustomUser, 
        related_name='following', 
        on_delete=models.CASCADE,
        verbose_name='follower'
    )
    followed = models.ForeignKey(
        CustomUser, 
        related_name='followers', 
        on_delete=models.CASCADE,
        verbose_name='followed user'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='followed at')

    class Meta:
        unique_together = ('follower', 'followed')
        verbose_name = 'user follow'
        verbose_name_plural = 'user follows'
        ordering = ['-created_at']
        
        # ✅ Add indexes for better performance
        indexes = [
            models.Index(fields=['follower', 'followed']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f'{self.follower.name} follows {self.followed.name}'

    def clean(self):
        """Prevent users from following themselves."""
        if self.follower == self.followed:
            raise ValidationError('Users cannot follow themselves.')

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

# --- 5. Signal to create user profile (Optional but recommended) ---
from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=CustomUser)
def create_user_profile(sender, instance, created, **kwargs):
    """
    ✅ Signal to perform actions after a user is created.
    This can be used to create user settings, send welcome emails, etc.
    """
    if created:
        # Example: Create user settings or send welcome email
        # UserSettings.objects.create(user=instance)
        print(f"New user created: {instance.email}")