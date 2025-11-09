# posts/apps.py (Final Fixed Version)
from django.apps import AppConfig
import logging

logger = logging.getLogger(__name__)

class PostsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'posts'
    verbose_name = 'Posts Management'

    def ready(self):
        """
        ✅ Import signals when app is ready
        """
        try:
            # Import signals to connect them
            from . import signals
            logger.info("✅ Posts app signals connected successfully")
        except ImportError as e:
            # If signals.py doesn't exist, that's fine
            if "No module named" not in str(e):
                logger.warning(f"⚠️ Could not import posts signals: {e}")
        except Exception as e:
            logger.error(f"❌ Error in posts app ready(): {e}")