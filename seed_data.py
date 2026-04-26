import os
import django
os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings'
django.setup()

from decimal import Decimal
from datetime import date, timedelta
from django.utils import timezone
from accounts.models import User
from production.models import (
    RawMaterialCategory, RawMaterial, Product, Recipe,
    DailyProduction, FinishedProductStock
)
from trade.models import Sale, SaleItem
from points.models import SalesPoint, PointStock, ProductTransfer, TransferItem
from accounting.models import (
    CashRegister, Transaction, TransactionCategory,
    Debtor, DebtRecord, Creditor, CreditRecord
)
import random

print("Ma'lumotlar yaratilmoqda...")

# --- Foydalanuvchilar ---
admin = User.objects.get(username='admin')

baker, _ = User.objects.get_or_create(username='novvoy1', defaults={
    'first_name': 'Akbar', 'last_name': 'Toshmatov',
    'role': 'baker', 'phone': '+998901234567'
})
baker.set_password('pass123')
baker.save()

seller, _ = User.objects.get_or_create(username='sotuvchi1', defaults={
    'first_name': 'Dilshod', 'last_name': 'Karimov',
    'role': 'seller', 'phone': '+998907654321'
})
seller.set_password('pass123')
seller.save()

# --- Xom ashyo kategoriyalari ---
cats = {}
for name in ['Un', 'Yog\'lar', 'Achitqilar', 'Tuz/Shakar', 'Boshqa']:
    cats[name], _ = RawMaterialCategory.objects.get_or_create(name=name)

# --- Xom ashyolar ---
materials_data = [
    ('Oliy navli un', cats['Un'], 'kg', 500, 50, 6500),
    ('1-navli un', cats['Un'], 'kg', 300, 30, 5500),
    ('O\'simlik yog\'i', cats["Yog'lar"], 'litr', 80, 10, 28000),
    ('Sariyog\'', cats["Yog'lar"], 'kg', 20, 5, 85000),
    ('Quruq achitqi', cats['Achitqilar'], 'paket', 100, 20, 3500),
    ('Osh tuzi', cats['Tuz/Shakar'], 'kg', 50, 10, 2500),
    ('Shakar', cats['Tuz/Shakar'], 'kg', 40, 10, 14000),
    ('Tuxum', cats['Boshqa'], 'dona', 200, 30, 2000),
    ('Sut', cats['Boshqa'], 'litr', 30, 5, 12000),
    ('Kunjut', cats['Boshqa'], 'kg', 10, 2, 45000),
]
materials = {}
for name, cat, unit, qty, min_qty, price in materials_data:
    m, _ = RawMaterial.objects.get_or_create(name=name, defaults={
        'category': cat, 'unit': unit, 'quantity': qty,
        'min_quantity': min_qty, 'price_per_unit': price
    })
    materials[name] = m

# --- Mahsulotlar ---
products_data = [
    ('Obinon', 3000),
    ('Patir', 5000),
    ('Katta non', 4000),
    ('Kulcha', 3500),
    ('Somsa', 6000),
    ('Tandир non', 3500),
    ('Lavash', 2500),
    ('Lepyoshka', 4500),
    ('Qatlama', 7000),
    ('Chalpak', 5500),
]
products = {}
for name, price in products_data:
    p, _ = Product.objects.get_or_create(name=name, defaults={'price': price})
    products[name] = p

