from datetime import timedelta

from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Sum
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.text import slugify

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsAuthenticatedOTP
from audit.models import AuditAction
from audit.services import log_action

from gamification.models import (
    PointLog,
    UserGamificationStats,
    UserBadge,
    Badge,
    BadgeRule,
    BadgeRuleType,
    Challenge,
    ChallengeType,
    UserChallenge,
    Reward,
    RewardRedemption,
)

User = get_user_model()


DEFAULT_BADGES = [
    {
        "code": "FIRST_PROGRESS",
        "name": "Primeiro Registo",
        "description": "Regista o teu primeiro progresso.",
        "rule_type": BadgeRuleType.PROGRESS_COUNT,
        "threshold": 1,
    },
    {
        "code": "FIVE_PROGRESS",
        "name": "Primeiros 5 Registos",
        "description": "Regista progresso 5 vezes.",
        "rule_type": BadgeRuleType.PROGRESS_COUNT,
        "threshold": 5,
    },
    {
        "code": "TEN_PROGRESS",
        "name": "Rotina Inicial",
        "description": "Regista progresso 10 vezes.",
        "rule_type": BadgeRuleType.PROGRESS_COUNT,
        "threshold": 10,
    },
    {
        "code": "TWENTY_PROGRESS",
        "name": "Consistência Forte",
        "description": "Regista progresso 20 vezes.",
        "rule_type": BadgeRuleType.PROGRESS_COUNT,
        "threshold": 20,
    },
    {
        "code": "FIFTY_POINTS",
        "name": "50 Pontos",
        "description": "Atinge 50 pontos.",
        "rule_type": BadgeRuleType.POINTS_TOTAL,
        "threshold": 50,
    },
    {
        "code": "HUNDRED_POINTS",
        "name": "100 Pontos",
        "description": "Atinge 100 pontos.",
        "rule_type": BadgeRuleType.POINTS_TOTAL,
        "threshold": 100,
    },
    {
        "code": "TWO_HUNDRED_POINTS",
        "name": "200 Pontos",
        "description": "Atinge 200 pontos.",
        "rule_type": BadgeRuleType.POINTS_TOTAL,
        "threshold": 200,
    },
    {
        "code": "THREE_DAY_STREAK",
        "name": "Sequência de 3 Dias",
        "description": "Mantém uma sequência de 3 dias.",
        "rule_type": BadgeRuleType.STREAK,
        "threshold": 3,
    },
    {
        "code": "SEVEN_DAY_STREAK",
        "name": "Semana Consistente",
        "description": "Mantém uma sequência de 7 dias.",
        "rule_type": BadgeRuleType.STREAK,
        "threshold": 7,
    },
    {
        "code": "FIRST_CHALLENGE",
        "name": "Primeiro Desafio",
        "description": "Completa o teu primeiro desafio.",
        "rule_type": BadgeRuleType.CHALLENGES_COMPLETED,
        "threshold": 1,
    },
    {
        "code": "THREE_CHALLENGES",
        "name": "Especialista em Desafios",
        "description": "Completa 3 desafios.",
        "rule_type": BadgeRuleType.CHALLENGES_COMPLETED,
        "threshold": 3,
    },
]


def ensure_default_badges():
    for item in DEFAULT_BADGES:
        badge, _ = Badge.objects.get_or_create(
            code=item["code"],
            defaults={
                "name": item["name"],
                "description": item["description"],
            },
        )

        if badge.name != item["name"] or badge.description != item["description"]:
            badge.name = item["name"]
            badge.description = item["description"]
            badge.save()

        BadgeRule.objects.get_or_create(
            badge=badge,
            defaults={
                "rule_type": item["rule_type"],
                "threshold": item["threshold"],
            },
        )


def is_patient_user(user):
    role = getattr(user, "role", None)

    if role:
        return str(role).upper() == "PATIENT"

    profile = getattr(user, "profile", None)
    profile_role = getattr(profile, "role", None)

    if profile_role:
        return str(profile_role).upper() == "PATIENT"

    return False


def get_therapist_patients(therapist):
    return User.objects.filter(
        is_active=True,
        id__in=[
            user.id
            for user in User.objects.filter(is_active=True)
            if is_patient_user(user)
        ],
    )


def parse_bool(value):
    if isinstance(value, bool):
        return value

    if isinstance(value, str):
        return value.lower() in ["true", "1", "yes", "sim"]

    return bool(value)


