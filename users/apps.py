# users/apps.py (Final Fixed Version)
from django.apps import AppConfig
import logging

logger = logging.getLogger(__name__)

class UsersConfig(AppConfig):
    """
    ✅ Django App Configuration for Users Management
    """
    
    # Database configuration
    default_auto_field = 'django.db.models.BigAutoField'
    
    # App name (Python path)
    name = 'users'
    
    # Human-readable name for Django admin
    verbose_name = 'Users Management'

    def ready(self):
        """
        ✅ Initialize the app when Django starts
        Using try-catch to avoid circular imports during startup
        """
        try:
            # Import signals only when app is fully loaded
            self.initialize_signals()
            logger.info("✅ Users app initialized successfully")
        except Exception as e:
            logger.warning(f"⚠️ Users app initialization incomplete: {e}")

    def initialize_signals(self):
        """
        ✅ Initialize signal handlers safely
        """
        try:
            # Import signals module safely
            from . import signals
            logger.debug("✅ Users signals imported")
        except ImportError as e:
            if "No module named" in str(e):
                logger.debug("ℹ️ No signals module found (this is normal)")
            else:
                logger.warning(f"⚠️ Could not import signals: {e}")
        except Exception as e:
            logger.warning(f"⚠️ Error in signal initialization: {e}")