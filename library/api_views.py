from django.contrib.auth import get_user_model

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsAuthenticatedOTP, IsTherapist
from audit.models import AuditAction
from audit.services import log_action
from notifications.models import NotificationType
from notifications.services import notify
from rehab.models import RehabPlan

from .models import MediaResource
from .serializers import MediaResourceSerializer

User = get_user_model()


class MediaResourceListCreateView(APIView):
    permission_classes = [IsAuthenticatedOTP]

    def get(self, request):
        qs = (
            MediaResource.objects
            .select_related("exercise")
            .all()
            .order_by("exercise_id", "type")
        )

        exercise_id = request.GET.get("exercise")
        if exercise_id:
            qs = qs.filter(exercise_id=exercise_id)

        rtype = request.GET.get("type")
        if rtype:
            qs = qs.filter(type=rtype)

        difficulty = request.GET.get("difficulty")
        if difficulty:
            qs = qs.filter(difficulty=difficulty)

        return Response(MediaResourceSerializer(qs, many=True).data)

    def post(self, request):
        if not IsTherapist().has_permission(request, self):
            return Response(
                {"detail": "Only therapists can create resources."},
                status=status.HTTP_403_FORBIDDEN,
            )

        ser = MediaResourceSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        obj = ser.save(created_by=request.user)

        patient_ids = (
            RehabPlan.objects
            .filter(
                therapist=request.user,
                items__exercise=obj.exercise,
            )
            .values_list("patient_id", flat=True)
            .distinct()
        )

        patients = User.objects.filter(id__in=patient_ids)

        for patient in patients:
            already_notified = patient.notifications.filter(
                type=NotificationType.RESOURCE_ADDED,
                object_type="MediaResource",
                object_id=str(obj.id),
            ).exists()

            if not already_notified:
                notify(
                    user=patient,
                    ntype=NotificationType.RESOURCE_ADDED,
                    title="Novo recurso adicionado",
                    body=f"Foi adicionado um novo recurso à biblioteca: {obj.title}",
                    object_type="MediaResource",
                    object_id=obj.id,
                )

        log_action(
            user=request.user,
            action=AuditAction.MEDIA_CREATED,
            request=request,
            object_type="MediaResource",
            object_id=obj.id,
            extra={
                "exercise_id": obj.exercise_id,
                "type": obj.type,
            },
        )

        return Response(
            MediaResourceSerializer(obj).data,
            status=status.HTTP_201_CREATED,
        )


class MediaResourceDetailView(APIView):
    permission_classes = [IsAuthenticatedOTP]

    def get(self, request, pk: int):
        obj = MediaResource.objects.select_related("exercise").get(pk=pk)
        return Response(MediaResourceSerializer(obj).data)

    def delete(self, request, pk: int):
        if not IsTherapist().has_permission(request, self):
            return Response(
                {"detail": "Only therapists can delete resources."},
                status=status.HTTP_403_FORBIDDEN,
            )

        obj = MediaResource.objects.select_related("exercise").get(pk=pk)

        log_action(
            user=request.user,
            action=AuditAction.MEDIA_CREATED,
            request=request,
            object_type="MediaResource",
            object_id=obj.id,
            extra={
                "exercise_id": obj.exercise_id,
                "type": obj.type,
                "title": obj.title,
                "deleted": True,
            },
        )

        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)