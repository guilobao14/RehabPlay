from __future__ import annotations

from django.db import transaction
from django.db.models import Sum
from django.utils import timezone

from notifications.models import Notification, NotificationType
from notifications.services import notify

from gamification.models import (
    BadgeRule,
    Challenge,
    PointLog,
    PointReason,
    UserBadge,
    UserChallenge,
    UserGamificationStats,
)

from rehab.models import ProgressEntry


def points_to_level(total_points: int) -> int:
    """
    Curva simples:
    lvl 1: 0-49
    lvl 2: 50-149
    lvl 3: 150-299
    lvl 4: 300-499
    lvl 5+: 500+
    """
    if total_points < 50:
        return 1
    if total_points < 150:
        return 2
    if total_points < 300:
        return 3
    if total_points < 500:
        return 4

    return 5 + (total_points - 500) // 200


def _get_stats(user):
    stats, _ = UserGamificationStats.objects.get_or_create(user=user)
    return stats


@transaction.atomic
def award_points(
    *,
    user,
    points: int,
    reason: str,
    request=None,
    extra=None,
    skip_challenges: bool = False,
) -> None:
    """
    Motor principal:
    1. Grava PointLog
    2. Atualiza stats: total_points, level e streak
    3. Atribui badges
    4. Atualiza challenges, exceto quando skip_challenges=True
    """
    if points <= 0:
        return

    PointLog.objects.create(
        patient=user,
        points=points,
        reason=reason,
    )

    stats = _get_stats(user)
    stats.total_points += points
    stats.level = points_to_level(stats.total_points)

    today = timezone.localdate()

    if stats.last_activity_date is None:
        stats.current_streak = 1
    else:
        delta_days = (today - stats.last_activity_date).days

        if delta_days == 0:
            pass
        elif delta_days == 1:
            stats.current_streak += 1
        else:
            stats.current_streak = 1

    stats.best_streak = max(stats.best_streak, stats.current_streak)
    stats.last_activity_date = today
    stats.save()

    check_and_award_badges(user)

    if not skip_challenges:
        update_challenges_for_user(user)


def check_and_award_badges(user) -> None:
    """
    Atribui badges com base em BadgeRule.
    Também cria notificação quando a badge é desbloqueada pela primeira vez.
    """
    stats = _get_stats(user)

    progress_count = ProgressEntry.objects.filter(patient=user).count()

    challenges_completed = UserChallenge.objects.filter(
        user=user,
        completed_at__isnull=False,
    ).count()

    rules = BadgeRule.objects.select_related("badge").all()

    for rule in rules:
        ok = False

        if rule.rule_type == "PROGRESS_COUNT":
            ok = progress_count >= rule.threshold

        elif rule.rule_type == "POINTS_TOTAL":
            ok = stats.total_points >= rule.threshold

        elif rule.rule_type == "STREAK":
            ok = stats.best_streak >= rule.threshold

        elif rule.rule_type == "CHALLENGES_COMPLETED":
            ok = challenges_completed >= rule.threshold

        if ok:
            user_badge, created = UserBadge.objects.get_or_create(
                user=user,
                badge=rule.badge,
            )

            if created:
                notify(
                    user=user,
                    ntype=NotificationType.BADGE_UNLOCKED,
                    title="Nova badge desbloqueada",
                    body=f"Desbloqueaste a badge: {rule.badge.name}",
                    object_type="Badge",
                    object_id=rule.badge.id,
                )


def update_challenges_for_user(user) -> None:
    """
    Atualiza progress_value para desafios ativos e marca como concluídos.
    Quando conclui:
    - cria notificação uma única vez
    - atribui reward_points se existirem
    """
    now = timezone.now()

    active_challenges = Challenge.objects.filter(
        is_active=True,
        starts_at__lte=now,
        ends_at__gte=now,
    )

    stats = _get_stats(user)

    for challenge in active_challenges:
        user_challenge, _ = UserChallenge.objects.get_or_create(
            user=user,
            challenge=challenge,
        )

        if user_challenge.completed_at:
            continue

        if challenge.goal_type == "PROGRESS_COUNT":
            value = ProgressEntry.objects.filter(
                patient=user,
                performed_at__gte=challenge.starts_at,
                performed_at__lte=challenge.ends_at,
            ).count()

        elif challenge.goal_type == "MINUTES_TOTAL":
            value = int(
                ProgressEntry.objects.filter(
                    patient=user,
                    performed_at__gte=challenge.starts_at,
                    performed_at__lte=challenge.ends_at,
                ).aggregate(total=Sum("duration_minutes"))["total"]
                or 0
            )

        elif challenge.goal_type == "STREAK":
            value = stats.current_streak

        else:
            value = 0

        user_challenge.progress_value = value

        if value >= challenge.goal_target and not user_challenge.completed_at:
            user_challenge.completed_at = timezone.now()
            user_challenge.save()

            already_notified = Notification.objects.filter(
                user=user_challenge.user,
                type=NotificationType.CHALLENGE_COMPLETED,
                object_type="Challenge",
                object_id=str(challenge.id),
            ).exists()

            if not already_notified:
                notify(
                    user=user_challenge.user,
                    ntype=NotificationType.CHALLENGE_COMPLETED,
                    title="Desafio concluído",
                    body=f"Concluíste o desafio: {challenge.title}",
                    object_type="Challenge",
                    object_id=challenge.id,
                )

            if challenge.reward_points:
                award_points(
                    user=user,
                    points=challenge.reward_points,
                    reason=PointReason.CHALLENGE_COMPLETE,
                    skip_challenges=True,
                )
        else:
            user_challenge.save()