from django.urls import reverse
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase
from seats.models import Center, Candidate, SearchLog, UploadBatch
from content.models import Notice, AdmissionStep, FAQ, Association, Contact, HelpSettings

class ContentAndAdminAPITests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(
            username='admin_tester',
            email='admin@cou.ac.bd',
            password='AdminPassword123!'
        )

        self.center = Center.objects.create(
            code="CUC-01",
            name_en="Comilla University Campus",
            name_bn="কুমিল্লা বিশ্ববিদ্যালয় ক্যাম্পাস",
            address="Kotbari, Cumilla",
            latitude=23.419,
            longitude=91.137,
            gate_info="Gate 1"
        )

        self.step = AdmissionStep.objects.create(
            order=1,
            title_en="Read Circular",
            title_bn="বিজ্ঞপ্তি পড়া",
            description_en="Read the details",
            description_bn="বিস্তারিত পড়ুন"
        )

        self.faq = FAQ.objects.create(
            order=1,
            question_en="What to bring?",
            question_bn="কী আনব?",
            answer_en="Admit card and pens",
            answer_bn="প্রবেশপত্র ও কলম"
        )

        self.notice = Notice.objects.create(
            title_en="Exam Guidelines",
            title_bn="পরীক্ষার নিয়মাবলি",
            body_en="Be on time",
            body_bn="সময়ে উপস্থিত থাকুন",
            is_pinned=True
        )

    def test_public_get_endpoints(self):
        """Test public endpoints are accessible without authentication."""
        # Centers list & detail
        res = self.client.get('/api/centers/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)

        res = self.client.get(f'/api/centers/{self.center.id}/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['code'], 'CUC-01')

        # Steps
        res = self.client.get('/api/steps/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)

        # Notices
        res = self.client.get('/api/notices/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)

        # FAQ
        res = self.client.get('/api/faq/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)

    def test_admin_login_jwt(self):
        """Test POST /api/admin/login/ returns JWT access and refresh tokens."""
        res = self.client.post('/api/admin/login/', {
            'username': 'admin_tester',
            'password': 'AdminPassword123!'
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('access', res.data)
        self.assertIn('refresh', res.data)

    def test_admin_stats(self):
        """Test GET /api/admin/stats/ requires authentication and returns stats."""
        # Without auth -> 401
        res = self.client.get('/api/admin/stats/')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        # With auth -> 200
        self.client.force_authenticate(user=self.admin)
        res = self.client.get('/api/admin/stats/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('total_candidates', res.data)
        self.assertIn('total_searches', res.data)
        self.assertIn('searches_last_hour', res.data)
        self.assertIn('not_found_searches', res.data)
        self.assertIn('total_centers', res.data)

    def test_admin_jwt_crud_centers(self):
        """Test admin CRUD endpoints for centers."""
        self.client.force_authenticate(user=self.admin)

        # Create
        res = self.client.post('/api/admin/centers/', {
            'code': 'CC-99',
            'name_en': 'Test Center',
            'name_bn': 'টেস্ট কেন্দ্র',
            'address': 'Cumilla City',
            'latitude': 23.450,
            'longitude': 91.170,
            'gate_info': 'Gate A'
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        new_id = res.data['id']

        # Update
        res = self.client.patch(f'/api/admin/centers/{new_id}/', {'name_en': 'Updated Center'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['name_en'], 'Updated Center')

        # Delete
        res = self.client.delete(f'/api/admin/centers/{new_id}/')
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)

    def test_admin_jwt_crud_notices(self):
        """Test admin CRUD endpoints for notices."""
        self.client.force_authenticate(user=self.admin)

        # Create
        res = self.client.post('/api/admin/notices/', {
            'title_en': 'New Notice',
            'title_bn': 'নতুন নোটিশ',
            'body_en': 'Notice body',
            'body_bn': 'নোটিশ বিবরণ',
            'is_pinned': False
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        notice_id = res.data['id']

        # Delete
        res = self.client.delete(f'/api/admin/notices/{notice_id}/')
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)

    # Help & Associations Tests

    def test_public_help_endpoint_and_visibility(self):
        """Test GET /api/help/ returns only visible items and active associations."""
        helpline_primary = HelpSettings.objects.create(
            label_bn="প্রধান হেল্পলাইন",
            label_en="Primary Helpline",
            phone="01711-111111",
            is_primary=True,
            order=1
        )
        helpline_emergency = HelpSettings.objects.create(
            label_bn="জরুরি পুলিশ",
            label_en="Emergency Police",
            phone="999",
            is_primary=False,
            order=2
        )

        assoc = Association.objects.create(
            name_bn="বরিশাল ছাত্র পরিষদ",
            name_en="Barisal Student Council",
            type="division",
            order=1,
            is_active=True
        )

        # Visible contact
        contact_vis = Contact.objects.create(
            association=assoc,
            role="secretary",
            name="Visible Member",
            phone="01711-222222",
            is_visible=True
        )

        # Hidden contact
        contact_hidden = Contact.objects.create(
            association=assoc,
            role="general_secretary",
            name="Hidden Member",
            phone="01711-333333",
            is_visible=False
        )

        res = self.client.get('/api/help/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('primary_helpline', res.data)
        self.assertEqual(res.data['primary_helpline']['phone'], "01711-111111")
        self.assertEqual(len(res.data['emergency_helplines']), 2)

        # Check associations
        self.assertEqual(len(res.data['associations']), 1)
        assoc_contacts = res.data['associations'][0]['contacts']
        # Only visible contact should be returned
        self.assertEqual(len(assoc_contacts), 1)
        self.assertEqual(assoc_contacts[0]['name'], "Visible Member")

    def test_admin_associations_and_contacts_crud(self):
        """Test Admin JWT CRUD for Associations and Contacts."""
        self.client.force_authenticate(user=self.admin)

        # 1. Create Association
        res = self.client.post('/api/admin/associations/', {
            'name_bn': 'ঢাকা জেলা ছাত্র সমিতি',
            'name_en': 'Dhaka District Student Society',
            'type': 'district',
            'order': 1,
            'is_active': True
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        assoc_id = res.data['id']

        # 2. Create Contact
        res = self.client.post('/api/admin/contacts/', {
            'association': assoc_id,
            'role': 'secretary',
            'name': 'Rafi Ahmed',
            'phone': '01711-999888',
            'whatsapp': '01711999888',
            'available_time': '8:00 AM - 10:00 PM',
            'is_visible': True
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        contact_id = res.data['id']

        # 3. Toggle Visibility (PATCH)
        res = self.client.patch(f'/api/admin/contacts/{contact_id}/', {'is_visible': False})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertFalse(res.data['is_visible'])

        # 4. Delete Contact & Association
        res = self.client.delete(f'/api/admin/contacts/{contact_id}/')
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)

        res = self.client.delete(f'/api/admin/associations/{assoc_id}/')
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
