from django_otp.plugins.otp_totp.models import TOTPDevice
from django_otp.util import random_hex
from django_otp import login as otp_login

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status


class OTPSetupView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        device = TOTPDevice.objects.filter(user=request.user, name="default").first()

        if device and device.confirmed:
            return Response(
                {
                    "detail": "2FA already configured.",
                    "confirmed": True,
                },
                status=status.HTTP_200_OK,
            )

        if not device:
            device = TOTPDevice.objects.create(user=request.user, name="default")
            device.key = random_hex(20)
            device.confirmed = False
            device.save()

        return Response(
            {
                "detail": "Scan the otpauth_url in Google Authenticator/Authy, then call /api/auth/2fa/verify/ with the code.",
                "otpauth_url": device.config_url,
                "confirmed": device.confirmed,
            },
            status=status.HTTP_200_OK,
        )


class OTPVerifyView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        token = str(request.data.get("token", "")).strip()

        device = TOTPDevice.objects.filter(user=request.user, name="default").first()
        if not device:
            return Response(
                {"detail": "No TOTP device. Run setup first."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ok = device.verify_token(token)
        if not ok:
            return Response(
                {"detail": "Invalid token."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not device.confirmed:
            device.confirmed = True
            device.save(update_fields=["confirmed"])

        otp_login(request, device)

        return Response(
            {"detail": "OTP verified.", "confirmed": True},
            status=status.HTTP_200_OK,
        )
    
    