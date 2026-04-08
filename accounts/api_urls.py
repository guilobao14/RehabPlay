from django.urls import path
from .api_views import MyProfileView, MySettingsView, TherapistPatientListView

urlpatterns = [
    path("me/profile/", MyProfileView.as_view(), name="api_me_profile"),
    path("me/settings/", MySettingsView.as_view(), name="api_me_settings"),
    path("therapist/patients/", TherapistPatientListView.as_view(), name="api_therapist_patients"),
]