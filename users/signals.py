# users/signals.py (Final Fixed Version)
import os
import logging
from django.db.models.signals import post_save, pre_delete, pre_save
from django.dispatch import receiver
from django.core.files.storage import default_storage

logger = logging.getLogger(__name__)

@receiver(pre_save)
def store_old_profile_picture(sender, instance, **kwargs):
    """
    ✅ Store old profile picture before save for cleanup
    """
    # Only handle CustomUser model
    if sender.__name__ == 'CustomUser' and instance.pk:
        try:
            from .models import CustomUser
            old_user = CustomUser.objects.get(pk=instance.pk)
            instance._old_profile_picture = old_user.profile_picture
            logger.debug(f"📸 Stored old profile picture for user {instance.email}")
        except Exception as e:
            instance._old_profile_picture = None
            logger.debug(f"ℹ️ No old profile picture found for new user: {e}")

@receiver(post_save)
def handle_user_save(sender, instance, created, **kwargs):
    """
    ✅ Handle user save operations
    """
    # Only handle CustomUser model
    if sender.__name__ == 'CustomUser':
        if created:
            logger.info(f"✅ New user created: {instance.email} (ID: {instance.id})")
            # You can add new user setup logic here
        else:
            cleanup_old_profile_picture(instance)

@receiver(pre_delete)
def cleanup_user_files(sender, instance, **kwargs):
    """
    ✅ Clean up files before user deletion
    """
    # Only handle CustomUser model
    if sender.__name__ == 'CustomUser':
        logger.info(f"🗑️ Deleting user: {instance.email} (ID: {instance.id})")
        cleanup_user_profile_picture(instance)

def cleanup_old_profile_picture(instance):
    """
    ✅ Clean up old profile picture when user updates their picture
    """
    try:
        if (hasattr(instance, '_old_profile_picture') and 
            instance._old_profile_picture and 
            instance._old_profile_picture != instance.profile_picture):
            
            old_picture = instance._old_profile_picture
            old_file_path = old_picture.name if old_picture else None
            
            if old_file_path and default_storage.exists(old_file_path):
                # Delete the old file
                default_storage.delete(old_file_path)
                logger.info(f"🗑️ Deleted old profile picture for {instance.email}")
                
                # Try to delete the empty directory
                try:
                    old_directory = os.path.dirname(old_file_path)
                    if (default_storage.exists(old_directory) and 
                        not any(default_storage.listdir(old_directory)[1])):
                        default_storage.delete(old_directory)
                        logger.debug(f"📁 Deleted empty directory: {old_directory}")
                except Exception as e:
                    # Ignore directory deletion errors (common)
                    pass
                    
    except Exception as e:
        logger.error(f"❌ Error cleaning up profile picture for {instance.email}: {e}")

def cleanup_user_profile_picture(instance):
    """
    ✅ Clean up profile picture when user is deleted
    """
    try:
        if instance.profile_picture:
            file_path = instance.profile_picture.name
            if default_storage.exists(file_path):
                default_storage.delete(file_path)
                logger.info(f"🗑️ Deleted profile picture for user: {instance.email}")
                
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
        logger.error(f"❌ Error cleaning up files for user {instance.email}: {e}")

# ✅ Signal connection verification
def ready():
    """
    ✅ Import this function in apps.py to ensure signals are connected
    """
    logger.info("✅ User signals are ready and connected")
    return True