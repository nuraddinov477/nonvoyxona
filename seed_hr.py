import os, django
os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings'
django.setup()

from datetime import date, timedelta
from django.utils import timezone
from accounts.models import User
from hr.models import Position, Employee, PieceworkRate, Attendance, Bonus, Penalty, Advance, SalaryPayment
from production.models import Product
import random

print("HR demo ma'lumotlar yaratilmoqda...")

# Lavozimlar
positions_data = [
    ('Bosh novvoy', 'mixed', 4_000_000),
    ('Novvoy', 'piecework', 0),
    ('Yordamchi novvoy', 'fixed', 2_500_000),
    ('Sotuvchi', 'fixed', 3_000_000),
    ('Nuqta sotuvchisi', 'fixed', 2_800_000),
    ('Qorovul', 'fixed', 2_000_000),
    ('Hisobchi', 'fixed', 4_500_000),
    ('Menejer', 'fixed', 5_000_000),
]
positions = {}
for name, stype, salary in positions_data:
    p, _ = Position.objects.get_or_create(name=name, defaults={'salary_type': stype, 'default_salary': salary})
    positions[name] = p

# Mavjud foydalanuvchilar uchun Employee yaratish
existing_users_data = [
    ('admin', 'Bosh novvoy', 4_500_000),
    ('novvoy1', 'Novvoy', 0),
    ('sotuvchi1', 'Sotuvchi', 3_000_000),
]

for username, position_name, salary in existing_users_data:
    try:
        user = User.objects.get(username=username)
        emp, created = Employee.objects.get_or_create(
            user=user,
            defaults={
                'position': positions.get(position_name),
                'hire_date': date(2024, 1, 15),
                'fixed_salary': salary,
                'address': 'Toshkent shahar',
            }
        )
        print(f'  {"+" if created else "="} {user.get_full_name() or username} - {position_name}')
    except User.DoesNotExist:
        pass

# Yangi xodimlar yaratish
new_employees_data = [
    ('akbar.toshmatov', 'Akbar', 'Toshmatov', '+998901234567', 'baker', 'Novvoy', 0, '2023-05-10'),
    ('dilshod.karimov', 'Dilshod', 'Karimov', '+998907654321', 'seller', 'Sotuvchi', 3_200_000, '2024-03-20'),
    ('shavkat.aliev', 'Shavkat', 'Aliyev', '+998903334455', 'baker', 'Yordamchi novvoy', 2_800_000, '2024-06-01'),
    ('sardor.usmanov', 'Sardor', 'Usmonov', '+998904445566', 'point_seller', 'Nuqta sotuvchisi', 2_900_000, '2024-08-15'),
    ('botir.qosimov', 'Botir', 'Qosimov', '+998905556677', 'seller', 'Qorovul', 2_200_000, '2025-01-10'),
    ('jasur.rahimov', 'Jasur', 'Rahimov', '+998906667788', 'accountant', 'Hisobchi', 4_500_000, '2024-04-01'),
]

for username, first, last, phone, role, position_name, salary, hire_date_str in new_employees_data:
    try:
        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                'first_name': first,
                'last_name': last,
                'phone': phone,
                'role': role,
            }
        )
        if created:
            user.set_password('pass123')
            user.save()

        emp, created2 = Employee.objects.get_or_create(
            user=user,
            defaults={
                'position': positions.get(position_name),
                'hire_date': date.fromisoformat(hire_date_str),
                'fixed_salary': salary,
                'address': random.choice(['Toshkent, Chilonzor', 'Toshkent, Yunusobod', 'Toshkent, Sergeli']),
            }
        )
        print(f'  {"+" if created2 else "="} {user.get_full_name()} - {position_name}')
    except Exception as e:
        print(f'  ! {username}: {e}')

# Ishbay tariflar (novvoylar uchun)
products = list(Product.objects.all())
piecework_rates = {
    'Obinon': 200,
    'Patir': 350,
    'Katta non': 250,
    'Kulcha': 250,
    'Somsa': 500,
    'Tandир non': 200,
    'Lavash': 100,
    'Lepyoshka': 300,
    'Qatlama': 600,
    'Chalpak': 400,
}

for emp in Employee.objects.filter(position__name__in=['Novvoy', 'Bosh novvoy']):
    for prod in products:
        rate = piecework_rates.get(prod.name, 200)
        PieceworkRate.objects.get_or_create(
            employee=emp, product=prod,
            defaults={'rate_per_unit': rate}
        )

# Bugungi davomat
today = date.today()
for emp in Employee.objects.filter(status='active'):
    Attendance.objects.update_or_create(
        employee=emp, date=today, shift='day',
        defaults={
            'status': 'present',
            'check_in': timezone.now(),
        }
    )

# Oxirgi 30 kunlik davomat
for emp in Employee.objects.filter(status='active'):
    for i in range(1, 30):
        d = today - timedelta(days=i)
        # 90% kelgan, 10% kelmagan
        st = 'present' if random.random() > 0.1 else random.choice(['absent', 'sick'])
        Attendance.objects.update_or_create(
            employee=emp, date=d, shift='day',
            defaults={'status': st}
        )

# Mukofotlar va shtraflar (joriy oy)
month = today.strftime('%Y-%m')
employees = list(Employee.objects.filter(status='active'))

bonus_examples = [
    (200_000, 'Yaxshi ishlagani uchun mukofot'),
    (500_000, 'Oy oxirida samaradorlik uchun bonus'),
]
for emp in random.sample(employees, min(3, len(employees))):
    amount, reason = random.choice(bonus_examples)
    Bonus.objects.get_or_create(
        employee=emp, month=month, amount=amount,
        defaults={'reason': reason, 'date': today}
    )

penalty_examples = [
    (100_000, 'Kech qolgani uchun'),
    (50_000, 'Intizom buzilishi'),
]
for emp in random.sample(employees, min(2, len(employees))):
    amount, reason = random.choice(penalty_examples)
    Penalty.objects.get_or_create(
        employee=emp, month=month, amount=amount,
        defaults={'reason': reason, 'date': today}
    )

# Avanslar
from accounting.models import CashRegister
expense_register = CashRegister.objects.filter(type='expense').first()

for emp in random.sample(employees, min(3, len(employees))):
    amount = random.choice([500_000, 1_000_000, 1_500_000])
    Advance.objects.get_or_create(
        employee=emp, month=month, amount=amount,
        defaults={
            'date': today - timedelta(days=random.randint(1, 15)),
            'description': 'Avans',
            'cash_register': expense_register,
        }
    )

print(f"Tayyor!")
print(f"  Lavozimlar: {Position.objects.count()}")
print(f"  Xodimlar: {Employee.objects.count()}")
print(f"  Ishbay tariflar: {PieceworkRate.objects.count()}")
print(f"  Davomat yozuvlari: {Attendance.objects.count()}")
print(f"  Mukofotlar: {Bonus.objects.count()}")
print(f"  Shtraflar: {Penalty.objects.count()}")
print(f"  Avanslar: {Advance.objects.count()}")