def get_badge_progress(user, rule_type):
    stats, _ = UserGamificationStats.objects.get_or_create(user=user)

    if rule_type == BadgeRuleType.PROGRESS_COUNT:
        from rehab.models import ProgressEntry
        return ProgressEntry.objects.filter(patient=user).count()

    if rule_type == BadgeRuleType.POINTS_TOTAL:
        return stats.total_points

    if rule_type == BadgeRuleType.STREAK:
        return stats.best_streak

    if rule_type == BadgeRuleType.CHALLENGES_COMPLETED:
        return UserChallenge.objects.filter(
            user=user,
            completed_at__isnull=False,
        ).count()

    return 0


def award_available_badges(user):
    ensure_default_badges()

    earned_badge_ids = set(
        UserBadge.objects.filter(user=user).values_list("badge_id", flat=True)
    )

    rules = BadgeRule.objects.select_related("badge").all()

    for rule in rules:
        if rule.badge_id in earned_badge_ids:
            continue

        current_value = get_badge_progress(user, rule.rule_type)

        if current_value >= rule.threshold:
            UserBadge.objects.get_or_create(user=user, badge=rule.badge)


class MyGamificationSummaryView(APIView):
    permission_classes = [IsAuthenticatedOTP]

    def get(self, request):
        stats, _ = UserGamificationStats.objects.get_or_create(user=request.user)

        award_available_badges(request.user)

        badges = (
            UserBadge.objects.filter(user=request.user)
            .select_related("badge")
            .order_by("-awarded_at")
        )

        earned_codes = set(ub.badge.code for ub in badges)

        all_badges = []

        for badge in Badge.objects.all().select_related("rule").order_by("id"):
            rule = getattr(badge, "rule", None)

            current_value = 0
            threshold = 0
            rule_type = ""

            if rule:
                current_value = get_badge_progress(request.user, rule.rule_type)
                threshold = rule.threshold
                rule_type = rule.rule_type

            all_badges.append({
                "code": badge.code,
                "name": badge.name,
                "description": badge.description,
                "unlocked": badge.code in earned_codes,
                "current_value": current_value,
                "threshold": threshold,
                "rule_type": rule_type,
                "progress_percent": min(100, round((current_value / threshold) * 100)) if threshold else 0,
            })

        challenges = (
            UserChallenge.objects.filter(user=request.user)
            .select_related("challenge")
            .order_by("-id")
        )

        redemptions = (
            RewardRedemption.objects.filter(user=request.user)
            .select_related("reward")
            .order_by("-redeemed_at")[:20]
        )

        return Response({
            "user": request.user.username,
            "stats": {
                "total_points": stats.total_points,
                "level": stats.level,
                "current_streak": stats.current_streak,
                "best_streak": stats.best_streak,
                "last_activity_date": stats.last_activity_date,
            },
            "badges": [
                {
                    "code": ub.badge.code,
                    "name": ub.badge.name,
                    "description": ub.badge.description,
                    "awarded_at": ub.awarded_at,
                }
                for ub in badges
            ],
            "all_badges": all_badges,
            "challenges": [
                {
                    "code": uc.challenge.code,
                    "title": uc.challenge.title,
                    "description": uc.challenge.description,
                    "goal_type": uc.challenge.goal_type,
                    "goal_target": uc.challenge.goal_target,
                    "progress_value": uc.progress_value,
                    "reward_points": uc.challenge.reward_points,
                    "starts_at": uc.challenge.starts_at,
                    "ends_at": uc.challenge.ends_at,
                    "is_active": uc.challenge.is_active,
                    "completed_at": uc.completed_at,
                }
                for uc in challenges
            ],
            "redemptions": [
                {
                    "reward_code": rr.reward.code,
                    "reward_title": rr.reward.title,
                    "cost_points": rr.cost_points,
                    "redeemed_at": rr.redeemed_at,
                }
                for rr in redemptions
            ],
        })


class LeaderboardView(APIView):
    permission_classes = [IsAuthenticatedOTP]

    def get(self, request):
        period = request.GET.get("period", "all")
        qs = PointLog.objects.all()

        now = timezone.now()

        if period == "7d":
            qs = qs.filter(created_at__gte=now - timedelta(days=7))
        elif period == "30d":
            qs = qs.filter(created_at__gte=now - timedelta(days=30))

        rows = (
            qs.values("patient_id", "patient__username")
            .annotate(total=Sum("points"))
            .order_by("-total")[:10]
        )

        return Response(list(rows))


