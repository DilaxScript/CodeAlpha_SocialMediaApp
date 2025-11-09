#!/bin/bash
echo "🔧 Recovering Django Installation..."

echo "📦 Reinstalling Django and dependencies..."
pip install --force-reinstall Django
pip install --force-reinstall djangorestframework djangorestframework-simplejwt django-cors-headers mysqlclient pillow

echo "🔍 Verifying installation..."
python -c "import django; print(f'✅ Django {django.__version__}')"
python -c "from django.db import migrations; print('✅ Migrations module OK')"

echo "🔄 Creating migrations..."
python manage.py makemigrations users
python manage.py makemigrations posts  
python manage.py makemigrations admin_panel

echo "📥 Applying migrations..."
python manage.py migrate

echo "👤 Creating superuser..."
python manage.py createsuperuser

echo "🎉 Recovery complete! Start server with: python manage.py runserver"
