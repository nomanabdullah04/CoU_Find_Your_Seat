from rest_framework import serializers
from .models import Center, Candidate, UploadBatch, SeatAssignment, AuditLog

class CenterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Center
        fields = '__all__'


class CandidateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Candidate
        fields = '__all__'


class SeatAssignmentSerializer(serializers.ModelSerializer):
    center = CenterSerializer(read_only=True)
    candidate = CandidateSerializer(read_only=True)

    class Meta:
        model = SeatAssignment
        fields = '__all__'


class UploadBatchSerializer(serializers.ModelSerializer):
    uploaded_by_username = serializers.CharField(source='uploaded_by.username', read_only=True)

    class Meta:
        model = UploadBatch
        fields = [
            'id',
            'file',
            'uploaded_by',
            'uploaded_by_username',
            'uploaded_at',
            'status',
            'rows_total',
            'rows_failed',
            'is_active',
        ]
        read_only_fields = ['uploaded_at', 'rows_total', 'rows_failed', 'status', 'is_active']


class AuditLogSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = AuditLog
        fields = ['id', 'user', 'username', 'action', 'timestamp']
        read_only_fields = ['timestamp']

