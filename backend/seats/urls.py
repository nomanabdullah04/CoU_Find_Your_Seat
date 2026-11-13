from django.urls import path
from .views import SeatSearchView, PublicSettingsView

urlpatterns = [
    path('search/', SeatSearchView.as_view(), name='seat_search'),
    path('settings/', PublicSettingsView.as_view(), name='seat_public_settings'),
]
