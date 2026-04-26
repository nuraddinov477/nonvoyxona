from django.db import models
from django.conf import settings


class CashRegister(models.Model):
    """Kassa"""
    class Type(models.TextChoices):
        MAIN = 'main', 'Asosiy kassa (naqd)'
        TERMINAL = 'terminal', 'Terminal kassa'
        ELECTRONIC = 'electronic', 'Elektron to\'lov (Click/Payme)'
        EXPENSE = 'expense', 'Xarajat kassasi'

    name = models.CharField(max_length=200, verbose_name='Kassa nomi')
    type = models.CharField(max_length=20, choices=Type.choices)
    balance = models.DecimalField(max_digits=14, decimal_places=2, default=0,
                                  verbose_name='Joriy balans')
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'Kassa'
        verbose_name_plural = 'Kassalar'

    def __str__(self):
        return f"{self.name} - {self.balance} so'm"


class Transaction(models.Model):
    """Moliyaviy operatsiya"""
    class Type(models.TextChoices):
        INCOME = 'income', 'Kirim'
        EXPENSE = 'expense', 'Chiqim'
        TRANSFER = 'transfer', 'O\'tkazma'

    cash_register = models.ForeignKey(CashRegister, on_delete=models.CASCADE,
                                       related_name='transactions')
    type = models.CharField(max_length=20, choices=Type.choices)
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    description = models.TextField(verbose_name='Izoh')
    category = models.ForeignKey('TransactionCategory', on_delete=models.SET_NULL,
                                  null=True, blank=True)
    sale = models.ForeignKey('trade.Sale', on_delete=models.SET_NULL,
                             null=True, blank=True, related_name='transactions')
    transfer_to = models.ForeignKey(CashRegister, on_delete=models.SET_NULL,
                                     null=True, blank=True, related_name='incoming_transfers',
                                     help_text='Kassalar arasi o\'tkazmada')
    date = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)

    class Meta:
        verbose_name = 'Tranzaksiya'
        verbose_name_plural = 'Tranzaksiyalar'
        ordering = ['-date']

    def __str__(self):
        return f"{self.get_type_display()}: {self.amount} so'm - {self.description[:50]}"


class TransactionCategory(models.Model):
    """Tranzaksiya kategoriyasi"""
    name = models.CharField(max_length=200)
    type = models.CharField(max_length=20, choices=Transaction.Type.choices)

    class Meta:
        verbose_name = 'Tranzaksiya kategoriyasi'
        verbose_name_plural = 'Tranzaksiya kategoriyalari'

    def __str__(self):
        return self.name


class Debtor(models.Model):
    """Qarzdorlar (bizga qarz)"""
    name = models.CharField(max_length=200, verbose_name='Ism/Kompaniya')
    phone = models.CharField(max_length=20, blank=True)
    total_debt = models.DecimalField(max_digits=14, decimal_places=2, default=0,
                                      verbose_name='Umumiy qarz')
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Qarzdor'
        verbose_name_plural = 'Qarzdorlar'

    def __str__(self):
        return f"{self.name} - {self.total_debt} so'm"


class DebtRecord(models.Model):
    """Qarz yozuvi"""
    debtor = models.ForeignKey(Debtor, on_delete=models.CASCADE, related_name='records')
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    is_payment = models.BooleanField(default=False, help_text='True = to\'lov, False = yangi qarz')
    description = models.TextField(blank=True)
    date = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)

    class Meta:
        verbose_name = 'Qarz yozuvi'
        verbose_name_plural = 'Qarz yozuvlari'
        ordering = ['-date']


class Creditor(models.Model):
    """Kreditorlar (biz qarz)"""
    name = models.CharField(max_length=200, verbose_name='Yetkazib beruvchi')
    phone = models.CharField(max_length=20, blank=True)
    total_debt = models.DecimalField(max_digits=14, decimal_places=2, default=0,
                                      verbose_name='Bizning qarzimiz')
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Kreditor'
        verbose_name_plural = 'Kreditorlar'

    def __str__(self):
        return f"{self.name} - {self.total_debt} so'm"


class CreditRecord(models.Model):
    """Kredit yozuvi"""
    creditor = models.ForeignKey(Creditor, on_delete=models.CASCADE, related_name='records')
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    is_payment = models.BooleanField(default=False, help_text='True = biz to\'ladik, False = yangi qarz')
    description = models.TextField(blank=True)
    date = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)

    class Meta:
        verbose_name = 'Kredit yozuvi'
        verbose_name_plural = 'Kredit yozuvlari'
        ordering = ['-date']