# --- Retseptlar ---
recipes_data = [
    ('Obinon', [('Oliy navli un', 0.4), ("O'simlik yog'i", 0.02), ('Quruq achitqi', 0.005), ('Osh tuzi', 0.008)]),
    ('Patir', [('Oliy navli un', 0.35), ("Sariyog'", 0.05), ('Quruq achitqi', 0.005), ('Tuxum', 1), ('Sut', 0.03)]),
    ('Katta non', [('1-navli un', 0.5), ("O'simlik yog'i", 0.03), ('Quruq achitqi', 0.006), ('Osh tuzi', 0.01)]),
    ('Kulcha', [('Oliy navli un', 0.3), ("O'simlik yog'i", 0.02), ('Quruq achitqi', 0.004), ('Kunjut', 0.01)]),
    ('Somsa', [('Oliy navli un', 0.15), ("Sariyog'", 0.03), ('Osh tuzi', 0.003), ('Kunjut', 0.005)]),
    ('Tandир non', [('1-navli un', 0.45), ("O'simlik yog'i", 0.02), ('Quruq achitqi', 0.005), ('Osh tuzi', 0.009)]),
    ('Lavash', [('Oliy navli un', 0.2), ('Osh tuzi', 0.004)]),
    ('Lepyoshka', [('Oliy navli un', 0.35), ("O'simlik yog'i", 0.03), ('Quruq achitqi', 0.005), ('Shakar', 0.01)]),
    ('Qatlama', [('Oliy navli un', 0.3), ("Sariyog'", 0.06), ('Tuxum', 1), ('Sut', 0.04), ('Shakar', 0.02)]),
    ('Chalpak', [('1-navli un', 0.25), ("O'simlik yog'i", 0.05), ('Tuxum', 1), ('Shakar', 0.015)]),
]
for prod_name, ingredients in recipes_data:
    if prod_name in products:
        for mat_name, qty in ingredients:
            if mat_name in materials:
                Recipe.objects.get_or_create(
                    product=products[prod_name], material=materials[mat_name],
                    defaults={'quantity_per_unit': qty}
                )

# --- Tayyor mahsulot ombori ---
for name, p in products.items():
    stock, _ = FinishedProductStock.objects.get_or_create(product=p)
    stock.quantity = random.randint(20, 150)
    stock.save()

# --- Kassalar ---
cash_main, _ = CashRegister.objects.get_or_create(name='Asosiy kassa', defaults={
    'type': 'main', 'balance': 15_450_000
})
cash_terminal, _ = CashRegister.objects.get_or_create(name='Terminal', defaults={
    'type': 'terminal', 'balance': 8_230_000
})
cash_electronic, _ = CashRegister.objects.get_or_create(name='Click/Payme', defaults={
    'type': 'electronic', 'balance': 4_780_000
})
cash_expense, _ = CashRegister.objects.get_or_create(name='Xarajat kassasi', defaults={
    'type': 'expense', 'balance': 2_100_000
})

# --- Tranzaksiya kategoriyalari ---
cat_salary, _ = TransactionCategory.objects.get_or_create(name='Ish haqi', defaults={'type': 'expense'})
cat_materials, _ = TransactionCategory.objects.get_or_create(name='Xom ashyo xaridi', defaults={'type': 'expense'})
cat_utilities, _ = TransactionCategory.objects.get_or_create(name='Kommunal', defaults={'type': 'expense'})
cat_sales, _ = TransactionCategory.objects.get_or_create(name='Sotuv tushumi', defaults={'type': 'income'})
cat_other_inc, _ = TransactionCategory.objects.get_or_create(name='Boshqa kirim', defaults={'type': 'income'})

# --- Sotuvlar (30 kunlik) ---
today = date.today()
product_list = list(products.values())
payment_types = ['cash', 'terminal', 'click', 'payme']

Sale.objects.all().delete()
Transaction.objects.filter(sale__isnull=False).delete()

for day_offset in range(30):
    d = today - timedelta(days=day_offset)
    num_sales = random.randint(8, 25) if day_offset < 2 else random.randint(5, 18)

    for _ in range(num_sales):
        payment = random.choice(payment_types)
        sale = Sale.objects.create(
            seller=seller, payment_type=payment,
            is_bakery_sale=True
        )
        sale.date = timezone.make_aware(
            timezone.datetime(d.year, d.month, d.day,
                              random.randint(6, 20), random.randint(0, 59))
        )
        sale.save(update_fields=['date'])

        num_items = random.randint(1, 4)
        chosen = random.sample(product_list, min(num_items, len(product_list)))
        for prod in chosen:
            qty = random.randint(1, 20)
            SaleItem.objects.create(
                sale=sale, product=prod,
                quantity=qty, price=prod.price
            )
        sale.calculate_total()

# --- Kunlik ishlab chiqarish (30 kunlik) ---
DailyProduction.objects.all().delete()
for day_offset in range(30):
    d = today - timedelta(days=day_offset)
    prods_today = random.sample(product_list, random.randint(4, 8))
    for prod in prods_today:
        DailyProduction.objects.create(
            date=d, product=prod,
            quantity=random.randint(50, 300),
            baker=baker, is_processed=True
        )

