from rest_framework.permissions import BasePermission
from django_otp.plugins.otp_totp.models import TOTPDevice

class IsPatient(BasePermission):
    def has_permission(self, request, view):
        return (
            hasattr(request.user, "profile")
            and request.user.profile.role == "PATIENT"
            and otp_ok(request.user)
        )

class IsTherapist(BasePermission):
    def has_permission(self, request, view):
        return (
            hasattr(request.user, "profile")
            and request.user.profile.role == "THERAPIST"
            and otp_ok(request.user)
        )

def otp_ok(user) -> bool:
    # só exige OTP se o user já tiver 2FA confirmado
    has_confirmed = TOTPDevice.objects.filter(user=user, confirmed=True).exists()
    if not has_confirmed:
        return True
    is_verified = getattr(user, "is_verified", None)
    return bool(is_verified and is_verified())

class IsAuthenticatedOTP(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user.is_authenticated and otp_ok(request.user))