from django_otp.plugins.otp_totp.models import TOTPDevice
from rest_framework.permissions import BasePermission


class IsOTPVerified(BasePermission):
    """
    Se o user tiver 2FA confirmado, exige sessão OTP verificada.
    Se ainda não tiver 2FA configurado, deixa passar (para poder configurar).
    """
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        has_confirmed = TOTPDevice.objects.filter(user=user, confirmed=True).exists()
        if not has_confirmed:
            return True

        is_verified = getattr(user, "is_verified", None)
        return bool(is_verified and is_verified())