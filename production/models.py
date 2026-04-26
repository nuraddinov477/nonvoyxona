from django.db import models
from django.conf import settings


class RawMaterialCategory(models.Model):
    """Xom ashyo kategoriyasi (un, yog', achitqi va h.k.)"""
    name = models.CharField(max_length=100, verbose_name='Nomi')

    class Meta:
        verbose_name = 'Xom ashyo kategoriyasi'
        verbose_name_plural = 'Xom ashyo kategoriyalari'

    def __str__(self):
        return self.name


class RawMaterial(models.Model):
    """Xom ashyo ombori"""
    class Unit(models.TextChoices):
        KG = 'kg', 'Kilogramm'
        LITR = 'litr', 'Litr'
        DONA = 'dona', 'Dona'
        PAKET = 'paket', 'Paket'

    name = models.CharField(max_length=200, verbose_name='Nomi')
    category = models.ForeignKey(RawMaterialCategory, on_delete=models.CASCADE, related_name='materials')
    unit = models.CharField(max_length=10, choices=Unit.choices, default=Unit.KG)
    quantity = models.DecimalField(max_digits=12, decimal_places=3, default=0, verbose_name='Miqdori')
    min_quantity = models.DecimalField(max_digits=12, decimal_places=3, default=0,
                                       verbose_name='Minimal miqdor (ogohlantirish)')
    price_per_unit = models.DecimalField(max_digits=12, decimal_places=2, default=0,
                                          verbose_name='Birlik narxi')

    class Meta:
        verbose_name = 'Xom ashyo'
        verbose_name_plural = 'Xom ashyolar'

    def __str__(self):
        return f"{self.name} ({self.quantity} {self.unit})"


class RawMaterialIncome(models.Model):
    """Xom ashyo kirim (omborga kirim)"""
    material = models.ForeignKey(RawMaterial, on_delete=models.CASCADE, related_name='incomes')
    quantity = models.DecimalField(max_digits=12, decimal_places=3)
    price_per_unit = models.DecimalField(max_digits=12, decimal_places=2)
    total_price = models.DecimalField(max_digits=14, decimal_places=2)
    supplier = models.CharField(max_length=200, blank=True, verbose_name='Yetkazib beruvchi')
    date = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    note = models.TextField(blank=True)

    class Meta:
        verbose_name = 'Xom ashyo kirim'
        verbose_name_plural = 'Xom ashyo kirimlar'
        ordering = ['-date']

    def save(self, *args, **kwargs):
        self.total_price = self.quantity * self.price_per_unit
        super().save(*args, **kwargs)
        self.material.quantity += self.quantity
        self.material.price_per_unit = self.price_per_unit
        self.material.save()


class Product(models.Model):
    """Tayyor mahsulot turi (non, patir, somsa va h.k.)"""
    name = models.CharField(max_length=200, verbose_name='Nomi')
    price = models.DecimalField(max_digits=12, decimal_places=2, verbose_name='Sotuv narxi')
    is_active = models.BooleanField(default=True)
    image = models.ImageField(upload_to='products/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Mahsulot'
        verbose_name_plural = 'Mahsulotlar'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} - {self.price} so'm"


class Recipe(models.Model):
    """Texnologik xarita (retsept) - mahsulot uchun kerakli xom ashyolar"""
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='recipes')
    material = models.ForeignKey(RawMaterial, on_delete=models.CASCADE, related_name='recipes')
    quantity_per_unit = models.DecimalField(max_digits=10, decimal_places=4,
                                            verbose_name='1 dona mahsulot uchun kerakli miqdor')

    class Meta:
        verbose_name = 'Retsept (Texnologik xarita)'
        verbose_name_plural = 'Retseptlar'
        unique_together = ['product', 'material']

    def __str__(self):
        return f"{self.product.name}: {self.material.name} - {self.quantity_per_unit} {self.material.unit}"


class DailyProduction(models.Model):
    """Kunlik ishlab chiqarish akti"""
    date = models.DateField(verbose_name='Sana')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='productions')
    quantity = models.PositiveIntegerField(verbose_name='Ishlab chiqarilgan miqdor')
    baker = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                              null=True, related_name='productions')
    is_processed = models.BooleanField(default=False,
                                        verbose_name='Xom ashyo hisobdan chiqarildi')
    created_at = models.DateTimeField(auto_now_add=True)
    note = models.TextField(blank=True)

    class Meta:
        verbose_name = 'Kunlik ishlab chiqarish'
        verbose_name_plural = 'Kunlik ishlab chiqarish'
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"{self.date} - {self.product.name}: {self.quantity} dona"

    def process_raw_materials(self):
        """Retseptga ko'ra xom ashyolarni ombordan chiqarish"""
        if self.is_processed:
            return
        recipes = self.product.recipes.all()
        for recipe in recipes:
            material = recipe.material
            needed = recipe.quantity_per_unit * self.quantity
            material.quantity -= needed
            material.save()
        self.is_processed = True
        self.save()


class FinishedProductStock(models.Model):
    """Tayyor mahsulot ombori"""
    product = models.OneToOneField(Product, on_delete=models.CASCADE, related_name='stock')
    quantity = models.IntegerField(default=0, verbose_name='Mavjud miqdor')
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Tayyor mahsulot ombori'
        verbose_name_plural = 'Tayyor mahsulot ombori'

    def __str__(self):
        return f"{self.product.name}: {self.quantity} dona"
