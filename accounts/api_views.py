from accounts.permissions import IsAuthenticatedOTP, IsTherapist
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from .models import Profile, AccountSettings
from .serializers import (
    MyProfileSerializer,
    MyAccountSettingsSerializer,
    TherapistPatientOptionSerializer,
)

from audit.services import log_action
from audit.models import AuditAction


class MyProfileView(APIView):
    permission_classes = [IsAuthenticatedOTP]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        profile = Profile.objects.get(user=request.user)
        return Response(
            MyProfileSerializer(profile, context={"request": request}).data
        )

    def put(self, request):
        profile = Profile.objects.get(user=request.user)
        ser = MyProfileSerializer(
            profile,
            data=request.data,
            context={"request": request},
        )
        ser.is_valid(raise_exception=True)
        ser.save()

        log_action(
            user=request.user,
            action=AuditAction.PROFILE_UPDATED,
            request=request,
            object_type="Profile",
            object_id=profile.id,
            extra={"changed_fields": list(ser.validated_data.keys())},
        )

        return Response(
            MyProfileSerializer(profile, context={"request": request}).data
        )


class MySettingsView(APIView):
    permission_classes = [IsAuthenticatedOTP]

    def get(self, request):
        settings_obj = AccountSettings.objects.get(user=request.user)
        return Response(MyAccountSettingsSerializer(settings_obj).data)

    def put(self, request):
        settings_obj = AccountSettings.objects.get(user=request.user)
        ser = MyAccountSettingsSerializer(settings_obj, data=request.data)
        ser.is_valid(raise_exception=True)
        ser.save()

        log_action(
            user=request.user,
            action=AuditAction.SETTINGS_UPDATED,
            request=request,
            object_type="AccountSettings",
            object_id=settings_obj.id,
            extra={"changed_fields": list(ser.validated_data.keys())},
        )

        return Response(
            MyAccountSettingsSerializer(settings_obj).data,
            status=status.HTTP_200_OK,
        )


class TherapistPatientListView(APIView):
    permission_classes = [IsAuthenticatedOTP]

    def get(self, request):
        if not IsTherapist().has_permission(request, self):
            return Response(
                {"detail": "Only therapists can access this endpoint."},
                status=status.HTTP_403_FORBIDDEN,
            )

        qs = (
            Profile.objects
            .filter(role="PATIENT")
            .select_related("user")
            .order_by("display_name", "user__username")
        )

        return Response(TherapistPatientOptionSerializer(qs, many=True).data)