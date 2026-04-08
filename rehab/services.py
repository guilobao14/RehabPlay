from django.core.exceptions import PermissionDenied
from .models import PlanExerciseItem, ProgressEntry, RehabPlan, MessageThread, Message
from gamification.services import award_points
from gamification.models import PointReason
from django.db import transaction
from audit.services import log_action
from audit.models import AuditAction

def create_progress_entry(
    *, user, plan_item_id: int, duration_minutes: int,
    perceived_difficulty: str, pain_level=None, comfort_level=None, notes=""
) -> ProgressEntry:
    plan_item = PlanExerciseItem.objects.select_related("plan").get(id=plan_item_id)

    # Só o próprio paciente do plano pode registar progresso
    if plan_item.plan.patient_id != user.id:
        raise PermissionDenied("Not allowed")

    entry = ProgressEntry.objects.create(
        patient=user,
        plan_item=plan_item,
        duration_minutes=duration_minutes,
        perceived_difficulty=perceived_difficulty,
        pain_level=pain_level,
        comfort_level=comfort_level,
        notes=notes or "",
    )

    log_action(
    user=user,
    action=AuditAction.PROGRESS_CREATED,
    request=None,
    object_type="ProgressEntry",
    object_id=entry.id,
    extra={"plan_item_id": plan_item_id, "duration_minutes": duration_minutes},
)

    # +10 pontos por registo
    award_points(user=user, points=10, reason=PointReason.PROGRESS_LOG)

    return entry

def user_can_access_thread(user, thread: MessageThread) -> bool:
    return user.id in (thread.patient_id, thread.therapist_id)

def ensure_thread_allowed_for_user(*, user, thread: MessageThread) -> None:
    if not user_can_access_thread(user, thread):
        raise PermissionDenied("Not allowed")

def list_threads_for_user(user):
    qs = MessageThread.objects.all()
    if hasattr(user, "profile") and user.profile.role == "THERAPIST":
        return qs.filter(therapist=user).order_by("-created_at")
    if hasattr(user, "profile") and user.profile.role == "PATIENT":
        return qs.filter(patient=user).order_by("-created_at")
    return qs.none()

def ensure_threads_exist_for_therapist(user):
    if not (hasattr(user, "profile") and user.profile.role == "THERAPIST"):
        return
    plans = RehabPlan.objects.filter(therapist=user, is_active=True).select_related("patient")
    for plan in plans:
        MessageThread.objects.get_or_create(patient=plan.patient, therapist=user)

@transaction.atomic
def send_message_in_thread(*, user, thread: MessageThread, body: str) -> Message:
    ensure_thread_allowed_for_user(user=user, thread=thread)
    return Message.objects.create(thread=thread, sender=user, body=body)
