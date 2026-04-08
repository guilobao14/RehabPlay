from django.urls import path
from .otp_api_views import OTPSetupView, OTPVerifyView

urlpatterns = [
    path("auth/2fa/setup/", OTPSetupView.as_view(), name="api_2fa_setup"),
    path("auth/2fa/verify/", OTPVerifyView.as_view(), name="api_2fa_verify"),
]