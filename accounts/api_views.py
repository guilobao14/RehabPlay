from django.contrib.auth import authenticate, login, logout
from accounts.permissions import IsAuthenticatedOTP, IsTherapist
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.contrib.auth import get_user_model

from .models import Profile, AccountSettings
from .serializers import (
    MyProfileSerializer,
    MyAccountSettingsSerializer,
    TherapistPatientOptionSerializer,
)

from audit.services import log_action
from audit.models import AuditAction

from django.db import transaction

class RegisterView(APIView):
    permission_classes = []
    parser_classes = [JSONParser]

    @transaction.atomic
    def post(self, request):
        User = get_user_model()

        username = str(request.data.get("username", "")).strip()
        password = str(request.data.get("password", "")).strip()
        role = str(request.data.get("role", "")).strip()
        display_name = str(request.data.get("display_name", "")).strip()
        phone = str(request.data.get("phone", "")).strip()

        if not username or not password or not role or not display_name:
            return Response(
                {"detail": "username, password, role e display_name são obrigatórios."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if role not in ["PATIENT", "THERAPIST", "FAMILY"]:
            return Response(
                {"detail": "Role inválido."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if User.objects.filter(username=username).exists():
            return Response(
                {"detail": "Esse username já existe."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.create_user(
            username=username,
            password=password,
        )

        # Se tens signals.py, Profile e AccountSettings já devem existir aqui
        profile = user.profile
        profile.role = role
        profile.display_name = display_name
        profile.phone = phone
        profile.save()

        return Response(
            {
                "detail": "Conta criada com sucesso.",
                "id": user.id,
                "username": user.username,
                "role": role,
                "display_name": display_name,
            },
            status=status.HTTP_201_CREATED,
        )

class LoginView(APIView):
    permission_classes = []
    parser_classes = [JSONParser]

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        if not username or not password:
            return Response(
                {"detail": "Username e password são obrigatórios."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = authenticate(request, username=username, password=password)
        if user is None:
            return Response(
                {"detail": "Credenciais inválidas."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        login(request, user)

        profile = getattr(user, "profile", None)

        return Response(
            {
                "id": user.id,
                "username": user.username,
                "role": profile.role if profile else None,
                "display_name": profile.display_name if profile else user.username,
            },
            status=status.HTTP_200_OK,
        )


class LogoutView(APIView):
    permission_classes = [IsAuthenticatedOTP]

    def post(self, request):
        logout(request)
        return Response(
            {"detail": "Sessão terminada."},
            status=status.HTTP_200_OK,
        )


class MeView(APIView):
    permission_classes = [IsAuthenticatedOTP]

    def get(self, request):
        profile = getattr(request.user, "profile", None)

        return Response(
            {
                "id": request.user.id,
                "username": request.user.username,
                "role": profile.role if profile else None,
                "display_name": profile.display_name if profile else request.user.username,
            }
        )


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