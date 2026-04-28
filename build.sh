#!/usr/bin/env bash
# Render.com build script

set -o errexit

pip install -r requirements.txt

python manage.py collectstatic --no-input
python manage.py migrate

# Demo ma'lumotlarni faqat birinchi marta yuklash
python manage.py shell -c "
from accounts.models import User
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser(
        username='admin',
        email='admin@nonvoyxona.uz',
        password='admin123',
        first_name='Admin',
        role='admin'
    )
    print('Admin user created')
"

# Test ma'lumotlarni yuklash (faqat mahsulot bo'lmasa)
python -c "
import os, django
os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings'
django.setup()
from production.models import Product
if not Product.objects.exists():
    print('>>> Test ma\'lumotlari yuklanmoqda...')
    exec(open('seed_data.py').read())
    exec(open('seed_hr.py').read())
    print('>>> Test ma\'lumotlari yuklandi!')
else:
    print('>>> Test ma\'lumotlari allaqachon mavjud, o\'tkazib yuborildi')
"
