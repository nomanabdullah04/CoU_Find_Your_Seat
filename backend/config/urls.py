from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from seats.views import PublicCenterListView, PublicCenterDetailView
from content.views import (
    PublicNoticeListView,
    PublicAdmissionStepListView,
    PublicFAQListView,
    PublicHelpView,
)

urlpatterns = [
    path('admin/', admin.site.urls),

    # Public Content & Centers Endpoints
    path('api/centers/', PublicCenterListView.as_view(), name='public_centers_list'),
    path('api/centers/<int:pk>/', PublicCenterDetailView.as_view(), name='public_center_detail'),
    path('api/steps/', PublicAdmissionStepListView.as_view(), name='public_steps_list'),
    path('api/notices/', PublicNoticeListView.as_view(), name='public_notices_list'),
    path('api/faq/', PublicFAQListView.as_view(), name='public_faq_list'),
    path('api/help/', PublicHelpView.as_view(), name='public_help_view'),

    # Admin JWT Portal & CRUD Endpoints
    path('api/admin/', include('seats.admin_urls')),

    # Public Seat Search API
    path('api/seat/', include('seats.urls')),
    path('api/seats/', include('seats.urls')),
    path('api/content/', include('content.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
