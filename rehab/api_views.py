from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import transaction

from accounts.permissions import IsPatient
from .models import RehabPlan, ProgressEntry
from .serializers import RehabPlanSerializer, ProgressEntrySerializer
from .services import create_progress_entry
from accounts.permissions import IsAuthenticatedOTP

from audit.services import log_action
from audit.models import AuditAction

from notifications.services import notify
from notifications.models import NotificationType

from .serializers import ProgressEntryTherapistSerializer

from .models import MessageThread
from .serializers import MessageThreadSerializer, MessageSerializer, SendMessageSerializer
from .services import list_threads_for_user, ensure_threads_exist_for_therapist, send_message_in_thread, ensure_thread_allowed_for_user

from .models import Exercise
from .serializers import ExerciseSerializer

from django.shortcuts import get_object_or_404
from accounts.permissions import IsTherapist
from .models import PlanExerciseItem
from .serializers import (
    PlanExerciseItemSerializer,
    RehabPlanCreateSerializer,
    RehabPlanUpdateSerializer,
    PlanExerciseItemCreateSerializer,
    PlanExerciseItemUpdateSerializer,
)


class ActivePlanView(APIView):
    permission_classes = [IsPatient]

    def get(self, request):
        plan = RehabPlan.objects.filter(patient=request.user, is_active=True).first()
        if not plan:
            return Response({"detail": "No active plan"}, status=status.HTTP_404_NOT_FOUND)
        return Response(RehabPlanSerializer(plan).data)

class ProgressListCreateView(APIView):
    permission_classes = [IsPatient]

    def get(self, request):
        qs = ProgressEntry.objects.filter(patient=request.user).order_by("-performed_at")[:200]
        return Response(ProgressEntrySerializer(qs, many=True).data)

    def post(self, request):
        ser = ProgressEntrySerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        entry = create_progress_entry(
            user=request.user,
            plan_item_id=ser.validated_data["plan_item"].id,
            duration_minutes=ser.validated_data["duration_minutes"],
            perceived_difficulty=ser.validated_data["perceived_difficulty"],
            pain_level=ser.validated_data.get("pain_level"),
            comfort_level=ser.validated_data.get("comfort_level"),
            notes=ser.validated_data.get("notes", ""),
        )
        return Response(ProgressEntrySerializer(entry).data, status=status.HTTP_201_CREATED)

class ThreadListView(APIView):
    permission_classes = [IsAuthenticatedOTP]

    def get(self, request):
        ensure_threads_exist_for_therapist(request.user)
        threads = list_threads_for_user(request.user).select_related("patient", "therapist")
        return Response(MessageThreadSerializer(threads, many=True).data)

class ThreadMessageListCreateView(APIView):
    permission_classes = [IsAuthenticatedOTP]

    def get(self, request, thread_id: int):
        thread = MessageThread.objects.select_related("patient", "therapist").get(id=thread_id)
        ensure_thread_allowed_for_user(user=request.user, thread=thread)
        msgs = thread.messages.select_related("sender").all()
        return Response(MessageSerializer(msgs, many=True).data)

    def post(self, request, thread_id: int):
        thread = MessageThread.objects.select_related("patient", "therapist").get(id=thread_id)
        ensure_thread_allowed_for_user(user=request.user, thread=thread)

        ser = SendMessageSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        msg = send_message_in_thread(user=request.user, thread=thread, body=ser.validated_data["body"])
        
        # notificar o outro participante
        other_user = thread.patient if request.user.id == thread.therapist_id else thread.therapist

        notify(
    user=other_user,
    ntype=NotificationType.NEW_MESSAGE,
    title="Nova mensagem",
    body=f"Mensagem de {request.user.username}",
    object_type="MessageThread",
    object_id=thread.id,
)
        
        log_action(
    user=request.user,
    action=AuditAction.MESSAGE_SENT,
    request=request,
    object_type="MessageThread",
    object_id=thread.id,
    extra={"message_id": msg.id},
)
        
        return Response(MessageSerializer(msg).data, status=status.HTTP_201_CREATED)

class PlanListCreateView(APIView):
    permission_classes = [IsAuthenticatedOTP]

    def get(self, request):
        # Therapist: vê planos que criou | Patient: vê os seus planos
        if hasattr(request.user, "profile") and request.user.profile.role == "THERAPIST":
            qs = RehabPlan.objects.filter(therapist=request.user).select_related("patient").order_by("-id")
        elif hasattr(request.user, "profile") and request.user.profile.role == "PATIENT":
            qs = RehabPlan.objects.filter(patient=request.user).select_related("therapist").order_by("-id")
        else:
            qs = RehabPlan.objects.none()
        return Response(RehabPlanSerializer(qs, many=True).data)

    @transaction.atomic
    def post(self, request):
        # só os terapeutas criam planos
        if not IsTherapist().has_permission(request, self):
            return Response({"detail": "Only therapists can create plans."}, status=status.HTTP_403_FORBIDDEN)

        ser = RehabPlanCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        patient = ser.validated_data["patient"]
        is_active = ser.validated_data.get("is_active", True)

        # se este plano vai ficar ativo, desativa os outros desse paciente
        if is_active:
            RehabPlan.objects.filter(patient=patient, is_active=True).update(is_active=False)

        plan = RehabPlan.objects.create(
            patient=patient,
            therapist=request.user,
            title=ser.validated_data["title"],
            is_active=is_active,
        )

        notify(
    user=plan.patient,
    ntype=NotificationType.PLAN_ASSIGNED,
    title="Novo plano atribuído",
    body=f"O terapeuta {request.user.username} atribuiu-te o plano: {plan.title}",
    object_type="RehabPlan",
    object_id=plan.id,
)

        log_action(
    user=request.user,
    action=AuditAction.PLAN_CREATED,
    request=request,
    object_type="RehabPlan",
    object_id=plan.id,
    extra={"patient_id": plan.patient_id},
)
        return Response(RehabPlanSerializer(plan).data, status=status.HTTP_201_CREATED)

