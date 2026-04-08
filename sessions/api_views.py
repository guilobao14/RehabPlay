from django.shortcuts import get_object_or_404

from accounts.permissions import IsAuthenticatedOTP
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status

from accounts.permissions import IsTherapist
from .models import Session
from .serializers import SessionSerializer

from notifications.services import notify
from notifications.models import NotificationType

from audit.services import log_action
from audit.models import AuditAction


class SessionListCreateView(APIView):
    permission_classes = [IsAuthenticatedOTP]

    def get(self, request):
        # terapeuta vê as suas sessões; paciente vê as suas sessões
        qs = Session.objects.all().order_by("starts_at")
        if hasattr(request.user, "profile") and request.user.profile.role == "THERAPIST":
            qs = qs.filter(therapist=request.user)
        elif hasattr(request.user, "profile") and request.user.profile.role == "PATIENT":
            qs = qs.filter(patient=request.user)
        else:
            qs = qs.none()

        return Response(SessionSerializer(qs, many=True).data)

    def post(self, request):
        if not IsTherapist().has_permission(request, self):
            return Response({"detail": "Only therapists can create sessions."}, status=status.HTTP_403_FORBIDDEN)

        ser = SessionSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        obj = ser.save(therapist=request.user)

        # NOTIFICA paciente
        notify(
            user=obj.patient,
            ntype=NotificationType.PLAN_UPDATED,  # se quiseres, criamos SESSION_SCHEDULED (melhor)
            title="Nova sessão agendada",
            body=f"Sessão agendada para {obj.starts_at:%d/%m %H:%M}",
            object_type="Session",
            object_id=obj.id,
        )

        # AUDIT
        log_action(
            user=request.user,
            action=AuditAction.SESSION_CREATED,
            request=request,
            object_type="Session",
            object_id=obj.id,
            extra={"patient_id": obj.patient_id, "starts_at": str(obj.starts_at)},
        )

        return Response(SessionSerializer(obj).data, status=status.HTTP_201_CREATED)


class SessionDetailView(APIView):
    permission_classes = [IsAuthenticatedOTP]

    def delete(self, request, session_id: int):
        obj = get_object_or_404(Session, id=session_id)

        # só terapeuta da sessão pode cancelar
        if not (hasattr(request.user, "profile") and request.user.profile.role == "THERAPIST" and obj.therapist_id == request.user.id):
            return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)

        # AUDIT
        log_action(
            user=request.user,
            action=AuditAction.SESSION_CANCELLED,
            request=request,
            object_type="Session",
            object_id=obj.id,
            extra={"patient_id": obj.patient_id},
        )

        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)