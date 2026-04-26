from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = 'admin', 'Administrator'
        MANAGER = 'manager', 'Menejer'
        BAKER = 'baker', 'Novvoy'
        SELLER = 'seller', 'Sotuvchi'
        POINT_SELLER = 'point_seller', 'Nuqta sotuvchisi'
        ACCOUNTANT = 'accountant', 'Hisobchi'

    role = models.CharField(max_length=20, choices=Role.choices, default=Role.SELLER)
    phone = models.CharField(max_length=20, blank=True)
    point = models.ForeignKey(
        'points.SalesPoint', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='employees',
        help_text='Sotuvchi qaysi nuqtaga biriktirilgan'
    )

    class Meta:
        verbose_name = 'Foydalanuvchi'
        verbose_name_plural = 'Foydalanuvchilar'

    def __str__(self):
        return f"{self.get_full_name()} ({self.get_role_display()})"
