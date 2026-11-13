import os
import hashlib
from datetime import datetime, date, time, timedelta
from django.utils import timezone
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.core.cache import cache
from rest_framework.views import APIView
from rest_framework import generics, viewsets
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from .models import Center, Candidate, UploadBatch, SeatAssignment, AuditLog, SearchLog, SiteSetting
from .serializers import CenterSerializer, UploadBatchSerializer, AuditLogSerializer
from .importers import (
    generate_excel_template,
    ExcelSeatPlanValidator,
    execute_batch_import,
    execute_batch_rollback
)


def get_client_ip(request):
    """Extract client IP address handling proxies."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', '127.0.0.1')


def hash_identifier(value: str) -> str:
    """Returns SHA-256 hash of an identifier (e.g. roll or IP) for privacy."""
    return hashlib.sha256(str(value).strip().lower().encode('utf-8')).hexdigest()


class SeatSearchView(APIView):
    """
    GET/POST /api/seat/search/
    Public search API for candidates.
    Rate-limited, cached, and queries strictly the active batch by indexed roll.
    """
    permission_classes = [permissions.AllowAny]
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def get(self, request, *args, **kwargs):
        roll = request.query_params.get('admission_roll') or request.query_params.get('roll')
        verify_field = request.query_params.get('verify_field')
        return self._perform_search(request, roll, verify_field)

    def post(self, request, *args, **kwargs):
        roll = request.data.get('admission_roll') or request.data.get('roll')
        verify_field = request.data.get('verify_field')
        return self._perform_search(request, roll, verify_field)

    def _perform_search(self, request, roll, verify_field):
        site_settings = SiteSetting.get_settings()
        ip = get_client_ip(request)
        ip_hash = hash_identifier(ip)

        # 1. Rate Limiting (e.g. 20 req/min per IP)
        rate_limit = site_settings.rate_limit_per_minute
        rate_key = f"rate_limit_{ip_hash}"
        current_requests = cache.get(rate_key, 0)
        if current_requests >= rate_limit:
            return Response({
                "error": "Rate limit exceeded",
                "message_en": f"Too many requests. Maximum {rate_limit} searches per minute allowed. Please try again shortly.",
                "message_bn": f"অনুসন্ধানের সর্বোচ্চ সীমা ({rate_limit} বার/মিনিট) অতিক্রম করেছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।"
            }, status=status.HTTP_429_TOO_MANY_REQUESTS)

        # Increment rate limit counter with 60s TTL
        cache.set(rate_key, current_requests + 1, timeout=60)

        # 2. Validate roll input
        if not roll or not str(roll).strip():
            return Response({
                "found": False,
                "message_en": "Admission Roll is required.",
                "message_bn": "ভর্তি পরীক্ষার রোল নম্বর প্রদান করা আবশ্যক।"
            }, status=status.HTTP_400_BAD_REQUEST)

        clean_roll = str(roll).strip()
        roll_hash = hash_identifier(clean_roll)

        # 3. Only search active confirmed batch (cached to minimize database roundtrips)
        active_batch = cache.get("active_confirmed_batch")
        if active_batch is None:
            active_batch = UploadBatch.objects.filter(is_active=True, status='confirmed').first()
            if active_batch:
                cache.set("active_confirmed_batch", active_batch, timeout=300)
        if not active_batch:
            try:
                SearchLog.objects.create(
                    roll_hash=roll_hash,
                    ip_hash=ip_hash,
                    found=False
                )
            except Exception:
                pass
            return Response({
                "found": False,
                "roll": clean_roll,
                "message_en": f"No seat assignment found for Admission Roll '{clean_roll}'. Please check your roll number or contact the admission helpdesk.",
                "message_bn": f"ভর্তি পরীক্ষার রোল '{clean_roll}'-এর জন্য কোনো সিট পাওয়া যায়নি। আপনার রোল নম্বরটি যাচাই করুন অথবা হেল্পডেস্কে যোগাযোগ করুন।",
                "helpdesk": {
                    "phone": site_settings.helpdesk_phone,
                    "email": site_settings.helpdesk_email
                }
            }, status=status.HTTP_404_NOT_FOUND)

        # 4. Check Cache (Instant response for repeat searches)
        cache_key = f"seat_result_{active_batch.id}_{roll_hash}"
        cached_data = cache.get(cache_key)
        if cached_data and not site_settings.require_verification:
            return Response(cached_data, status=status.HTTP_200_OK)

        # Query database strictly by indexed roll within active batch
        assignment = SeatAssignment.objects.filter(
            candidate__roll=clean_roll,
            batch=active_batch
        ).select_related('candidate', 'center').first()

        # 5. Log search privacy-safely (hashed roll and hashed IP)
        try:
            SearchLog.objects.create(
                roll_hash=roll_hash,
                ip_hash=ip_hash,
                found=bool(assignment)
            )
        except Exception:
            # Under high concurrency database lock, gracefully proceed without failing candidate search
            pass

        # 6. Not Found -> Bilingual 404 response
        if not assignment:
            return Response({
                "found": False,
                "roll": clean_roll,
                "message_en": f"No seat assignment found for Admission Roll '{clean_roll}'. Please check your roll number or contact the admission helpdesk.",
                "message_bn": f"ভর্তি পরীক্ষার রোল '{clean_roll}'-এর জন্য কোনো সিট পাওয়া যায়নি। আপনার রোল নম্বরটি যাচাই করুন অথবা হেল্পডেস্কে যোগাযোগ করুন।",
                "helpdesk": {
                    "phone": site_settings.helpdesk_phone,
                    "email": site_settings.helpdesk_email
                }
            }, status=status.HTTP_404_NOT_FOUND)

        candidate = assignment.candidate
        center = assignment.center

        # 7. Verification Field Check (if enabled by admin)
        if site_settings.require_verification and candidate.verify_field:
            provided_verify = str(verify_field or '').strip().lower()
            expected_verify = str(candidate.verify_field).strip().lower()
            if provided_verify != expected_verify:
                return Response({
                    "found": False,
                    "verification_required": True,
                    "verification_error": True,
                    "message_en": "Verification failed. The provided verification information does not match our records.",
                    "message_bn": "যাচাইকরণ ব্যর্থ হয়েছে। প্রদত্ত তথ্য রেকর্ডের সাথে মেলেনি।",
                    "verification_label_en": site_settings.verification_field_label_en,
                    "verification_label_bn": site_settings.verification_field_label_bn
                }, status=status.HTTP_403_FORBIDDEN)

        # 8. Return Minimum Data
        photo_url = None
        if center.photo:
            try:
                photo_url = request.build_absolute_uri(center.photo.url)
            except Exception:
                photo_url = center.photo.url

        response_data = {
            "found": True,
            "candidate": {
                "roll": candidate.roll,
                "name": candidate.name,
                "unit": candidate.unit,
            },
            "seat": {
                "building": assignment.building,
                "room": assignment.room,
                "seat_no": assignment.seat_no,
                "exam_date": assignment.exam_date.strftime('%Y-%m-%d'),
                "exam_time": assignment.exam_time.strftime('%H:%M'),
                "reporting_time": assignment.reporting_time.strftime('%H:%M'),
            },
            "center": {
                "id": center.id,
                "code": center.code,
                "name_en": center.name_en,
                "name_bn": center.name_bn,
                "address": center.address,
                "latitude": float(center.latitude),
                "longitude": float(center.longitude),
                "gate_info": center.gate_info,
                "instructions_en": center.instructions_en,
                "instructions_bn": center.instructions_bn,
                "photo_url": photo_url,
            }
        }

        # Cache response for 120 seconds
        cache.set(cache_key, response_data, timeout=120)

        return Response(response_data, status=status.HTTP_200_OK)


class PublicSettingsView(APIView):
    """
    GET /api/seat/settings/
    Public settings info so frontend knows if verification is enabled.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        settings_obj = SiteSetting.get_settings()
        return Response({
            "require_verification": settings_obj.require_verification,
            "verification_field_label_en": settings_obj.verification_field_label_en,
            "verification_field_label_bn": settings_obj.verification_field_label_bn,
            "helpdesk_phone": settings_obj.helpdesk_phone,
            "helpdesk_email": settings_obj.helpdesk_email,
        })


