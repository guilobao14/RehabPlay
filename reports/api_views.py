from datetime import timedelta
from django.db.models import Avg, Sum, Count
from django.db.models.functions import TruncDate, TruncWeek
from django.utils import timezone
from django.shortcuts import get_object_or_404

from accounts.permissions import IsAuthenticatedOTP
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status

from accounts.permissions import IsTherapist, IsPatient
from rehab.models import ProgressEntry, RehabPlan
from gamification.models import UserGamificationStats, PointLog
from audit.services import log_action
from audit.models import AuditAction

# sessions é opcional (se não quiseres, apaga o try)
try:
    from sessions.models import Session
except Exception:
    Session = None


def _patient_report(patient_user):
    now = timezone.now()

    # últimos 14 dias: minutos por dia
    since_14d = now - timedelta(days=14)
    minutes_by_day = (
        ProgressEntry.objects
        .filter(patient=patient_user, performed_at__gte=since_14d)
        .annotate(day=TruncDate("performed_at"))
        .values("day")
        .annotate(total_minutes=Sum("duration_minutes"), count=Count("id"))
        .order_by("day")
    )

    # últimas 8 semanas: contagem por semana
    since_8w = now - timedelta(weeks=8)
    progress_by_week = (
        ProgressEntry.objects
        .filter(patient=patient_user, performed_at__gte=since_8w)
        .annotate(week=TruncWeek("performed_at"))
        .values("week")
        .annotate(count=Count("id"), total_minutes=Sum("duration_minutes"))
        .order_by("week")
    )

    # últimos 30 dias: médias dor/conforto
    since_30d = now - timedelta(days=30)
    pain_avg = ProgressEntry.objects.filter(patient=patient_user, performed_at__gte=since_30d).aggregate(v=Avg("pain_level"))["v"]
    comfort_avg = ProgressEntry.objects.filter(patient=patient_user, performed_at__gte=since_30d).aggregate(v=Avg("comfort_level"))["v"]

    # top exercícios (últimos 60 dias)
    since_60d = now - timedelta(days=60)
    top_exercises = (
        ProgressEntry.objects
        .filter(patient=patient_user, performed_at__gte=since_60d)
        .values("plan_item__exercise_id", "plan_item__exercise__name")
        .annotate(count=Count("id"), total_minutes=Sum("duration_minutes"))
        .order_by("-count")[:10]
    )

    # gamification stats (se existir)
    stats, _ = UserGamificationStats.objects.get_or_create(user=patient_user)

    # pontos nos últimos 30 dias
    points_30d = (
        PointLog.objects
        .filter(patient=patient_user, created_at__gte=since_30d)
        .aggregate(s=Sum("points"))["s"] or 0
    )

    # sessões (opcional)
    sessions_upcoming = []
    sessions_count_30d = 0
    if Session is not None:
        sessions_count_30d = Session.objects.filter(patient=patient_user, starts_at__gte=since_30d).count()
        sessions_upcoming = list(
            Session.objects.filter(patient=patient_user, starts_at__gte=now)
            .order_by("starts_at")
            .values("id", "session_type", "starts_at", "ends_at", "location", "meeting_url")[:10]
        )

    return {
        "patient": patient_user.username,
        "generated_at": now,
        "minutes_by_day_14d": list(minutes_by_day),
        "progress_by_week_8w": list(progress_by_week),
        "pain_avg_30d": pain_avg,
        "comfort_avg_30d": comfort_avg,
        "top_exercises_60d": list(top_exercises),
        "gamification": {
            "total_points": stats.total_points,
            "level": stats.level,
            "current_streak": stats.current_streak,
            "best_streak": stats.best_streak,
            "points_30d": points_30d,
        },
        "sessions": {
            "count_30d": sessions_count_30d,
            "upcoming": sessions_upcoming,
        },
    }


class MyReportView(APIView):
    permission_classes = [IsAuthenticatedOTP]

    def get(self, request):
        if not IsPatient().has_permission(request, self):
            return Response({"detail": "Only patients can access."}, status=status.HTTP_403_FORBIDDEN)

        data = _patient_report(request.user)

        # ✅ AUDIT
        log_action(
            user=request.user,
            action=AuditAction.REPORT_VIEWED,
            request=request,
            object_type="Report",
            object_id=str(request.user.id),
            extra={"scope": "me"},
        )

        return Response(data)


class TherapistPatientReportView(APIView):
    permission_classes = [IsAuthenticatedOTP]

    def get(self, request, patient_id: int):
        if not IsTherapist().has_permission(request, self):
            return Response({"detail": "Only therapists can access."}, status=status.HTTP_403_FORBIDDEN)

        # só pacientes que tenham plano com este terapeuta
        if not RehabPlan.objects.filter(therapist=request.user, patient_id=patient_id).exists():
            return Response({"detail": "Not allowed for this patient."}, status=status.HTTP_403_FORBIDDEN)

        from django.contrib.auth import get_user_model
        User = get_user_model()
        patient_user = get_object_or_404(User, id=patient_id)

        data = _patient_report(patient_user)

        # ✅ AUDIT
        log_action(
            user=request.user,
            action=AuditAction.REPORT_VIEWED,
            request=request,
            object_type="Report",
            object_id=str(patient_id),
            extra={"scope": "therapist_patient"},
        )

        return Response(data)