# admin_panel/apps.py (Final Fixed Version)
from django.apps import AppConfig
import logging

logger = logging.getLogger(__name__)

class AdminPanelConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'admin_panel'
    verbose_name = 'Admin Panel'
    
    def ready(self):
        """
        ✅ Initialize admin panel when app is ready
        """
        try:
            # Import admin configurations
            self._setup_admin()
            logger.info("✅ Admin Panel app initialized successfully")
        except Exception as e:
            logger.error(f"❌ Error initializing admin panel: {e}")

    def _setup_admin(self):
        """
        ✅ Setup admin panel configurations
        """
        try:
            # Import admin site customization
            from django.contrib import admin
            from django.contrib.admin.sites import site
            
            # Set admin site header and title
            admin.site.site_header = "Social Media Admin Panel"
            admin.site.site_title = "Social Media Administration"
            admin.site.index_title = "Welcome to Social Media Admin Panel"
            
            logger.debug("✅ Admin site configuration applied")
            
        except Exception as e:
            logger.warning(f"⚠️ Could not setup admin site: {e}")