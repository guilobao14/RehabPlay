from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from django.utils import timezone

from accounts.permissions import IsAuthenticatedOTP
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status

from accounts.models import FamilyLink, FamilyLinkStatus, Role
from accounts.family_serializers import FamilyLinkSerializer

from audit.services import log_action
from audit.models import AuditAction

from rehab.models import ProgressEntry
from rehab.serializers import ProgressEntryTherapistSerializer


User = get_user_model()


def _get_role(user):
    return getattr(getattr(user, "profile", None), "role", None)


def _is_family(user) -> bool:
    return _get_role(user) == Role.FAMILY


def _is_patient(user) -> bool:
    return _get_role(user) == Role.PATIENT


def _can_manage_link(user, patient_id: int) -> bool:
    if _is_patient(user) and user.id == patient_id:
        return True

    if _get_role(user) == Role.THERAPIST:
        from rehab.models import RehabPlan

        return RehabPlan.objects.filter(
            therapist=user,
            patient_id=patient_id,
        ).exists()

    return False


def _get_link_or_403(user, patient_id: int):
    return FamilyLink.objects.filter(
        patient_id=patient_id,
        family=user,
        status=FamilyLinkStatus.APPROVED,
    ).first()


class FamilyLinkListCreateView(APIView):
    permission_classes = [IsAuthenticatedOTP]

    def get(self, request):
        if _is_family(request.user):
            qs = (
                FamilyLink.objects.filter(family=request.user)
                .select_related("patient", "patient__profile", "family", "family__profile")
                .order_by("-created_at")
            )
        elif _is_patient(request.user):
            qs = (
                FamilyLink.objects.filter(patient=request.user)
                .select_related("patient", "patient__profile", "family", "family__profile")
                .order_by("-created_at")
            )
        else:
            qs = FamilyLink.objects.none()

        return Response(FamilyLinkSerializer(qs, many=True).data)

    def post(self, request):
        if not _is_family(request.user):
            return Response(
                {"detail": "Only family users can request a family link."},
                status=status.HTTP_403_FORBIDDEN,
            )

        patient_username = request.data.get("patient_username")
        patient_id = request.data.get("patient")

        if patient_username:
            patient = User.objects.filter(username=patient_username).first()
        elif patient_id:
            patient = User.objects.filter(id=patient_id).first()
        else:
            return Response(
                {"detail": "patient_username or patient is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not patient:
            return Response(
                {"detail": "Patient not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if _get_role(patient) != Role.PATIENT:
            return Response(
                {"detail": "The selected user is not a patient."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        obj, created = FamilyLink.objects.get_or_create(
            patient=patient,
            family=request.user,
            defaults={
                "status": FamilyLinkStatus.PENDING,
                "can_view_progress": True,
                "can_view_messages": False,
                "created_by": request.user,
            },
        )

        if not created:
            obj.status = FamilyLinkStatus.PENDING
            obj.can_view_progress = True
            obj.can_view_messages = False
            obj.responded_at = None
            obj.created_by = request.user
            obj.save()

        log_action(
            user=request.user,
            action=AuditAction.FAMILY_LINK_CREATED,
            request=request,
            object_type="FamilyLink",
            object_id=obj.id,
            extra={
                "patient_id": obj.patient_id,
                "family_id": obj.family_id,
                "status": obj.status,
            },
        )

        return Response(
            FamilyLinkSerializer(obj).data,
            status=status.HTTP_201_CREATED,
        )


class FamilyLinkRespondView(APIView):
    permission_classes = [IsAuthenticatedOTP]

    def post(self, request, link_id: int):
        link = get_object_or_404(FamilyLink, id=link_id)

        if not _can_manage_link(request.user, link.patient_id):
            return Response(
                {"detail": "Not allowed."},
                status=status.HTTP_403_FORBIDDEN,
            )

        action = str(request.data.get("action", "")).upper()

        if action not in ["APPROVE", "REJECT"]:
            return Response(
                {"detail": "action must be APPROVE or REJECT."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if action == "APPROVE":
            link.status = FamilyLinkStatus.APPROVED
            link.can_view_progress = True
            link.can_view_messages = False
        else:
            link.status = FamilyLinkStatus.REJECTED
            link.can_view_progress = False
            link.can_view_messages = False

        link.responded_at = timezone.now()
        link.save()

        return Response(FamilyLinkSerializer(link).data)


class FamilyLinkDeleteView(APIView):
    permission_classes = [IsAuthenticatedOTP]

    def delete(self, request, link_id: int):
        link = get_object_or_404(FamilyLink, id=link_id)

        can_delete = (
            link.family_id == request.user.id
            or _can_manage_link(request.user, link.patient_id)
        )

        if not can_delete:
            return Response(
                {"detail": "Not allowed."},
                status=status.HTTP_403_FORBIDDEN,
            )

        log_action(
            user=request.user,
            action=AuditAction.FAMILY_LINK_REVOKED,
            request=request,
            object_type="FamilyLink",
            object_id=link.id,
            extra={
                "patient_id": link.patient_id,
                "family_id": link.family_id,
                "status": link.status,
            },
        )

        link.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class FamilyPatientProgressView(APIView):
    permission_classes = [IsAuthenticatedOTP]

    def get(self, request, patient_id: int):
        if not _is_family(request.user):
            return Response(
                {"detail": "Only family can access."},
                status=status.HTTP_403_FORBIDDEN,
            )

        link = _get_link_or_403(request.user, patient_id)

        if not link or not link.can_view_progress:
            return Response(
                {"detail": "Not allowed."},
                status=status.HTTP_403_FORBIDDEN,
            )

        qs = (
            ProgressEntry.objects
            .filter(patient_id=patient_id)
            .select_related("patient", "plan_item__exercise", "plan_item__plan")
            .order_by("-performed_at")[:200]
        )

        data = ProgressEntryTherapistSerializer(qs, many=True).data

        log_action(
            user=request.user,
            action=AuditAction.FAMILY_VIEW_PROGRESS,
            request=request,
            object_type="ProgressEntry",
            object_id=str(patient_id),
            extra={"count": len(data)},
        )

        return Response(data)