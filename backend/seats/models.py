from django.db import models
from django.conf import settings

class Center(models.Model):
    code = models.CharField(max_length=50, unique=True, help_text="Unique Center Code, e.g. CUC-01")
    name_bn = models.CharField(max_length=255, verbose_name="Center Name (Bangla)")
    name_en = models.CharField(max_length=255, verbose_name="Center Name (English)")
    address = models.TextField()
    latitude = models.DecimalField(max_digits=10, decimal_places=7)
    longitude = models.DecimalField(max_digits=10, decimal_places=7)
    photo = models.ImageField(upload_to='centers/', blank=True, null=True)
    gate_info = models.CharField(max_length=255, blank=True, help_text="e.g. Main Gate, Gate 2")
    instructions_bn = models.TextField(blank=True, verbose_name="Instructions (Bangla)")
    instructions_en = models.TextField(blank=True, verbose_name="Instructions (English)")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['code']
        verbose_name = 'Exam Center'
        verbose_name_plural = 'Exam Centers'

    def __str__(self):
        return f"{self.code} - {self.name_en}"


class Candidate(models.Model):
    roll = models.CharField(max_length=50, unique=True, db_index=True)
    name = models.CharField(max_length=255, blank=True, null=True)
    unit = models.CharField(max_length=50, help_text="e.g. A, B, C")
    verify_field = models.CharField(
        max_length=100, 
        blank=True, 
        null=True, 
        help_text="Optional 2nd verification field e.g. admit serial or last 4 digits of phone"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['roll']
        verbose_name = 'Candidate'
        verbose_name_plural = 'Candidates'

    def __str__(self):
        if self.name:
            return f"{self.roll} ({self.name})"
        return str(self.roll)


class UploadBatch(models.Model):
    STATUS_CHOICES = (
        ('preview', 'Preview'),
        ('confirmed', 'Confirmed'),
        ('failed', 'Failed'),
    )

    file = models.FileField(upload_to='uploads/batches/')
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='upload_batches'
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='preview')
    rows_total = models.IntegerField(default=0)
    rows_failed = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True, db_index=True)

    class Meta:
        ordering = ['-uploaded_at']
        verbose_name = 'Upload Batch'
        verbose_name_plural = 'Upload Batches'

    def __str__(self):
        return f"Batch #{self.id} ({self.status}) - {self.uploaded_at.strftime('%Y-%m-%d %H:%M')}"


class SeatAssignment(models.Model):
    candidate = models.ForeignKey(Candidate, on_delete=models.CASCADE, related_name='seats')
    center = models.ForeignKey(Center, on_delete=models.CASCADE, related_name='seats')
    building = models.CharField(max_length=255)
    room = models.CharField(max_length=100)
    seat_no = models.CharField(max_length=50)
    exam_date = models.DateField()
    exam_time = models.TimeField()
    reporting_time = models.TimeField()
    batch = models.ForeignKey(
        UploadBatch,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='seats'
    )

    class Meta:
        ordering = ['exam_date', 'exam_time', 'center', 'building', 'room', 'seat_no']
        verbose_name = 'Seat Assignment'
        verbose_name_plural = 'Seat Assignments'
        indexes = [
            models.Index(fields=['batch', 'candidate']),
            models.Index(fields=['batch']),
        ]

    def __str__(self):
        return f"Roll {self.candidate.roll} -> {self.center.code} {self.building} R:{self.room} S:{self.seat_no}"


class AuditLog(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs'
    )
    action = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']
        verbose_name = 'Audit Log'
        verbose_name_plural = 'Audit Logs'

    def __str__(self):
        user_str = self.user.username if self.user else "System"
        return f"[{self.timestamp.strftime('%Y-%m-%d %H:%M:%S')}] {user_str}: {self.action[:60]}"


class SearchLog(models.Model):
    roll_hash = models.CharField(max_length=64, db_index=True)
    ip_hash = models.CharField(max_length=64, db_index=True)
    found = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']
        verbose_name = 'Search Log'
        verbose_name_plural = 'Search Logs'

    def __str__(self):
        status_str = "FOUND" if self.found else "NOT_FOUND"
        return f"[{self.timestamp.strftime('%Y-%m-%d %H:%M:%S')}] {status_str} (roll: {self.roll_hash[:8]}...)"


class SiteSetting(models.Model):
    require_verification = models.BooleanField(
        default=False,
        help_text="When enabled, candidates must provide verify_field to view their seat."
    )
    verification_field_label_en = models.CharField(
        max_length=255,
        default="Admit Serial / Phone Last 4 Digits"
    )
    verification_field_label_bn = models.CharField(
        max_length=255,
        default="প্রবেশপত্র নম্বর / মোবাইল নম্বরের শেষ ৪ ডিজিট"
    )
    rate_limit_per_minute = models.PositiveIntegerField(
        default=20,
        help_text="Maximum search requests allowed per IP per minute"
    )
    helpdesk_phone = models.CharField(max_length=50, default="+880 1700-000000")
    helpdesk_email = models.EmailField(default="admission@cou.ac.bd")
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Site Setting'
        verbose_name_plural = 'Site Settings'

    def __str__(self):
        return f"Site Setting (Require Verification: {self.require_verification})"

    @classmethod
    def get_settings(cls):
        obj, _ = cls.objects.get_or_create(id=1)
        return obj
