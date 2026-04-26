from django.db import models
from django.conf import settings
from django.utils import timezone


class Position(models.Model):
    """Lavozim"""
    class SalaryType(models.TextChoices):
        FIXED = 'fixed', 'Fiksirlangan (oylik)'
        PIECEWORK = 'piecework', 'Ishbay (sdelniy)'
        MIXED = 'mixed', 'Aralash'

    name = models.CharField(max_length=100, verbose_name='Lavozim nomi')
    salary_type = models.CharField(max_length=20, choices=SalaryType.choices,
                                    default=SalaryType.FIXED)
    default_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0,
                                         verbose_name='Asosiy maosh (fiksirlangan)')

    class Meta:
        verbose_name = 'Lavozim'
        verbose_name_plural = 'Lavozimlar'

    def __str__(self):
        return self.name


class Employee(models.Model):
    """Xodim profil ma'lumotlari"""
    class Status(models.TextChoices):
        ACTIVE = 'active', 'Aktiv'
        VACATION = 'vacation', "Ta'tilda"
        SICK = 'sick', 'Kasal'
        DISMISSED = 'dismissed', 'Ishdan ketgan'

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                                related_name='hr_profile')
    position = models.ForeignKey(Position, on_delete=models.SET_NULL, null=True,
                                  related_name='employees')
    hire_date = models.DateField(verbose_name='Ishga kirgan sana', default=timezone.now)
    dismiss_date = models.DateField(null=True, blank=True, verbose_name='Ishdan ketgan sana')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    fixed_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0,
                                       verbose_name='Fiksirlangan oylik maosh')
    address = models.TextField(blank=True, verbose_name='Manzil')
    note = models.TextField(blank=True, verbose_name='Eslatma')

    class Meta:
        verbose_name = 'Xodim'
        verbose_name_plural = 'Xodimlar'

    def __str__(self):
        return self.user.get_full_name() or self.user.username


class PieceworkRate(models.Model):
    """Ishbay maosh tarifi (har mahsulot uchun)"""
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE,
                                  related_name='piecework_rates')
    product = models.ForeignKey('production.Product', on_delete=models.CASCADE)
    rate_per_unit = models.DecimalField(max_digits=10, decimal_places=2,
                                         verbose_name='1 dona uchun summa')

    class Meta:
        verbose_name = 'Ishbay tarifi'
        verbose_name_plural = 'Ishbay tariflari'
        unique_together = ['employee', 'product']

    def __str__(self):
        return f"{self.employee} - {self.product}: {self.rate_per_unit}"


class Attendance(models.Model):
    """Davomat (kelish/ketish)"""
    class Shift(models.TextChoices):
        DAY = 'day', 'Kunduzgi'
        NIGHT = 'night', 'Tungi'

    class Status(models.TextChoices):
        PRESENT = 'present', 'Keldi'
        ABSENT = 'absent', 'Kelmadi'
        LATE = 'late', 'Kech qoldi'
        SICK = 'sick', 'Kasal'
        VACATION = 'vacation', "Ta'til"

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE,
                                  related_name='attendances')
    date = models.DateField()
    shift = models.CharField(max_length=10, choices=Shift.choices, default=Shift.DAY)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PRESENT)
    check_in = models.DateTimeField(null=True, blank=True)
    check_out = models.DateTimeField(null=True, blank=True)
    note = models.TextField(blank=True)

    class Meta:
        verbose_name = 'Davomat'
        verbose_name_plural = 'Davomat'
        unique_together = ['employee', 'date', 'shift']
        ordering = ['-date']

    def __str__(self):
        return f"{self.employee} - {self.date} ({self.get_shift_display()})"

    @property
    def hours_worked(self):
        if self.check_in and self.check_out:
            delta = self.check_out - self.check_in
            return round(delta.total_seconds() / 3600, 2)
        return 0


class Bonus(models.Model):
    """Mukofot"""
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='bonuses')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    reason = models.TextField(verbose_name='Sabab')
    date = models.DateField(default=timezone.now)
    month = models.CharField(max_length=7, help_text='YYYY-MM format')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                                    null=True, related_name='given_bonuses')

    class Meta:
        verbose_name = 'Mukofot'
        verbose_name_plural = 'Mukofotlar'
        ordering = ['-date']

    def __str__(self):
        return f"{self.employee}: +{self.amount} ({self.reason[:30]})"


class Penalty(models.Model):
    """Shtraf (jarima)"""
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='penalties')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    reason = models.TextField(verbose_name='Sabab')
    date = models.DateField(default=timezone.now)
    month = models.CharField(max_length=7, help_text='YYYY-MM format')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                                    null=True, related_name='given_penalties')

    class Meta:
        verbose_name = 'Shtraf'
        verbose_name_plural = 'Shtraflar'
        ordering = ['-date']

    def __str__(self):
        return f"{self.employee}: -{self.amount} ({self.reason[:30]})"


class Advance(models.Model):
    """Avans (oylikgacha berilgan pul)"""
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='advances')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    date = models.DateField(default=timezone.now)
    month = models.CharField(max_length=7, help_text='YYYY-MM format')
    description = models.TextField(blank=True)
    cash_register = models.ForeignKey('accounting.CashRegister', on_delete=models.SET_NULL,
                                       null=True, related_name='advances')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                                    null=True, related_name='given_advances')

    class Meta:
        verbose_name = 'Avans'
        verbose_name_plural = 'Avanslar'
        ordering = ['-date']

    def __str__(self):
        return f"{self.employee}: {self.amount} ({self.month})"


class SalaryPayment(models.Model):
    """Oylik maosh to'lovi"""
    class Status(models.TextChoices):
        DRAFT = 'draft', 'Loyiha (hisoblangan)'
        PAID = 'paid', "To'langan"

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE,
                                  related_name='salary_payments')
    month = models.CharField(max_length=7, help_text='YYYY-MM format')
    base_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    piecework_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    units_produced = models.PositiveIntegerField(default=0)
    bonus_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    penalty_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    advance_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_to_pay = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    paid_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    paid_date = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.DRAFT)
    cash_register = models.ForeignKey('accounting.CashRegister', on_delete=models.SET_NULL,
                                       null=True, blank=True, related_name='salary_payments')
    note = models.TextField(blank=True)

    class Meta:
        verbose_name = 'Maosh to\'lovi'
        verbose_name_plural = 'Maosh to\'lovlari'
        unique_together = ['employee', 'month']
        ordering = ['-month']

    def __str__(self):
        return f"{self.employee}: {self.month} - {self.total_to_pay} so'm"