# --- Public Centers Views ---

class PublicCenterListView(generics.ListAPIView):
    """
    GET /api/centers/
    Public list of exam centers.
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = CenterSerializer
    queryset = Center.objects.all().order_by('code')


class PublicCenterDetailView(generics.RetrieveAPIView):
    """
    GET /api/centers/<id>/
    Public single center details.
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = CenterSerializer
    queryset = Center.objects.all()


# --- Admin JWT CRUD ViewSets & Stats ---

class AdminCenterViewSet(viewsets.ModelViewSet):
    """
    Admin CRUD for Centers:
    GET, POST /api/admin/centers/
    GET, PUT, PATCH, DELETE /api/admin/centers/<id>/
    """
    permission_classes = [permissions.IsAdminUser]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    serializer_class = CenterSerializer
    queryset = Center.objects.all().order_by('code')


class AdminSettingsView(APIView):
    """
    GET /api/admin/settings/
    PATCH /api/admin/settings/
    Admin settings management to toggle verification requirement, helpdesk phone/email, etc.
    """
    permission_classes = [permissions.IsAdminUser]

    def get(self, request, *args, **kwargs):
        setting = SiteSetting.get_settings()
        return Response({
            "require_verification": setting.require_verification,
            "verification_field_label_en": setting.verification_field_label_en,
            "verification_field_label_bn": setting.verification_field_label_bn,
            "rate_limit_per_minute": setting.rate_limit_per_minute,
            "helpdesk_phone": setting.helpdesk_phone,
            "helpdesk_email": setting.helpdesk_email,
        }, status=status.HTTP_200_OK)

    def patch(self, request, *args, **kwargs):
        setting = SiteSetting.get_settings()
        data = request.data

        if 'require_verification' in data:
            setting.require_verification = bool(data.get('require_verification'))
        if 'verification_field_label_en' in data:
            setting.verification_field_label_en = str(data.get('verification_field_label_en', '')).strip()
        if 'verification_field_label_bn' in data:
            setting.verification_field_label_bn = str(data.get('verification_field_label_bn', '')).strip()
        if 'rate_limit_per_minute' in data:
            try:
                setting.rate_limit_per_minute = int(data.get('rate_limit_per_minute'))
            except (ValueError, TypeError):
                pass
        if 'helpdesk_phone' in data:
            setting.helpdesk_phone = str(data.get('helpdesk_phone', '')).strip()
        if 'helpdesk_email' in data:
            setting.helpdesk_email = str(data.get('helpdesk_email', '')).strip()

        setting.save()

        AuditLog.objects.create(
            user=request.user,
            action=f"Updated site settings. require_verification={setting.require_verification}"
        )

        return Response({
            "require_verification": setting.require_verification,
            "verification_field_label_en": setting.verification_field_label_en,
            "verification_field_label_bn": setting.verification_field_label_bn,
            "rate_limit_per_minute": setting.rate_limit_per_minute,
            "helpdesk_phone": setting.helpdesk_phone,
            "helpdesk_email": setting.helpdesk_email,
            "message": "Settings updated successfully."
        }, status=status.HTTP_200_OK)


