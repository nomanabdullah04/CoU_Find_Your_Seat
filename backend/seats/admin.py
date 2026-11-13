from django.contrib import admin
from .models import Center, Candidate, UploadBatch, SeatAssignment, AuditLog, SearchLog, SiteSetting

@admin.register(Center)
class CenterAdmin(admin.ModelAdmin):
    list_display = ('code', 'name_en', 'name_bn', 'gate_info', 'latitude', 'longitude')
    search_fields = ('code', 'name_en', 'name_bn', 'address')
    list_filter = ('created_at',)

@admin.register(Candidate)
class CandidateAdmin(admin.ModelAdmin):
    list_display = ('roll', 'name', 'unit', 'verify_field', 'created_at')
    search_fields = ('roll', 'name', 'unit')
    list_filter = ('unit',)

@admin.register(UploadBatch)
class UploadBatchAdmin(admin.ModelAdmin):
    list_display = ('id', 'status', 'rows_total', 'rows_failed', 'is_active', 'uploaded_by', 'uploaded_at')
    list_filter = ('status', 'is_active', 'uploaded_at')
    readonly_fields = ('uploaded_at',)

@admin.register(SeatAssignment)
class SeatAssignmentAdmin(admin.ModelAdmin):
    list_display = ('candidate', 'center', 'building', 'room', 'seat_no', 'exam_date', 'exam_time', 'reporting_time')
    search_fields = ('candidate__roll', 'candidate__name', 'center__name_en', 'center__code', 'building', 'room', 'seat_no')
    list_filter = ('exam_date', 'center', 'building')
    raw_id_fields = ('candidate', 'center', 'batch')

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('timestamp', 'user', 'action')
    search_fields = ('action', 'user__username')
    list_filter = ('timestamp',)
    readonly_fields = ('timestamp',)

@admin.register(SearchLog)
class SearchLogAdmin(admin.ModelAdmin):
    list_display = ('timestamp', 'roll_hash', 'ip_hash', 'found')
    list_filter = ('found', 'timestamp')
    search_fields = ('roll_hash', 'ip_hash')
    readonly_fields = ('timestamp', 'roll_hash', 'ip_hash', 'found')

@admin.register(SiteSetting)
class SiteSettingAdmin(admin.ModelAdmin):
    list_display = ('id', 'require_verification', 'rate_limit_per_minute', 'helpdesk_phone', 'updated_at')