# --- Qarzdorlar ---
Debtor.objects.all().delete()
debtors_data = [
    ('Rahim aka (ulgurji)', '+998901112233', 3_500_000),
    ('Sardor market', '+998902223344', 1_200_000),
    ('Beruniy savdo', '+998903334455', 800_000),
    ('Navoiy do\'kon', '+998904445566', 2_100_000),
    ('Chilonzor filiali', '+998905556677', 650_000),
]
for name, phone, debt in debtors_data:
    d = Debtor.objects.create(name=name, phone=phone, total_debt=debt)
    DebtRecord.objects.create(debtor=d, amount=debt, is_payment=False,
                              description='Boshlang\'ich qarz', created_by=admin)

# --- Kreditorlar ---
Creditor.objects.all().delete()
creditors_data = [
    ('Toshkent un zavodi', '+998711234567', 5_800_000),
    ('Guliston yog\' bazasi', '+998712345678', 2_400_000),
    ('Fermer Aziz (tuxum)', '+998913456789', 900_000),
    ('Achitqi importyor', '+998714567890', 1_600_000),
]
for name, phone, debt in creditors_data:
    c = Creditor.objects.create(name=name, phone=phone, total_debt=debt)
    CreditRecord.objects.create(creditor=c, amount=debt, is_payment=False,
                                description='Boshlang\'ich qarz', created_by=admin)

# --- Sotuv nuqtalari ---
SalesPoint.objects.all().delete()
points_data = [
    ('Chilonzor filiali', 'Chilonzor 9-kvartal, 15-uy', '+998901112233'),
    ('Sergeli nuqtasi', 'Sergeli 7, bozor yoni', '+998902223344'),
    ('Yunusobod do\'koni', 'Yunusobod 4-kvartal', '+998903334455'),
    ('Mirzo Ulug\'bek', 'M.Ulug\'bek 38-uy', '+998904445566'),
]
for name, addr, phone in points_data:
    pt = SalesPoint.objects.create(name=name, address=addr, phone=phone)
    # Har bir nuqtaga mahsulot qo'shish
    for prod in random.sample(product_list, random.randint(3, 6)):
        PointStock.objects.create(point=pt, product=prod, quantity=random.randint(10, 80))

# --- Tranzaksiyalar (oxirgi 15 kun) ---
Transaction.objects.all().delete()
for day_offset in range(15):
    d = today - timedelta(days=day_offset)
    dt = timezone.make_aware(timezone.datetime(d.year, d.month, d.day, 10, 0))

    # Kirim
    Transaction.objects.create(
        cash_register=cash_main, type='income',
        amount=random.randint(800_000, 2_500_000),
        description='Kunlik naqd sotuv tushumi',
        category=cat_sales, created_by=admin
    )
    Transaction.objects.create(
        cash_register=cash_terminal, type='income',
        amount=random.randint(400_000, 1_200_000),
        description='Terminal orqali sotuv',
        category=cat_sales, created_by=admin
    )

    # Chiqim
    if day_offset % 3 == 0:
        Transaction.objects.create(
            cash_register=cash_expense, type='expense',
            amount=random.randint(500_000, 3_000_000),
            description='Xom ashyo xaridi (un, yog\')',
            category=cat_materials, created_by=admin
        )
    if day_offset % 7 == 0:
        Transaction.objects.create(
            cash_register=cash_expense, type='expense',
            amount=random.randint(200_000, 500_000),
            description='Kommunal to\'lovlar',
            category=cat_utilities, created_by=admin
        )

print("Demo ma'lumotlar muvaffaqiyatli yaratildi!")
print(f"  Mahsulotlar: {Product.objects.count()}")
print(f"  Xom ashyolar: {RawMaterial.objects.count()}")
print(f"  Sotuvlar: {Sale.objects.count()}")
print(f"  Kassalar: {CashRegister.objects.count()}")
print(f"  Nuqtalar: {SalesPoint.objects.count()}")
print(f"  Qarzdorlar: {Debtor.objects.count()}")
print(f"  Kreditorlar: {Creditor.objects.count()}")
