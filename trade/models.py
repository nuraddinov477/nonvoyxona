from django.db import models
from django.conf import settings


class Sale(models.Model):
    """Sotuv"""
    class PaymentType(models.TextChoices):
        CASH = 'cash', 'Naqd'
        TERMINAL = 'terminal', 'Terminal'
        CLICK = 'click', 'Click'
        PAYME = 'payme', 'Payme'

    date = models.DateTimeField(auto_now_add=True)
    seller = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                               null=True, related_name='sales')
    payment_type = models.CharField(max_length=20, choices=PaymentType.choices)
    total_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    point = models.ForeignKey('points.SalesPoint', on_delete=models.SET_NULL,
                              null=True, blank=True, related_name='sales',
                              help_text='Nuqtada sotuv bo\'lsa')
    is_bakery_sale = models.BooleanField(default=True,
                                          help_text='Asosiy nonvoyxonadan sotuv')

    class Meta:
        verbose_name = 'Sotuv'
        verbose_name_plural = 'Sotuvlar'
        ordering = ['-date']

    def __str__(self):
        return f"#{self.id} - {self.total_amount} so'm ({self.get_payment_type_display()})"

    def calculate_total(self):
        self.total_amount = sum(item.total_price for item in self.items.all())
        self.save()


class SaleItem(models.Model):
    """Sotuv elementi"""
    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey('production.Product', on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=12, decimal_places=2)
    total_price = models.DecimalField(max_digits=14, decimal_places=2)

    class Meta:
        verbose_name = 'Sotuv elementi'
        verbose_name_plural = 'Sotuv elementlari'

    def save(self, *args, **kwargs):
        self.total_price = self.price * self.quantity
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.product.name} x {self.quantity}"


class UnsoldProduct(models.Model):
    """Sotilmagan mahsulotlar (brak, qaytim)"""
    class Reason(models.TextChoices):
        BURNT = 'burnt', 'Kuygan'
        DEFORMED = 'deformed', 'Shakli buzilgan'
        EXPIRED = 'expired', 'Muddati o\'tgan'
        RETURNED = 'returned', 'Qaytarilgan'
        OTHER = 'other', 'Boshqa'

    product = models.ForeignKey('production.Product', on_delete=models.CASCADE,
                                related_name='unsold')
    quantity = models.PositiveIntegerField()
    reason = models.CharField(max_length=20, choices=Reason.choices)
    note = models.TextField(blank=True)
    date = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                                   null=True)
    point = models.ForeignKey('points.SalesPoint', on_delete=models.SET_NULL,
                              null=True, blank=True)

    class Meta:
        verbose_name = 'Sotilmagan mahsulot'
        verbose_name_plural = 'Sotilmagan mahsulotlar'
        ordering = ['-date']

    def __str__(self):
        return f"{self.product.name} x {self.quantity} - {self.get_reason_display()}"
