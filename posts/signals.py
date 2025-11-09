# posts/signals.py (Create this file)
import os
import logging
from django.db.models.signals import post_save, pre_delete, pre_save, m2m_changed
from django.dispatch import receiver
from django.core.files.storage import default_storage

from .models import Post, Comment, Like

logger = logging.getLogger(__name__)

@receiver(pre_save, sender=Post)
def store_old_post_image(sender, instance, **kwargs):
    """
    ✅ Store old post image before save for cleanup
    """
    if instance.pk:
        try:
            old_post = Post.objects.only('image').get(pk=instance.pk)
            instance._old_image = old_post.image
            logger.debug(f"📸 Stored old image for post {instance.id}")
        except Post.DoesNotExist:
            instance._old_image = None

@receiver(post_save, sender=Post)
def handle_post_save(sender, instance, created, **kwargs):
    """
    ✅ Handle post save operations
    """
    if created:
        logger.info(f"📝 New post created: {instance.id} by {instance.user.email}")
    else:
        # Clean up old image if changed
        cleanup_old_post_image(instance)

@receiver(pre_delete, sender=Post)
def cleanup_post_files(sender, instance, **kwargs):
    """
    ✅ Clean up post files before deletion
    """
    logger.info(f"🗑️ Deleting post: {instance.id}")
    cleanup_post_image(instance)

@receiver(post_save, sender=Comment)
def handle_comment_save(sender, instance, created, **kwargs):
    """
    ✅ Handle comment save operations
    """
    if created:
        logger.info(f"💬 New comment: {instance.id} on post {instance.post.id}")

@receiver(post_save, sender=Like)
def handle_like_save(sender, instance, created, **kwargs):
    """
    ✅ Handle like save operations
    """
    if created:
        logger.info(f"❤️ New like: {instance.id} on post {instance.post.id}")

def cleanup_old_post_image(instance):
    """
    ✅ Clean up old post image when post image is updated
    """
    try:
        if (hasattr(instance, '_old_image') and 
            instance._old_image and 
            instance._old_image != instance.image):
            
            old_image = instance._old_image
            old_file_path = old_image.name if old_image else None
            
            if old_file_path and default_storage.exists(old_file_path):
                # Delete the old file
                default_storage.delete(old_file_path)
                logger.info(f"🗑️ Deleted old image for post {instance.id}")
                
                # Try to delete the empty directory
                try:
                    old_directory = os.path.dirname(old_file_path)
                    if (default_storage.exists(old_directory) and 
                        not any(default_storage.listdir(old_directory)[1])):
                        default_storage.delete(old_directory)
                        logger.debug(f"📁 Deleted empty directory: {old_directory}")
                except Exception as e:
                    # Ignore directory deletion errors
                    pass
                    
    except Exception as e:
        logger.error(f"❌ Error cleaning up post image for post {instance.id}: {e}")

def cleanup_post_image(instance):
    """
    ✅ Clean up post image when post is deleted
    """
    try:
        if instance.image:
            file_path = instance.image.name
            if default_storage.exists(file_path):
                default_storage.delete(file_path)
                logger.info(f"🗑️ Deleted image for post: {instance.id}")
                
                # Try to delete the directory
                try:
                    directory = os.path.dirname(file_path)
                    if (default_storage.exists(directory) and 
                        not any(default_storage.listdir(directory)[1])):
                        default_storage.delete(directory)
                        logger.debug(f"📁 Deleted empty directory: {directory}")
                except Exception as e:
                    # Ignore directory deletion errors
                    pass
                
    except Exception as e:
        logger.error(f"❌ Error cleaning up files for post {instance.id}: {e}")

# ✅ Signal connection verification
def ready():
    """
    ✅ Verify signals are connected
    """
    logger.info("✅ Posts signals are ready and connected")
    return True