class PlanDetailView(APIView):
    permission_classes = [IsAuthenticatedOTP]

    def get(self, request, plan_id: int):
        plan = get_object_or_404(RehabPlan.objects.prefetch_related("items"), id=plan_id)

        # acesso: patient dono, terapeuta dono
        if plan.patient_id != request.user.id and plan.therapist_id != request.user.id:
            return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)

        return Response(RehabPlanSerializer(plan).data)

    @transaction.atomic
    def patch(self, request, plan_id: int):
        plan = get_object_or_404(RehabPlan, id=plan_id)

        # só o terapeuta que criou o plano pode editar
        if plan.therapist_id != request.user.id:
            return Response({"detail": "Only the plan therapist can update it."}, status=status.HTTP_403_FORBIDDEN)

        ser = RehabPlanUpdateSerializer(plan, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)

        # se este PATCH está a ativar o plano, desativa os outros do paciente
        if ser.validated_data.get("is_active") is True:
            RehabPlan.objects.filter(patient=plan.patient, is_active=True).exclude(id=plan.id).update(is_active=False)

        ser.save()

        notify(
    user=plan.patient,
    ntype=NotificationType.PLAN_UPDATED,
    title="Plano atualizado",
    body="O teu plano foi atualizado pelo terapeuta.",
    object_type="RehabPlan",
    object_id=plan.id,
)
        
        log_action(
    user=request.user,
    action=AuditAction.PLAN_UPDATED,
    request=request,
    object_type="RehabPlan",
    object_id=plan.id,
    extra={"changed_fields": list(ser.validated_data.keys())},
)
        
        return Response(RehabPlanSerializer(plan).data)

class PlanItemListCreateView(APIView):
    permission_classes = [IsAuthenticatedOTP]

    def get(self, request, plan_id: int):
        plan = get_object_or_404(RehabPlan, id=plan_id)
        if plan.patient_id != request.user.id and plan.therapist_id != request.user.id:
            return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)

        items = PlanExerciseItem.objects.filter(plan=plan).select_related("exercise").order_by("id")
        return Response(PlanExerciseItemSerializer(items, many=True).data)

    def post(self, request, plan_id: int):
        plan = get_object_or_404(RehabPlan, id=plan_id)
        if plan.therapist_id != request.user.id:
            return Response({"detail": "Only the plan therapist can add items."}, status=status.HTTP_403_FORBIDDEN)

        ser = PlanExerciseItemCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        item = PlanExerciseItem.objects.create(plan=plan, **ser.validated_data)
        
        notify(
    user=plan.patient,
    ntype=NotificationType.PLAN_UPDATED,
    title="Plano atualizado",
    body=f"Foi adicionado um exercício ao teu plano: {item.exercise.name}",
    object_type="RehabPlan",
    object_id=plan.id,
)
        
        log_action(
    user=request.user,
    action=AuditAction.PLAN_ITEM_CREATED,
    request=request,
    object_type="PlanExerciseItem",
    object_id=item.id,
    extra={"plan_id": plan.id, "exercise_id": item.exercise_id},
)
       
        return Response(PlanExerciseItemSerializer(item).data, status=status.HTTP_201_CREATED)


