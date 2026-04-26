from django.db import models
from django.conf import settings


class SalesPoint(models.Model):
    """Sotuv nuqtasi"""
    name = models.CharField(max_length=200, verbose_name='Nomi')
    address = models.TextField(verbose_name='Manzil')
    phone = models.CharField(max_length=20, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Sotuv nuqtasi'
        verbose_name_plural = 'Sotuv nuqtalari'

    def __str__(self):
        return self.name


class PointStock(models.Model):
    """Nuqtadagi mahsulot qoldig'i"""
    point = models.ForeignKey(SalesPoint, on_delete=models.CASCADE, related_name='stock')
    product = models.ForeignKey('production.Product', on_delete=models.CASCADE)
    quantity = models.IntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Nuqta ombori'
        verbose_name_plural = 'Nuqta omborlari'
        unique_together = ['point', 'product']

    def __str__(self):
        return f"{self.point.name} - {self.product.name}: {self.quantity}"


class ProductTransfer(models.Model):
    """Mahsulot jo'natish (markazdan nuqtaga)"""
    class Status(models.TextChoices):
        IN_TRANSIT = 'in_transit', 'Yo\'lda'
        ACCEPTED = 'accepted', 'Qabul qilindi'
        REJECTED = 'rejected', 'Rad etildi'

    point = models.ForeignKey(SalesPoint, on_delete=models.CASCADE, related_name='transfers')
    date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.IN_TRANSIT)
    sent_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                                null=True, related_name='sent_transfers')
    accepted_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                                    null=True, blank=True, related_name='accepted_transfers')
    accepted_at = models.DateTimeField(null=True, blank=True)
    note = models.TextField(blank=True)

    class Meta:
        verbose_name = 'Mahsulot jo\'natish'
        verbose_name_plural = 'Mahsulot jo\'natishlar'
        ordering = ['-date']

    def __str__(self):
        return f"#{self.id} -> {self.point.name} ({self.get_status_display()})"


class TransferItem(models.Model):
    """Jo'natish elementi"""
    transfer = models.ForeignKey(ProductTransfer, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey('production.Product', on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()

    class Meta:
        verbose_name = 'Jo\'natish elementi'
        verbose_name_plural = 'Jo\'natish elementlari'

    def __str__(self):
        return f"{self.product.name} x {self.quantity}"


class PointReturn(models.Model):
    """Nuqtadan qaytarilgan mahsulotlar"""
    point = models.ForeignKey(SalesPoint, on_delete=models.CASCADE, related_name='returns')
    product = models.ForeignKey('production.Product', on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()
    reason = models.TextField(blank=True)
    date = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)

    class Meta:
        verbose_name = 'Nuqtadan qaytim'
        verbose_name_plural = 'Nuqtadan qaytimlar'
        ordering = ['-date']

    def __str__(self):
        return f"{self.point.name}: {self.product.name} x {self.quantity}"
