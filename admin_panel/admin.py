# admin_panel/admin.py (Final Fixed Version)
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.html import format_html
import logging

logger = logging.getLogger(__name__)

# Customize admin interface
admin.site.site_header = "Social Media Admin Panel"
admin.site.site_title = "Social Media Administration"
admin.site.index_title = "Dashboard"

# Register your models here
try:
    from users.models import CustomUser
    
    @admin.register(CustomUser)
    class CustomUserAdmin(UserAdmin):
        list_display = ('email', 'name', 'is_active', 'is_staff', 'is_superuser', 'date_joined', 'post_count')
        list_filter = ('is_active', 'is_staff', 'is_superuser', 'date_joined')
        search_fields = ('email', 'name')
        ordering = ('-date_joined',)
        readonly_fields = ('date_joined', 'last_login', 'profile_picture_preview')
        
        fieldsets = (
            (None, {'fields': ('email', 'password')}),
            ('Personal Info', {'fields': ('name', 'profile_picture', 'profile_picture_preview', 'bio')}),
            ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
            ('Important Dates', {'fields': ('last_login', 'date_joined')}),
        )
        
        add_fieldsets = (
            (None, {
                'classes': ('wide',),
                'fields': ('email', 'name', 'password1', 'password2', 'is_active', 'is_staff', 'is_superuser'),
            }),
        )
        
        def get_readonly_fields(self, request, obj=None):
            if obj:  # Editing an existing object
                return self.readonly_fields + ('email',)
            return self.readonly_fields
        
        def profile_picture_preview(self, obj):
            if obj.profile_picture:
                return format_html('<img src="{}" width="50" height="50" style="border-radius: 50%;" />', obj.profile_picture.url)
            return "No Image"
        profile_picture_preview.short_description = 'Profile Picture'
        
        def post_count(self, obj):
            try:
                return obj.posts.count()
            except:
                return 0
        post_count.short_description = 'Posts'
    
    logger.info("✅ CustomUser model registered in admin")
    
except ImportError as e:
    logger.error(f"❌ Could not import CustomUser: {e}")

try:
    from posts.models import Post, Comment, Like
    
    @admin.register(Post)
    class PostAdmin(admin.ModelAdmin):
        list_display = ('id', 'user_email', 'content_preview', 'image_preview', 'created_at', 'comment_count', 'like_count')
        list_filter = ('created_at', 'user')
        search_fields = ('content', 'user__email')
        readonly_fields = ('created_at', 'updated_at', 'image_preview')
        list_per_page = 20
        
        def user_email(self, obj):
            return obj.user.email
        user_email.short_description = 'User'
        
        def content_preview(self, obj):
            return obj.content[:50] + "..." if len(obj.content) > 50 else obj.content
        content_preview.short_description = 'Content'
        
        def image_preview(self, obj):
            if obj.image:
                return format_html('<img src="{}" width="50" height="50" />', obj.image.url)
            return "No Image"
        image_preview.short_description = 'Image'
        
        def comment_count(self, obj):
            return obj.comments.count()
        comment_count.short_description = 'Comments'
        
        def like_count(self, obj):
            return obj.likes.count()
        like_count.short_description = 'Likes'

    @admin.register(Comment)
    class CommentAdmin(admin.ModelAdmin):
        list_display = ('id', 'user_email', 'post_id', 'content_preview', 'created_at')
        list_filter = ('created_at', 'user', 'post')
        search_fields = ('content', 'user__email', 'post__id')
        readonly_fields = ('created_at',)
        list_per_page = 20
        
        def user_email(self, obj):
            return obj.user.email
        user_email.short_description = 'User'
        
        def post_id(self, obj):
            return f"Post #{obj.post.id}"
        post_id.short_description = 'Post'
        
        def content_preview(self, obj):
            return obj.content[:30] + "..." if len(obj.content) > 30 else obj.content
        content_preview.short_description = 'Content'

    @admin.register(Like)
    class LikeAdmin(admin.ModelAdmin):
        list_display = ('id', 'user_email', 'post_id', 'created_at')
        list_filter = ('created_at', 'user', 'post')
        list_per_page = 20
        
        def user_email(self, obj):
            return obj.user.email
        user_email.short_description = 'User'
        
        def post_id(self, obj):
            return f"Post #{obj.post.id}"
        post_id.short_description = 'Post'
        
    logger.info("✅ Posts models registered in admin")
    
except ImportError as e:
    logger.warning(f"⚠️ Could not import posts models: {e}")

# Admin actions
def activate_users(modeladmin, request, queryset):
    updated = queryset.update(is_active=True)
    modeladmin.message_user(request, f"{updated} users activated successfully")
activate_users.short_description = "Activate selected users"

def deactivate_users(modeladmin, request, queryset):
    # Prevent admin from deactivating themselves
    if request.user in queryset:
        modeladmin.message_user(request, "You cannot deactivate your own account", level='ERROR')
        queryset = queryset.exclude(id=request.user.id)
    
    updated = queryset.update(is_active=False)
    modeladmin.message_user(request, f"{updated} users deactivated successfully")
deactivate_users.short_description = "Deactivate selected users"

def make_staff(modeladmin, request, queryset):
    updated = queryset.update(is_staff=True)
    modeladmin.message_user(request, f"{updated} users granted staff access")
make_staff.short_description = "Grant staff access to selected users"

# Add actions to CustomUser admin
try:
    from users.models import CustomUser
    CustomUserAdmin.actions = [activate_users, deactivate_users, make_staff]
except:
    pass

logger.info("✅ Admin panel configuration completed")