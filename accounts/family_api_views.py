from django.shortcuts import get_object_or_404

from accounts.permissions import IsAuthenticatedOTP
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status

from accounts.models import FamilyLink
from accounts.family_serializers import FamilyLinkSerializer

from audit.services import log_action
from audit.models import AuditAction

from rehab.models import ProgressEntry, MessageThread
from rehab.serializers import (
    ProgressEntryTherapistSerializer,
    MessageThreadSerializer,
    MessageSerializer,
)

def _is_family(user) -> bool:
    return hasattr(user, "profile") and user.profile.role == "FAMILY"


def _can_manage_link(user, patient_id: int) -> bool:
    # paciente pode autorizar o próprio familiar
    if hasattr(user, "profile") and user.profile.role == "PATIENT" and user.id == patient_id:
        return True
    # terapeuta pode autorizar se tiver plano com o paciente
    if hasattr(user, "profile") and user.profile.role == "THERAPIST":
        from rehab.models import RehabPlan
        return RehabPlan.objects.filter(therapist=user, patient_id=patient_id).exists()
    return False


def _get_link_or_403(user, patient_id: int) -> FamilyLink:
    link = FamilyLink.objects.filter(patient_id=patient_id, family=user).first()
    if not link:
        return None
    return link


class FamilyLinkListCreateView(APIView):
    """
    Criar/gerir autorizações Familiar ↔ Paciente.
    - terapeuta pode criar para pacientes seus
    - paciente pode criar para si próprio
    """
    permission_classes = [IsAuthenticatedOTP]

    def get(self, request):
        # terapeuta/paciente: ver links associados (como patient)
        # familiar: ver links associados (como family)
        if hasattr(request.user, "profile") and request.user.profile.role == "FAMILY":
            qs = FamilyLink.objects.filter(family=request.user).select_related("patient", "family").order_by("-created_at")
        else:
            qs = FamilyLink.objects.filter(patient=request.user).select_related("patient", "family").order_by("-created_at")

        return Response(FamilyLinkSerializer(qs, many=True).data)

    def post(self, request):
        patient_id = request.data.get("patient")
        family_id = request.data.get("family")
        can_view_progress = bool(request.data.get("can_view_progress", True))
        can_view_messages = bool(request.data.get("can_view_messages", False))

        if not patient_id or not family_id:
            return Response({"detail": "patient and family are required."}, status=status.HTTP_400_BAD_REQUEST)

        if not _can_manage_link(request.user, int(patient_id)):
            return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)

        obj, created = FamilyLink.objects.get_or_create(
            patient_id=patient_id,
            family_id=family_id,
            defaults={
                "can_view_progress": can_view_progress,
                "can_view_messages": can_view_messages,
                "created_by": request.user,
            },
        )

        if not created:
            # atualizar permissões se já existia
            obj.can_view_progress = can_view_progress
            obj.can_view_messages = can_view_messages
            obj.created_by = request.user
            obj.save()

        # ✅ AUDIT
        log_action(
            user=request.user,
            action=AuditAction.FAMILY_LINK_CREATED,
            request=request,
            object_type="FamilyLink",
            object_id=obj.id,
            extra={"patient_id": obj.patient_id, "family_id": obj.family_id},
        )

        return Response(FamilyLinkSerializer(obj).data, status=status.HTTP_201_CREATED)


class FamilyLinkDeleteView(APIView):
    permission_classes = [IsAuthenticatedOTP]

    def delete(self, request, link_id: int):
        link = get_object_or_404(FamilyLink, id=link_id)

        # só o próprio paciente ou um terapeuta associado ao paciente pode revogar
        if not _can_manage_link(request.user, link.patient_id):
            return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)

        # ✅ AUDIT (antes de apagar)
        log_action(
            user=request.user,
            action=AuditAction.FAMILY_LINK_REVOKED,
            request=request,
            object_type="FamilyLink",
            object_id=link.id,
            extra={"patient_id": link.patient_id, "family_id": link.family_id},
        )

        link.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class FamilyPatientProgressView(APIView):
    """
    Familiar vê progresso do paciente, se autorizado.
    GET /api/family/patients/<patient_id>/progress/
    """
    permission_classes = [IsAuthenticatedOTP]

    def get(self, request, patient_id: int):
        if not _is_family(request.user):
            return Response({"detail": "Only family can access."}, status=status.HTTP_403_FORBIDDEN)

        link = _get_link_or_403(request.user, patient_id)
        if not link or not link.can_view_progress:
            return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)

        qs = (
            ProgressEntry.objects
            .filter(patient_id=patient_id)
            .select_related("patient", "plan_item__exercise", "plan_item__plan")
            .order_by("-performed_at")[:200]
        )

        data = ProgressEntryTherapistSerializer(qs, many=True).data

        # ✅ AUDIT
        log_action(
            user=request.user,
            action=AuditAction.FAMILY_VIEW_PROGRESS,
            request=request,
            object_type="ProgressEntry",
            object_id=str(patient_id),
            extra={"count": len(data)},
        )

        return Response(data)


class FamilyThreadsView(APIView):
    """
    Familiar vê threads do paciente (read-only), se autorizado.
    GET /api/family/patients/<patient_id>/threads/
    """
    permission_classes = [IsAuthenticatedOTP]

    def get(self, request, patient_id: int):
        if not _is_family(request.user):
            return Response({"detail": "Only family can access."}, status=status.HTTP_403_FORBIDDEN)

        link = _get_link_or_403(request.user, patient_id)
        if not link or not link.can_view_messages:
            return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)

        qs = MessageThread.objects.filter(patient_id=patient_id).select_related("patient", "therapist").order_by("-created_at")
        data = MessageThreadSerializer(qs, many=True).data

        # ✅ AUDIT
        log_action(
            user=request.user,
            action=AuditAction.FAMILY_VIEW_MESSAGES,
            request=request,
            object_type="MessageThread",
            object_id=str(patient_id),
            extra={"threads": len(data)},
        )

        return Response(data)


class FamilyThreadMessagesView(APIView):
    """
    Familiar vê mensagens de uma thread do paciente (read-only), se autorizado.
    GET /api/family/threads/<thread_id>/messages/
    """
    permission_classes = [IsAuthenticatedOTP]

    def get(self, request, thread_id: int):
        if not _is_family(request.user):
            return Response({"detail": "Only family can access."}, status=status.HTTP_403_FORBIDDEN)

        thread = get_object_or_404(MessageThread, id=thread_id)

        link = _get_link_or_403(request.user, thread.patient_id)
        if not link or not link.can_view_messages:
            return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)

        msgs = thread.messages.select_related("sender").all()
        return Response(MessageSerializer(msgs, many=True).data)