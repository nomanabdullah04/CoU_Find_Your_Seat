import io
import hashlib
from datetime import date, time
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.cache import cache
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from openpyxl import Workbook
import pandas as pd

from .models import Center, Candidate, SeatAssignment, UploadBatch, AuditLog, SearchLog, SiteSetting
from .importers import (
    EXPECTED_COLUMNS,
    generate_excel_template,
    ExcelSeatPlanValidator,
    execute_batch_import,
    execute_batch_rollback
)


def create_in_memory_excel(rows, headers=EXPECTED_COLUMNS):
    wb = Workbook()
    ws = wb.active
    ws.append(headers)
    for row in rows:
        ws.append(row)
    bio = io.BytesIO()
    wb.save(bio)
    bio.seek(0)
    return bio


class ExcelImporterAndUploadTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.admin_user = User.objects.create_superuser(
            username='admin_test',
            email='admin@cou.ac.bd',
            password='Password123!'
        )
        self.client.force_authenticate(user=self.admin_user)

        self.center1 = Center.objects.create(
            code="CUC-01",
            name_en="Comilla University Campus",
            name_bn="কুমিল্লা বিশ্ববিদ্যালয় ক্যাম্পাস",
            address="Kotbari, Cumilla",
            latitude=23.4190200,
            longitude=91.1378300,
            gate_info="Main Gate",
            instructions_en="Gate 1 -> Science Faculty -> Room 204",
            instructions_bn="গেট ১ -> বিজ্ঞান অনুষদ -> রুম ২০৪"
        )
        self.center2 = Center.objects.create(
            code="CC-02",
            name_en="Comilla Victoria Govt. College",
            name_bn="কুমিল্লা ভিক্টোরিয়া সরকারি কলেজ",
            address="Degree Section, Cumilla",
            latitude=23.4600100,
            longitude=91.1800200,
            gate_info="South Gate",
            instructions_en="Degree Building -> Room 102",
            instructions_bn="ডিগ্রি ভবন -> রুম ১০২"
        )

    def test_generate_excel_template(self):
        buffer = generate_excel_template()
        df = pd.read_excel(buffer)
        self.assertEqual(list(df.columns), EXPECTED_COLUMNS)
        self.assertEqual(len(df), 3)

        url = reverse('admin_template_download')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', response['Content-Type'])
        self.assertIn('seat_plan_template.xlsx', response['Content-Disposition'])

    def test_validation_valid_file(self):
        rows = [
            ["200001", "Rahim", "A", "CUC-01", "Campus", "Science", "101", "1", "2026-12-05", "10:00", "09:00"],
            ["200002", "Karim", "A", "CUC-01", "Campus", "Science", "101", "2", "2026-12-05", "10:00", "09:00"],
        ]
        bio = create_in_memory_excel(rows)
        validator = ExcelSeatPlanValidator(bio)
        result = validator.validate()

        self.assertTrue(result['success'])
        self.assertEqual(result['valid_rows_count'], 2)
        self.assertEqual(len(result['errors']), 0)

    def test_validation_duplicate_roll_flagged(self):
        rows = [
            ["200001", "Rahim", "A", "CUC-01", "Campus", "Science", "101", "1", "2026-12-05", "10:00", "09:00"],
            ["200001", "Duplicate Rahim", "A", "CUC-01", "Campus", "Science", "101", "2", "2026-12-05", "10:00", "09:00"],
        ]
        bio = create_in_memory_excel(rows)
        validator = ExcelSeatPlanValidator(bio)
        result = validator.validate()

        self.assertFalse(result['success'])
        self.assertTrue(any(e['field'] == 'admission_roll' for e in result['errors']))

    def test_validation_duplicate_seat_in_same_room_flagged(self):
        rows = [
            ["200001", "Rahim", "A", "CUC-01", "Campus", "Science", "101", "15", "2026-12-05", "10:00", "09:00"],
            ["200002", "Karim", "A", "CUC-01", "Campus", "Science", "101", "15", "2026-12-05", "10:00", "09:00"],
        ]
        bio = create_in_memory_excel(rows)
        validator = ExcelSeatPlanValidator(bio)
        result = validator.validate()

        self.assertFalse(result['success'])
        self.assertTrue(any(e['field'] == 'seat_no' for e in result['errors']))

    def test_validation_missing_center_code_flagged(self):
        rows = [
            ["200001", "Rahim", "A", "NON-EXISTENT", "Unknown", "Hall", "101", "1", "2026-12-05", "10:00", "09:00"],
        ]
        bio = create_in_memory_excel(rows)
        validator = ExcelSeatPlanValidator(bio)
        result = validator.validate()

        self.assertFalse(result['success'])
        self.assertTrue(any(e['field'] == 'center_code' for e in result['errors']))

    def test_upload_api_preview_mode(self):
        rows = [
            ["300001", "Amina", "A", "CUC-01", "Campus", "Arts", "301", "10", "2026-12-05", "10:00", "09:00"],
        ]
        bio = create_in_memory_excel(rows)
        uploaded_file = SimpleUploadedFile(
            name="test_seats.xlsx",
            content=bio.getvalue(),
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )

        url = reverse('admin_excel_upload')
        response = self.client.post(url, {'file': uploaded_file}, format='multipart')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'preview')
        self.assertEqual(response.data['valid_rows_count'], 1)
        self.assertEqual(response.data['total_rows'], 1)

        batch_id = response.data['batch_id']
        batch = UploadBatch.objects.get(id=batch_id)
        self.assertEqual(batch.status, 'preview')
        self.assertFalse(batch.is_active)
        self.assertFalse(Candidate.objects.filter(roll="300001").exists())

    def test_confirm_and_rollback_flow(self):
        rows = [
            ["400001", "Sadia", "B", "CUC-01", "Campus", "Business", "201", "01", "2026-12-06", "11:00", "10:00"],
            ["400002", "Kamal", "B", "CUC-01", "Campus", "Business", "201", "02", "2026-12-06", "11:00", "10:00"],
        ]
        bio = create_in_memory_excel(rows)
        uploaded_file = SimpleUploadedFile(
            name="batch_1.xlsx",
            content=bio.getvalue(),
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )

        # 1. Upload
        upload_url = reverse('admin_excel_upload')
        upload_resp = self.client.post(upload_url, {'file': uploaded_file}, format='multipart')
        self.assertEqual(upload_resp.status_code, status.HTTP_200_OK)
        batch_id = upload_resp.data['batch_id']

        # 2. Confirm
        confirm_url = reverse('admin_excel_confirm', kwargs={'pk': batch_id})
        confirm_resp = self.client.post(confirm_url)
        self.assertEqual(confirm_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(confirm_resp.data['imported_count'], 2)

        batch = UploadBatch.objects.get(id=batch_id)
        self.assertEqual(batch.status, 'confirmed')
        self.assertTrue(batch.is_active)
        self.assertTrue(Candidate.objects.filter(roll="400001").exists())
        self.assertTrue(SeatAssignment.objects.filter(candidate__roll="400001").exists())
        self.assertTrue(AuditLog.objects.filter(action__contains=f"batch #{batch_id}").exists())

        # 3. Rollback
        rollback_url = reverse('admin_excel_rollback', kwargs={'pk': batch_id})
        rollback_resp = self.client.post(rollback_url)
        self.assertEqual(rollback_resp.status_code, status.HTTP_200_OK)

        batch.refresh_from_db()
        self.assertFalse(batch.is_active)
        self.assertFalse(SeatAssignment.objects.filter(batch=batch).exists())
        self.assertTrue(AuditLog.objects.filter(action__contains=f"Rolled back batch #{batch_id}").exists())


class PublicSeatSearchSecurityTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.client.logout()  # Unauthenticated public candidate client

        # Create active batch
        self.batch = UploadBatch.objects.create(
            file=SimpleUploadedFile("seats.xlsx", b"fakecontent"),
            status='confirmed',
            is_active=True,
            rows_total=1
        )

        self.center = Center.objects.create(
            code="CUC-01",
            name_en="Comilla University Campus",
            name_bn="কুমিল্লা বিশ্ববিদ্যালয় ক্যাম্পাস",
            address="Kotbari, Cumilla",
            latitude=23.4190200,
            longitude=91.1378300,
            gate_info="Main Gate",
            instructions_en="Gate 1 -> Science Building -> Room 204",
            instructions_bn="গেট ১ -> বিজ্ঞান অনুষদ -> রুম ২০৪"
        )

        self.candidate = Candidate.objects.create(
            roll="500123",
            name="Rahim Uddin",
            unit="A",
            verify_field="1234"
        )

        self.assignment = SeatAssignment.objects.create(
            candidate=self.candidate,
            center=self.center,
            building="Science Building",
            room="204",
            seat_no="17",
            exam_date=date(2026, 12, 5),
            exam_time=time(10, 0),
            reporting_time=time(9, 0),
            batch=self.batch
        )

        self.setting = SiteSetting.get_settings()
        self.setting.require_verification = False
        self.setting.rate_limit_per_minute = 20
        self.setting.save()

    def test_search_found_get_and_post(self):
        """Test search returns candidate, seat and center minimum data for valid roll."""
        url = reverse('seat_search')

        # GET request
        response_get = self.client.get(url, {'admission_roll': '500123'})
        self.assertEqual(response_get.status_code, status.HTTP_200_OK)
        self.assertTrue(response_get.data['found'])
        self.assertEqual(response_get.data['candidate']['roll'], '500123')
        self.assertEqual(response_get.data['candidate']['name'], 'Rahim Uddin')
        self.assertEqual(response_get.data['seat']['room'], '204')
        self.assertEqual(response_get.data['seat']['seat_no'], '17')
        self.assertEqual(response_get.data['center']['code'], 'CUC-01')

        # POST request
        response_post = self.client.post(url, {'admission_roll': '500123'})
        self.assertEqual(response_post.status_code, status.HTTP_200_OK)
        self.assertTrue(response_post.data['found'])

        # Verify SearchLog created with hashed roll and hashed IP (never raw)
        expected_roll_hash = hashlib.sha256('500123'.encode('utf-8')).hexdigest()
        log = SearchLog.objects.filter(roll_hash=expected_roll_hash).first()
        self.assertIsNotNone(log)
        self.assertTrue(log.found)
        self.assertNotEqual(log.roll_hash, '500123')

    def test_search_not_found(self):
        """Test non-existent roll returns friendly bilingual 404 message."""
        url = reverse('seat_search')
        response = self.client.get(url, {'admission_roll': '999999'})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertFalse(response.data['found'])
        self.assertIn('message_en', response.data)
        self.assertIn('message_bn', response.data)
        self.assertIn('helpdesk', response.data)

        # Verify SearchLog recorded not found
        expected_roll_hash = hashlib.sha256('999999'.encode('utf-8')).hexdigest()
        log = SearchLog.objects.filter(roll_hash=expected_roll_hash).first()
        self.assertIsNotNone(log)
        self.assertFalse(log.found)

    def test_search_verification_field(self):
        """Test search with required verification field."""
        self.setting.require_verification = True
        self.setting.save()

        url = reverse('seat_search')

        # 1. Missing verify_field
        resp_missing = self.client.post(url, {'admission_roll': '500123'})
        self.assertEqual(resp_missing.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(resp_missing.data['verification_error'])

        # 2. Wrong verify_field
        resp_wrong = self.client.post(url, {'admission_roll': '500123', 'verify_field': '9999'})
        self.assertEqual(resp_wrong.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(resp_wrong.data['verification_error'])

        # 3. Correct verify_field
        resp_correct = self.client.post(url, {'admission_roll': '500123', 'verify_field': '1234'})
        self.assertEqual(resp_correct.status_code, status.HTTP_200_OK)
        self.assertTrue(resp_correct.data['found'])

    def test_search_rate_limit(self):
        """Test rate limit blocks after threshold per minute."""
        self.setting.rate_limit_per_minute = 3
        self.setting.save()

        url = reverse('seat_search')

        # Requests 1, 2, 3 succeed
        for _ in range(3):
            resp = self.client.get(url, {'admission_roll': '500123'})
            self.assertEqual(resp.status_code, status.HTTP_200_OK)

        # 4th request exceeds rate limit
        resp_blocked = self.client.get(url, {'admission_roll': '500123'})
        self.assertEqual(resp_blocked.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        self.assertIn('message_en', resp_blocked.data)
        self.assertIn('message_bn', resp_blocked.data)

    def test_only_searches_active_batch(self):
        """Test that inactive batch assignments are excluded from public search."""
        # Deactivate current batch
        self.batch.is_active = False
        self.batch.save()

        url = reverse('seat_search')
        response = self.client.get(url, {'admission_roll': '500123'})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class AdminPermissionAndSecurityTests(APITestCase):
    """
    Tests ensuring that non-admin users and anonymous public clients
    are strictly forbidden from admin actions (upload, confirm, rollback, etc.)
    """
    def setUp(self):
        cache.clear()
        self.normal_user = User.objects.create_user(
            username='candidate_user',
            password='Password123!',
            is_staff=False
        )
        self.batch = UploadBatch.objects.create(
            file=SimpleUploadedFile("dummy.xlsx", b"dummy"),
            status='preview',
            is_active=False
        )

    def test_anonymous_cannot_upload_excel(self):
        url = reverse('admin_excel_upload')
        dummy_file = SimpleUploadedFile("test.xlsx", b"dummy", content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        response = self.client.post(url, {'file': dummy_file}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_non_staff_user_cannot_upload_excel(self):
        self.client.force_authenticate(user=self.normal_user)
        url = reverse('admin_excel_upload')
        dummy_file = SimpleUploadedFile("test.xlsx", b"dummy", content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        response = self.client.post(url, {'file': dummy_file}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_anonymous_cannot_confirm_batch(self):
        url = reverse('admin_excel_confirm', kwargs={'pk': self.batch.id})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_non_staff_cannot_confirm_batch(self):
        self.client.force_authenticate(user=self.normal_user)
        url = reverse('admin_excel_confirm', kwargs={'pk': self.batch.id})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_anonymous_cannot_rollback_batch(self):
        url = reverse('admin_excel_rollback', kwargs={'pk': self.batch.id})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_non_staff_cannot_rollback_batch(self):
        self.client.force_authenticate(user=self.normal_user)
        url = reverse('admin_excel_rollback', kwargs={'pk': self.batch.id})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_non_admin_cannot_access_admin_settings_or_centers(self):
        self.client.force_authenticate(user=self.normal_user)
        # Settings
        settings_url = reverse('admin_settings')
        resp = self.client.patch(settings_url, {'require_verification': True}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

        # Centers list
        centers_url = '/api/admin/centers/'
        resp_centers = self.client.get(centers_url)
        self.assertEqual(resp_centers.status_code, status.HTTP_403_FORBIDDEN)

