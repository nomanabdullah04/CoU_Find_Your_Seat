from django.db import models

class Notice(models.Model):
    title_bn = models.CharField(max_length=255, verbose_name="Title (Bangla)")
    title_en = models.CharField(max_length=255, verbose_name="Title (English)")
    body_bn = models.TextField(blank=True, verbose_name="Body (Bangla)")
    body_en = models.TextField(blank=True, verbose_name="Body (English)")
    is_pinned = models.BooleanField(default=False)
    published_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-is_pinned', '-published_at']
        verbose_name = 'Notice'
        verbose_name_plural = 'Notices'

    def __str__(self):
        pinned = "[PINNED] " if self.is_pinned else ""
        return f"{pinned}{self.title_en}"


class AdmissionStep(models.Model):
    order = models.PositiveIntegerField(default=0, help_text="Sequence order of the step")
    title_bn = models.CharField(max_length=255, verbose_name="Title (Bangla)")
    title_en = models.CharField(max_length=255, verbose_name="Title (English)")
    description_bn = models.TextField(blank=True, verbose_name="Description (Bangla)")
    description_en = models.TextField(blank=True, verbose_name="Description (English)")
    date = models.CharField(max_length=100, blank=True, help_text="e.g. 15 Nov - 05 Dec 2026")
    link = models.URLField(blank=True, help_text="Official admission portal link if applicable")
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['order', 'id']
        verbose_name = 'Admission Step'
        verbose_name_plural = 'Admission Steps'

    def __str__(self):
        return f"Step {self.order}: {self.title_en}"


class FAQ(models.Model):
    question_bn = models.CharField(max_length=255, verbose_name="Question (Bangla)")
    question_en = models.CharField(max_length=255, verbose_name="Question (English)")
    answer_bn = models.TextField(verbose_name="Answer (Bangla)")
    answer_en = models.TextField(verbose_name="Answer (English)")
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['order', 'id']
        verbose_name = 'FAQ'
        verbose_name_plural = 'FAQs'

    def __str__(self):
        return self.question_en


# Help & Associations Models

class Association(models.Model):
    TYPE_CHOICES = (
        ('division', 'Division'),
        ('district', 'District'),
        ('other', 'Other'),
    )
    name_bn = models.CharField(max_length=255, verbose_name="Association Name (Bangla)")
    name_en = models.CharField(max_length=255, verbose_name="Association Name (English)")
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='division')
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', 'id']
        verbose_name = 'Association'
        verbose_name_plural = 'Associations'

    def __str__(self):
        return f"{self.name_en} ({self.get_type_display()})"


class Contact(models.Model):
    ROLE_CHOICES = (
        ('secretary', 'Secretary / সভাপতি'),
        ('general_secretary', 'General Secretary / সাধারণ সম্পাদক'),
        ('other', 'Volunteer / Other'),
    )
    association = models.ForeignKey(
        Association,
        on_delete=models.CASCADE,
        related_name='contacts'
    )
    role = models.CharField(max_length=30, choices=ROLE_CHOICES, default='secretary')
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=50)
    whatsapp = models.CharField(max_length=50, blank=True, null=True, help_text="e.g. 01XXXXXXXXX or +8801XXXXXXXXX")
    available_time = models.CharField(max_length=100, blank=True, default="8:00 AM - 10:00 PM")
    is_visible = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['id']
        verbose_name = 'Association Contact'
        verbose_name_plural = 'Association Contacts'

    def __str__(self):
        return f"{self.name} ({self.get_role_display()}) - {self.association.name_en}"


class HelpSettings(models.Model):
    label_bn = models.CharField(max_length=255, verbose_name="Label (Bangla)")
    label_en = models.CharField(max_length=255, verbose_name="Label (English)")
    phone = models.CharField(max_length=50)
    is_primary = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-is_primary', 'order', 'id']
        verbose_name = 'Help Helpline'
        verbose_name_plural = 'Help Helplines'

    def __str__(self):
        primary_badge = "[PRIMARY] " if self.is_primary else ""
        return f"{primary_badge}{self.label_en}: {self.phone}"
