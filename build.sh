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
