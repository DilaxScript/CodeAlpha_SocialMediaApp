from rest_framework import serializers
from django.core.exceptions import ValidationError
from .models import CustomUser, UserFollow
import os

# Serializer for User Registration
class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        style={'input_type': 'password'},
        help_text='Password must be at least 8 characters long'
    )
    password_confirm = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'},
        help_text='Enter the same password as above for verification'
    )

    class Meta:
        model = CustomUser
        fields = ('email', 'name', 'password', 'password_confirm')
        extra_kwargs = {
            'password': {'write_only': True},
            'password_confirm': {'write_only': True}
        }

    def validate_email(self, value):
        """Validate email uniqueness and format."""
        if CustomUser.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value.lower()

    def validate_name(self, value):
        """Validate name field."""
        if len(value.strip()) < 2:
            raise serializers.ValidationError("Name must be at least 2 characters long.")
        return value.strip()

    def validate(self, data):
        """Validate that passwords match."""
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({
                'password_confirm': "Passwords do not match."
            })
        return data

    def create(self, validated_data):
        """Create user with validated data."""
        # Remove password_confirm from validated_data
        validated_data.pop('password_confirm', None)
        
        user = CustomUser.objects.create_user(
            email=validated_data['email'],
            name=validated_data['name'],
            password=validated_data['password']
        )
        return user

# Serializer for viewing and editing the user's own profile AND other profiles
class UserProfileSerializer(serializers.ModelSerializer):
    # ✅ Dynamic fields for follow system
    is_following = serializers.SerializerMethodField()
    follower_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    
    # ✅ Profile picture URL field for easy frontend access
    profile_picture_url = serializers.SerializerMethodField()
    
    # ✅ Separate field for profile picture upload (with validation)
    profile_picture = serializers.ImageField(
        required=False,
        allow_null=True,
        write_only=True,  # ✅ Only for input, not output
        help_text='Upload a profile picture (JPG, PNG, GIF, WEBP)'
    )

    class Meta:
        model = CustomUser
        fields = (
            'id', 'email', 'name', 'bio', 'profile_picture', 'profile_picture_url',
            'date_joined', 'is_following', 'follower_count', 'following_count',
            'last_login', 'updated_at'
        )
        read_only_fields = (
            'id', 'email', 'date_joined', 'last_login', 'updated_at',
            'is_following', 'follower_count', 'following_count', 'profile_picture_url'
        )
        extra_kwargs = {
            'bio': {
                'required': False,
                'allow_blank': True,
                'help_text': 'Tell us about yourself (max 500 characters)'
            },
            'name': {
                'help_text': 'Your full name'
            }
        }

    def get_is_following(self, obj):
        """Check if the current user is following this profile."""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            # ✅ Use the model method for consistency
            return request.user.is_following(obj)
        return False
    
    def get_follower_count(self, obj):
        """Get follower count using model property."""
        return obj.follower_count
    
    def get_following_count(self, obj):
        """Get following count using model property."""
        return obj.following_count
    
    def get_profile_picture_url(self, obj):
        """Get profile picture URL using model property."""
        return obj.profile_picture_url

    def validate_profile_picture(self, value):
        """Validate profile picture file."""
        if value:
            # ✅ Check file size (max 5MB)
            max_size = 5 * 1024 * 1024  # 5MB
            if value.size > max_size:
                raise serializers.ValidationError(
                    f"File size too large. Maximum size is {max_size//1024//1024}MB."
                )
            
            # ✅ Check file extension
            valid_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
            ext = os.path.splitext(value.name)[1].lower()
            if ext not in valid_extensions:
                raise serializers.ValidationError(
                    f"Unsupported file format. Supported formats: {', '.join(valid_extensions)}"
                )
            
            # ✅ Check file name length
            if len(value.name) > 100:
                raise serializers.ValidationError("File name too long.")
                
        return value

    def validate_bio(self, value):
        """Validate bio length."""
        if value and len(value) > 500:
            raise serializers.ValidationError("Bio cannot exceed 500 characters.")
        return value

    def validate_name(self, value):
        """Validate name field."""
        value = value.strip()
        if len(value) < 2:
            raise serializers.ValidationError("Name must be at least 2 characters long.")
        if len(value) > 150:
            raise serializers.ValidationError("Name cannot exceed 150 characters.")
        return value

    def update(self, instance, validated_data):
        """Update user profile with proper file handling."""
        # ✅ Handle profile picture separately to leverage model's save method
        profile_picture = validated_data.pop('profile_picture', None)
        
        # Update other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Update profile picture if provided
        if profile_picture is not None:
            instance.profile_picture = profile_picture
        
        instance.save()
        return instance

# ✅ Serializer for public user profiles (limited fields)
class PublicUserProfileSerializer(serializers.ModelSerializer):
    profile_picture_url = serializers.SerializerMethodField()
    follower_count = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomUser
        fields = (
            'id', 'name', 'bio', 'profile_picture_url', 
            'follower_count', 'date_joined'
        )
        read_only_fields = fields

    def get_profile_picture_url(self, obj):
        return obj.profile_picture_url
    
    def get_follower_count(self, obj):
        return obj.follower_count

# ✅ Serializer for follow/unfollow actions
class UserFollowSerializer(serializers.ModelSerializer):
    follower_name = serializers.CharField(source='follower.name', read_only=True)
    followed_name = serializers.CharField(source='followed.name', read_only=True)
    follower_email = serializers.CharField(source='follower.email', read_only=True)
    followed_email = serializers.CharField(source='followed.email', read_only=True)

    class Meta:
        model = UserFollow
        fields = (
            'id', 'follower', 'follower_name', 'follower_email',
            'followed', 'followed_name', 'followed_email', 'created_at'
        )
        read_only_fields = ('id', 'created_at', 'follower_name', 'followed_name')

    def validate(self, data):
        """Prevent users from following themselves."""
        request = self.context.get('request')
        if request and request.user == data.get('followed'):
            raise serializers.ValidationError({
                'followed': 'You cannot follow yourself.'
            })
        return data

# ✅ Serializer for user search results
class UserSearchSerializer(serializers.ModelSerializer):
    profile_picture_url = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomUser
        fields = ('id', 'name', 'email', 'profile_picture_url', 'bio')
        read_only_fields = fields

    def get_profile_picture_url(self, obj):
        return obj.profile_picture_url

# ✅ Lightweight serializer for dropdowns or lists
class UserBasicSerializer(serializers.ModelSerializer):
    profile_picture_url = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomUser
        fields = ('id', 'name', 'email', 'profile_picture_url')
        read_only_fields = fields

    def get_profile_picture_url(self, obj):
        return obj.profile_picture_url
    
    # ✅ Serializer for changing password
class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, write_only=True, min_length=8)
    confirm_password = serializers.CharField(required=True, write_only=True)

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is incorrect.")
        return value

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({
                'confirm_password': "New passwords do not match."
            })
        return data

    def save(self, **kwargs):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user

# ✅ Serializer for updating email
class UpdateEmailSerializer(serializers.ModelSerializer):
    current_password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = CustomUser
        fields = ('email', 'current_password')

    def validate_current_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value

    def validate_email(self, value):
        user = self.context['request'].user
        if CustomUser.objects.filter(email__iexact=value).exclude(id=user.id).exists():
            raise serializers.ValidationError("This email is already in use.")
        return value.lower()