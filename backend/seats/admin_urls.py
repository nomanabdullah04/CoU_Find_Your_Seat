from django.urls import path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from .views import (
    TemplateDownloadView,
    ExcelUploadView,
    ExcelConfirmView,
    ExcelRollbackView,
    AdminCenterViewSet,
    AdminDashboardStatsView,
    AdminSettingsView,
)
from content.views import (
    AdminNoticeViewSet,
    AdminAdmissionStepViewSet,
    AdminFAQViewSet,
    AdminAssociationViewSet,
    AdminContactViewSet,
    AdminHelpSettingsViewSet,
)

router = DefaultRouter()
router.register('centers', AdminCenterViewSet, basename='admin-centers')
router.register('notices', AdminNoticeViewSet, basename='admin-notices')
router.register('steps', AdminAdmissionStepViewSet, basename='admin-steps')
router.register('faq', AdminFAQViewSet, basename='admin-faq')
router.register('associations', AdminAssociationViewSet, basename='admin-associations')
router.register('contacts', AdminContactViewSet, basename='admin-contacts')
router.register('helplines', AdminHelpSettingsViewSet, basename='admin-helplines')

urlpatterns = [
    # JWT Auth for Admin
    path('login/', TokenObtainPairView.as_view(), name='admin_login'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Dashboard Analytics
    path('stats/', AdminDashboardStatsView.as_view(), name='admin_dashboard_stats'),
    path('settings/', AdminSettingsView.as_view(), name='admin_settings'),

    # Excel Seat Plan Importer
    path('template/', TemplateDownloadView.as_view(), name='admin_template_download'),
    path('upload/', ExcelUploadView.as_view(), name='admin_excel_upload'),
    path('upload/<int:pk>/confirm/', ExcelConfirmView.as_view(), name='admin_excel_confirm'),
    path('upload/<int:pk>/rollback/', ExcelRollbackView.as_view(), name='admin_excel_rollback'),
] + router.urls