class PlanItemDetailView(APIView):
    permission_classes = [IsAuthenticatedOTP]

    def patch(self, request, item_id: int):
        item = get_object_or_404(PlanExerciseItem.objects.select_related("plan"), id=item_id)
        if item.plan.therapist_id != request.user.id:
            return Response({"detail": "Only the plan therapist can update items."}, status=status.HTTP_403_FORBIDDEN)

        ser = PlanExerciseItemUpdateSerializer(item, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        
        log_action(
    user=request.user,
    action=AuditAction.PLAN_ITEM_UPDATED,
    request=request,
    object_type="PlanExerciseItem",
    object_id=item.id,
    extra={"changed_fields": list(ser.validated_data.keys())},
)
        
        return Response(PlanExerciseItemSerializer(item).data)

    def delete(self, request, item_id: int):
        item = get_object_or_404(PlanExerciseItem.objects.select_related("plan"), id=item_id)
        if item.plan.therapist_id != request.user.id:
            return Response({"detail": "Only the plan therapist can delete items."}, status=status.HTTP_403_FORBIDDEN)

        log_action(
    user=request.user,
    action=AuditAction.PLAN_ITEM_DELETED,
    request=request,
    object_type="PlanExerciseItem",
    object_id=item.id,
    extra={"plan_id": item.plan_id, "exercise_id": item.exercise_id},
)
        
        item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    

class ExerciseListCreateView(APIView):
    permission_classes = [IsAuthenticatedOTP]

    def get(self, request):
        # qualquer autenticado pode ver (para a app)
        qs = Exercise.objects.all().order_by("area", "name")

        area = request.GET.get("area")
        if area:
            qs = qs.filter(area=area)

        q = request.GET.get("q")
        if q:
            qs = qs.filter(name__icontains=q)

        return Response(ExerciseSerializer(qs, many=True).data)

    def post(self, request):
        # só terapeuta pode criar
        if not IsTherapist().has_permission(request, self):
            return Response({"detail": "Only therapists can create exercises."}, status=status.HTTP_403_FORBIDDEN)

        ser = ExerciseSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        obj = ser.save()

        # AUDIT
        log_action(
            user=request.user,
            action=AuditAction.EXERCISE_CREATED,
            request=request,
            object_type="Exercise",
            object_id=obj.id,
            extra={"area": obj.area, "name": obj.name},
        )

        return Response(ExerciseSerializer(obj).data, status=status.HTTP_201_CREATED)


class ExerciseDetailView(APIView):
    permission_classes = [IsAuthenticatedOTP]

    def get(self, request, exercise_id: int):
        obj = get_object_or_404(Exercise, id=exercise_id)
        return Response(ExerciseSerializer(obj).data)

    def patch(self, request, exercise_id: int):
        # só terapeuta edita
        if not IsTherapist().has_permission(request, self):
            return Response({"detail": "Only therapists can update exercises."}, status=status.HTTP_403_FORBIDDEN)

        obj = get_object_or_404(Exercise, id=exercise_id)
        ser = ExerciseSerializer(obj, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()

        # AUDIT
        log_action(
            user=request.user,
            action=AuditAction.EXERCISE_UPDATED,
            request=request,
            object_type="Exercise",
            object_id=obj.id,
            extra={"changed_fields": list(ser.validated_data.keys())},
        )

        return Response(ExerciseSerializer(obj).data)

    def delete(self, request, exercise_id: int):
        # só terapeuta remove
        if not IsTherapist().has_permission(request, self):
            return Response({"detail": "Only therapists can delete exercises."}, status=status.HTTP_403_FORBIDDEN)

        obj = get_object_or_404(Exercise, id=exercise_id)

        # AUDIT (antes de apagar)
        log_action(
            user=request.user,
            action=AuditAction.EXERCISE_DELETED,
            request=request,
            object_type="Exercise",
            object_id=obj.id,
            extra={"area": obj.area, "name": obj.name},
        )

        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

   
class TherapistPatientProgressView(APIView):
    """
    Terapeuta vê histórico detalhado do progresso de um paciente.
    Só pode ver pacientes que tenham (ou tenham tido) plano com ele.
    Filtros:
      - ?exercise=<id>
      - ?from=YYYY-MM-DD
      - ?to=YYYY-MM-DD
      - ?limit=200 (default 200, max 500)
    """
    permission_classes = [IsAuthenticatedOTP]

    def get(self, request, patient_id: int):
        if not IsTherapist().has_permission(request, self):
            return Response({"detail": "Only therapists can access this endpoint."}, status=status.HTTP_403_FORBIDDEN)

        # Só permite ver pacientes associados a este terapeuta por plano
        has_relationship = RehabPlan.objects.filter(therapist=request.user, patient_id=patient_id).exists()
        if not has_relationship:
            return Response({"detail": "Not allowed for this patient."}, status=status.HTTP_403_FORBIDDEN)

        qs = (
            ProgressEntry.objects
            .filter(patient_id=patient_id, plan_item__plan__therapist=request.user)
            .select_related("patient", "plan_item__exercise", "plan_item__plan")
            .order_by("-performed_at")
        )

        exercise_id = request.GET.get("exercise")
        if exercise_id:
            qs = qs.filter(plan_item__exercise_id=exercise_id)

        date_from = request.GET.get("from")
        if date_from:
            qs = qs.filter(performed_at__date__gte=date_from)

        date_to = request.GET.get("to")
        if date_to:
            qs = qs.filter(performed_at__date__lte=date_to)

        limit = request.GET.get("limit", "200")
        try:
            limit = min(max(int(limit), 1), 500)
        except ValueError:
            limit = 200

        data = ProgressEntryTherapistSerializer(qs[:limit], many=True).data

        # AUDIT
        log_action(
    user=request.user,
    action=AuditAction.THERAPIST_VIEW_PROGRESS,
    request=request,
    object_type="ProgressEntry",
    object_id=str(patient_id),
    extra={"count": len(data)},
)

        return Response(data)