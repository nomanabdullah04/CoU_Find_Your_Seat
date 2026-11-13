from django.contrib import admin
from .models import Notice, AdmissionStep, FAQ

@admin.register(Notice)
class NoticeAdmin(admin.ModelAdmin):
    list_display = ('title_en', 'title_bn', 'is_pinned', 'published_at')
    list_filter = ('is_pinned', 'published_at')
    search_fields = ('title_en', 'title_bn', 'body_en', 'body_bn')

@admin.register(AdmissionStep)
class AdmissionStepAdmin(admin.ModelAdmin):
    list_display = ('order', 'title_en', 'title_bn', 'date', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('title_en', 'title_bn', 'description_en', 'description_bn')
    ordering = ('order',)

@admin.register(FAQ)
class FAQAdmin(admin.ModelAdmin):
    list_display = ('order', 'question_en', 'question_bn', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('question_en', 'question_bn', 'answer_en', 'answer_bn')
    ordering = ('order',)