class AdminDashboardStatsView(APIView):
    """
    GET /api/admin/stats/
    Returns overview statistics for the administrative dashboard:
    - total candidates
    - total seat assignments
    - active batch candidate count
    - total searches
    - searches in the last hour
    - not-found searches count
    - total centers
    - hourly_searches chart data
    Requires Admin JWT authentication.
    """
    permission_classes = [permissions.IsAdminUser]

    def get(self, request, *args, **kwargs):
        now = timezone.now()
        one_hour_ago = now - timedelta(hours=1)

        total_candidates = Candidate.objects.count()
        total_seats = SeatAssignment.objects.count()
        active_batch = UploadBatch.objects.filter(is_active=True, status='confirmed').first()
        active_candidates = SeatAssignment.objects.filter(batch=active_batch).count() if active_batch else 0

        total_searches = SearchLog.objects.count()
        searches_last_hour = SearchLog.objects.filter(timestamp__gte=one_hour_ago).count()
        not_found_searches = SearchLog.objects.filter(found=False).count()
        found_searches = SearchLog.objects.filter(found=True).count()
        total_centers = Center.objects.count()

        # Searches per hour for the last 12 hours (small chart data)
        hourly_searches = []
        for i in range(11, -1, -1):
            h_start = (now - timedelta(hours=i)).replace(minute=0, second=0, microsecond=0)
            h_end = h_start + timedelta(hours=1)
            count = SearchLog.objects.filter(timestamp__gte=h_start, timestamp__lt=h_end).count()
            hourly_searches.append({
                "hour": h_start.strftime("%H:%M"),
                "searches": count
            })

        return Response({
            "total_candidates": total_candidates,
            "total_seats": total_seats,
            "active_batch_id": active_batch.id if active_batch else None,
            "active_candidates": active_candidates,
            "total_searches": total_searches,
            "searches_last_hour": searches_last_hour,
            "found_searches": found_searches,
            "not_found_searches": not_found_searches,
            "total_centers": total_centers,
            "hourly_searches": hourly_searches,
        }, status=status.HTTP_200_OK)