class ChallengeListView(APIView):
    permission_classes = [IsAuthenticatedOTP]

    def get(self, request):
        now = timezone.now()

        user_challenges = (
            UserChallenge.objects.filter(
                user=request.user,
                challenge__is_active=True,
                challenge__starts_at__lte=now,
                challenge__ends_at__gte=now,
            )
            .select_related("challenge")
            .order_by("challenge__ends_at")
        )

        data = []

        for uc in user_challenges:
            ch = uc.challenge

            data.append({
                "code": ch.code,
                "title": ch.title,
                "description": ch.description,
                "goal_type": ch.goal_type,
                "goal_target": ch.goal_target,
                "reward_points": ch.reward_points,
                "starts_at": ch.starts_at,
                "ends_at": ch.ends_at,
                "user_progress_value": uc.progress_value,
                "user_completed_at": uc.completed_at,
            })

        return Response(data)


class TherapistCreateChallengeView(APIView):
    permission_classes = [IsAuthenticatedOTP]

    @transaction.atomic
    def post(self, request):
        title = request.data.get("title")
        description = request.data.get("description", "")
        challenge_type = request.data.get("challenge_type", ChallengeType.CUSTOM)
        goal_type = request.data.get("goal_type")
        goal_target = request.data.get("goal_target")
        reward_points = request.data.get("reward_points", 0)
        starts_at = request.data.get("starts_at")
        ends_at = request.data.get("ends_at")

        assign_to_all = parse_bool(request.data.get("assign_to_all", False))
        selected_patients = request.data.get("selected_patients", [])

        if not title:
            return Response(
                {"detail": "Title is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not goal_type:
            return Response(
                {"detail": "Goal type is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not goal_target:
            return Response(
                {"detail": "Goal target is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not starts_at or not ends_at:
            return Response(
                {"detail": "Start and end dates are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        base_code = slugify(title).upper().replace("-", "_")[:30] or "CHALLENGE"
        code = base_code
        counter = 1

        while Challenge.objects.filter(code=code).exists():
            counter += 1
            code = f"{base_code}_{counter}"

        challenge = Challenge.objects.create(
            code=code,
            title=title,
            description=description,
            challenge_type=challenge_type,
            goal_type=goal_type,
            goal_target=int(goal_target),
            starts_at=starts_at,
            ends_at=ends_at,
            reward_points=int(reward_points or 0),
            is_active=True,
            created_by=request.user,
        )

        patients_qs = get_therapist_patients(request.user)

        if not assign_to_all:
            patients_qs = patients_qs.filter(id__in=selected_patients)

        created_assignments = []

        for patient in patients_qs:
            user_challenge, created = UserChallenge.objects.get_or_create(
                user=patient,
                challenge=challenge,
                defaults={"progress_value": 0},
            )

            if created:
                created_assignments.append(user_challenge)

        return Response(
            {
                "id": challenge.id,
                "code": challenge.code,
                "title": challenge.title,
                "description": challenge.description,
                "challenge_type": challenge.challenge_type,
                "goal_type": challenge.goal_type,
                "goal_target": challenge.goal_target,
                "reward_points": challenge.reward_points,
                "starts_at": challenge.starts_at,
                "ends_at": challenge.ends_at,
                "is_active": challenge.is_active,
                "assigned_count": len(created_assignments),
            },
            status=status.HTTP_201_CREATED,
        )


class RewardListView(APIView):
    permission_classes = [IsAuthenticatedOTP]

    def get(self, request):
        rewards = Reward.objects.filter(is_active=True).order_by(
            "cost_points",
            "title",
        )

        return Response([
            {
                "id": r.id,
                "code": r.code,
                "title": r.title,
                "description": r.description,
                "cost_points": r.cost_points,
            }
            for r in rewards
        ])


class RedeemRewardView(APIView):
    permission_classes = [IsAuthenticatedOTP]

    @transaction.atomic
    def post(self, request, reward_id: int):
        reward = get_object_or_404(Reward, id=reward_id, is_active=True)
        stats, _ = UserGamificationStats.objects.get_or_create(user=request.user)

        if stats.total_points < reward.cost_points:
            return Response(
                {"detail": "Not enough points."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        stats.total_points -= reward.cost_points
        stats.save()

        redemption = RewardRedemption.objects.create(
            user=request.user,
            reward=reward,
            cost_points=reward.cost_points,
        )

        log_action(
            user=request.user,
            action=AuditAction.REWARD_REDEEMED,
            request=request,
            object_type="Reward",
            object_id=reward.id,
            extra={
                "reward_code": reward.code,
                "cost_points": reward.cost_points,
                "new_total_points": stats.total_points,
            },
        )

        return Response(
            {
                "detail": "Reward redeemed successfully.",
                "new_total_points": stats.total_points,
                "redeemed_at": redemption.redeemed_at,
                "reward": {
                    "id": reward.id,
                    "code": reward.code,
                    "title": reward.title,
                    "description": reward.description,
                    "cost_points": reward.cost_points,
                },
            },
            status=status.HTTP_201_CREATED,
        )