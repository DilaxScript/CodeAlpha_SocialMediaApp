#!/bin/bash
echo "🔧 Fixing Missing Admin Templates..."

echo "1. 📦 Reinstalling Django..."
pip install --force-reinstall Django

echo "2. 🗑️ Removing old static files..."
rm -rf staticfiles/

echo "3. 📥 Collecting static files..."
python manage.py collectstatic --noinput

echo "4. 🔍 Verifying admin templates..."
python -c "
import django
from django.template.loader import get_template
from django.conf import settings

print('Checking template loaders:')
for loader in settings.TEMPLATES[0]['OPTIONS']['loaders']:
    print(f'  - {loader[0]}')

print('Checking admin templates:')
try:
    # Test finding admin templates
    from django.template.loaders.filesystem import Loader as FilesystemLoader
    from django.template.loaders.app_directories import Loader as AppLoader
    
    # Check filesystem loader
    fs_loader = FilesystemLoader()
    admin_base = fs_loader.get_template_sources('admin/base.html')
    print('Filesystem loader sources for admin/base.html:')
    for source in admin_base:
        print(f'  - {source}')
    
    # Check app directories loader  
    app_loader = AppLoader()
    admin_base_app = app_loader.get_template_sources('admin/base.html')
    print('App loader sources for admin/base.html:')
    for source in admin_base_app:
        print(f'  - {source}')
        
except Exception as e:
    print(f'Error: {e}')
"

echo "5. 🌐 Testing template rendering..."
python -c "
try:
    from django.template.loader import render_to_string
    context = {'site_header': 'Django Administration', 'title': 'Site Admin'}
    html = render_to_string('admin/base_site.html', context)
    print('✅ Admin templates can be rendered')
    print(f'Rendered {len(html)} characters')
except Exception as e:
    print(f'❌ Template rendering failed: {e}')
"

echo "🎉 Fix completed! Try accessing admin now."
