from django.urls import path
from .api_views import (
    LoginView,
    LogoutView,
    MeView,
    MyProfileView,
    MySettingsView,
    TherapistPatientListView,
    RegisterView,
)

urlpatterns = [
    path("auth/login/", LoginView.as_view(), name="api_auth_login"),
    path("auth/logout/", LogoutView.as_view(), name="api_auth_logout"),
    path("auth/me/", MeView.as_view(), name="api_auth_me"),
    path("auth/register/", RegisterView.as_view(), name="api_auth_register"),

    path("me/profile/", MyProfileView.as_view(), name="api_me_profile"),
    path("me/settings/", MySettingsView.as_view(), name="api_me_settings"),
    path("therapist/patients/", TherapistPatientListView.as_view(), name="api_therapist_patients"),
]