# --- Admin Excel Views ---

class TemplateDownloadView(APIView):
    """
    GET /api/admin/template/
    Download a sample .xlsx template with exact headers and 3 example rows.
    Requires Admin JWT authentication.
    """
    permission_classes = [permissions.IsAdminUser]

    def get(self, request, *args, **kwargs):
        excel_buffer = generate_excel_template()
        response = HttpResponse(
            excel_buffer.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename="seat_plan_template.xlsx"'
        return response


class ExcelUploadView(APIView):
    """
    POST /api/admin/upload/
    Uploads and validates an Excel seat plan file (.xlsx).
    Returns validation preview: total rows, valid rows, and errors.
    Does NOT import yet; batch is saved in 'preview' status.
    Requires Admin JWT authentication.
    """
    permission_classes = [permissions.IsAdminUser]
    parser_classes = [MultiPartParser, FormParser]

    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

    def get(self, request, *args, **kwargs):
        batches = UploadBatch.objects.all().order_by('-uploaded_at')[:50]
        serializer = UploadBatchSerializer(batches, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, *args, **kwargs):
        upload_file = request.FILES.get('file')
        if not upload_file:
            return Response(
                {"error": "No file uploaded. Please upload a file with key 'file'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        filename = upload_file.name.lower()
        if not filename.endswith('.xlsx'):
            return Response(
                {"error": "Invalid file format. Only .xlsx Excel files are supported."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if upload_file.size > self.MAX_FILE_SIZE:
            return Response(
                {"error": f"File size exceeds maximum allowed limit of 10 MB (File size: {upload_file.size / (1024*1024):.2f} MB)."},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = request.user if request.user.is_authenticated else None
        batch = UploadBatch.objects.create(
            file=upload_file,
            uploaded_by=user,
            status='preview',
            is_active=False
        )

        validator = ExcelSeatPlanValidator(batch.file.path)
        val_result = validator.validate()

        batch.rows_total = val_result['total_rows']
        batch.rows_failed = len(val_result['errors'])
        if not val_result['success'] and val_result['valid_rows_count'] == 0:
            batch.status = 'failed'
        batch.save()

        AuditLog.objects.create(
            user=user,
            action=f"Uploaded seat plan file '{upload_file.name}' for validation. Batch #{batch.id}. Total: {val_result['total_rows']}, Errors: {len(val_result['errors'])}."
        )

        # Prepare preview rows for frontend table
        preview_rows = []
        for r in val_result['valid_rows'][:15]:
            preview_rows.append({
                "row_number": r.get('row_number'),
                "roll": r.get('admission_roll'),
                "name": r.get('candidate_name'),
                "unit": r.get('unit'),
                "center_code": r.get('center_code'),
                "building": r.get('building'),
                "room": r.get('room'),
                "seat_no": r.get('seat_no'),
                "exam_date": str(r.get('exam_date')),
                "exam_time": str(r.get('exam_time')),
                "reporting_time": str(r.get('reporting_time')),
                "has_error": False,
                "error_message": None
            })

        for err in val_result['errors'][:20]:
            preview_rows.append({
                "row_number": err.get('row'),
                "roll": "Invalid / Error",
                "name": "-",
                "unit": "-",
                "center_code": "-",
                "building": "-",
                "room": "-",
                "seat_no": "-",
                "exam_date": "-",
                "exam_time": "-",
                "reporting_time": "-",
                "has_error": True,
                "error_field": err.get('field'),
                "error_message": err.get('message')
            })

        return Response({
            "batch_id": batch.id,
            "status": batch.status,
            "total_rows": val_result['total_rows'],
            "valid_rows_count": val_result['valid_rows_count'],
            "failed_rows_count": len(val_result['errors']),
            "errors": val_result['errors'],
            "preview_rows": preview_rows,
            "message": "File analyzed and saved in preview mode. Submit to /confirm/ endpoint to apply changes."
        }, status=status.HTTP_200_OK if val_result['success'] else status.HTTP_422_UNPROCESSABLE_ENTITY)


class ExcelConfirmView(APIView):
    """
    POST /api/admin/upload/<id>/confirm/
    Imports valid rows in a single atomic database transaction.
    Marks this batch active, deactivates previous active batch, and logs to AuditLog.
    Requires Admin JWT authentication.
    """
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk, *args, **kwargs):
        batch = get_object_or_404(UploadBatch, pk=pk)

        if batch.status == 'confirmed' and batch.is_active:
            return Response(
                {"detail": f"Batch #{batch.id} is already confirmed and currently active."},
                status=status.HTTP_400_BAD_REQUEST
            )

        validator = ExcelSeatPlanValidator(batch.file.path)
        val_result = validator.validate()

        if not val_result['valid_rows']:
            return Response(
                {
                    "error": "Batch contains no valid rows to import.",
                    "errors": val_result['errors']
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        imported_count = execute_batch_import(
            batch=batch,
            valid_rows=val_result['valid_rows'],
            user=request.user
        )
        cache.delete("active_confirmed_batch")

        return Response({
            "detail": "Batch confirmed and imported successfully into database.",
            "batch_id": batch.id,
            "imported_count": imported_count,
            "status": batch.status,
            "is_active": batch.is_active
        }, status=status.HTTP_200_OK)


class ExcelRollbackView(APIView):
    """
    POST /api/admin/upload/<id>/rollback/
    Reactivates the previously active batch and deactivates the current batch.
    Requires Admin JWT authentication.
    """
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk, *args, **kwargs):
        batch = get_object_or_404(UploadBatch, pk=pk)

        prev_batch = execute_batch_rollback(batch=batch, user=request.user)
        cache.delete("active_confirmed_batch")

        return Response({
            "detail": f"Batch #{batch.id} has been rolled back.",
            "rolled_back_batch_id": batch.id,
            "active_batch_id": prev_batch.id if prev_batch else None,
            "active_batch_status": prev_batch.status if prev_batch else None
        }, status=status.HTTP_200_OK)
