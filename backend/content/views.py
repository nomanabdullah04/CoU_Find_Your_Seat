from rest_framework import generics, viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import Notice, AdmissionStep, FAQ, Association, Contact, HelpSettings
from .serializers import (
    NoticeSerializer,
    AdmissionStepSerializer,
    FAQSerializer,
    AssociationSerializer,
    PublicAssociationSerializer,
    ContactSerializer,
    HelpSettingsSerializer
)

# --- Public Read-Only Views ---

class PublicNoticeListView(generics.ListAPIView):
    """
    GET /api/notices/
    Public listing of notices, sorted by pinned first, then newest.
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = NoticeSerializer
    queryset = Notice.objects.all().order_by('-is_pinned', '-published_at')


class PublicAdmissionStepListView(generics.ListAPIView):
    """
    GET /api/steps/
    Public listing of admission timeline steps in chronological order.
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = AdmissionStepSerializer
    queryset = AdmissionStep.objects.filter(is_active=True).order_by('order', 'id')


class PublicFAQListView(generics.ListAPIView):
    """
    GET /api/faq/
    Public listing of FAQs in order.
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = FAQSerializer
    queryset = FAQ.objects.filter(is_active=True).order_by('order', 'id')


class PublicHelpView(APIView):
    """
    GET /api/help/
    Public listing of primary helpline, emergency services, and active student
    district/division associations with their visible contacts.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        primary = HelpSettings.objects.filter(is_primary=True).first()
        if not primary:
            primary = HelpSettings.objects.first()

        emergencies = HelpSettings.objects.all().order_by('-is_primary', 'order', 'id')
        associations = Association.objects.filter(is_active=True).order_by('order', 'id')

        return Response({
            "primary_helpline": HelpSettingsSerializer(primary).data if primary else None,
            "emergency_helplines": HelpSettingsSerializer(emergencies, many=True).data,
            "associations": PublicAssociationSerializer(associations, many=True).data
        }, status=status.HTTP_200_OK)


# --- Admin JWT CRUD ViewSets ---

class AdminNoticeViewSet(viewsets.ModelViewSet):
    """
    Admin CRUD for Notices:
    GET, POST /api/admin/notices/
    GET, PUT, PATCH, DELETE /api/admin/notices/<id>/
    """
    permission_classes = [permissions.IsAdminUser]
    serializer_class = NoticeSerializer
    queryset = Notice.objects.all().order_by('-is_pinned', '-published_at')


class AdminAdmissionStepViewSet(viewsets.ModelViewSet):
    """
    Admin CRUD for Admission Steps:
    GET, POST /api/admin/steps/
    GET, PUT, PATCH, DELETE /api/admin/steps/<id>/
    """
    permission_classes = [permissions.IsAdminUser]
    serializer_class = AdmissionStepSerializer
    queryset = AdmissionStep.objects.all().order_by('order', 'id')


class AdminFAQViewSet(viewsets.ModelViewSet):
    """
    Admin CRUD for FAQs:
    GET, POST /api/admin/faq/
    GET, PUT, PATCH, DELETE /api/admin/faq/<id>/
    """
    permission_classes = [permissions.IsAdminUser]
    serializer_class = FAQSerializer
    queryset = FAQ.objects.all().order_by('order', 'id')


class AdminAssociationViewSet(viewsets.ModelViewSet):
    """
    Admin CRUD for Associations:
    GET, POST /api/admin/associations/
    GET, PUT, PATCH, DELETE /api/admin/associations/<id>/
    """
    permission_classes = [permissions.IsAdminUser]
    serializer_class = AssociationSerializer
    queryset = Association.objects.all().order_by('order', 'id')


class AdminContactViewSet(viewsets.ModelViewSet):
    """
    Admin CRUD for Association Contacts:
    GET, POST /api/admin/contacts/
    GET, PUT, PATCH, DELETE /api/admin/contacts/<id>/
    """
    permission_classes = [permissions.IsAdminUser]
    serializer_class = ContactSerializer
    queryset = Contact.objects.all().order_by('association', 'id')


class AdminHelpSettingsViewSet(viewsets.ModelViewSet):
    """
    Admin CRUD for Help Helplines:
    GET, POST /api/admin/helplines/
    GET, PUT, PATCH, DELETE /api/admin/helplines/<id>/
    """
    permission_classes = [permissions.IsAdminUser]
    serializer_class = HelpSettingsSerializer
    queryset = HelpSettings.objects.all().order_by('-is_primary', 'order', 'id')
