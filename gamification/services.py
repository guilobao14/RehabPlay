from __future__ import annotations

from django.db import transaction
from django.db.models import Sum
from django.utils import timezone

from gamification.models import (
    PointLog,
    PointReason,
    UserGamificationStats,
    BadgeRule,
    UserBadge,
    Challenge,
    UserChallenge,
)

from rehab.models import ProgressEntry


def points_to_level(total_points: int) -> int:
    """
    Curva simples (ajustável).
    lvl 1: 0-49, lvl 2: 50-149, lvl 3: 150-299, etc.
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
    1) grava PointLog
    2) atualiza stats: total_points + level + streak
    3) atribui badges
    4) atualiza challenges (a não ser que skip_challenges=True)
    """
    if points <= 0:
        return

    # 1) log
    PointLog.objects.create(patient=user, points=points, reason=reason)

    # 2) stats (pontos + nível + streak)
    stats = _get_stats(user)
    stats.total_points += points
    stats.level = points_to_level(stats.total_points)

    # streak: conta no máximo 1x por dia
    today = timezone.localdate()
    if stats.last_activity_date is None:
        stats.current_streak = 1
    else:
        delta_days = (today - stats.last_activity_date).days
        if delta_days == 0:
            pass  # já contou hoje
        elif delta_days == 1:
            stats.current_streak += 1
        else:
            stats.current_streak = 1

    stats.best_streak = max(stats.best_streak, stats.current_streak)
    stats.last_activity_date = today
    stats.save()

    # 3) badges
    check_and_award_badges(user)

    # 4) challenges
    if not skip_challenges:
        update_challenges_for_user(user)


def check_and_award_badges(user) -> None:
    """
    Atribui badges com base em BadgeRule (configurável no admin).
    """
    stats = _get_stats(user)

    progress_count = ProgressEntry.objects.filter(patient=user).count()
    challenges_completed = UserChallenge.objects.filter(user=user, completed_at__isnull=False).count()

    for rule in BadgeRule.objects.select_related("badge").all():
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
            UserBadge.objects.get_or_create(user=user, badge=rule.badge)


def update_challenges_for_user(user) -> None:
    """
    Atualiza progress_value para desafios ativos e marca concluídos.
    Se concluir, dá reward_points.
    """
    now = timezone.now()
    active = Challenge.objects.filter(is_active=True, starts_at__lte=now, ends_at__gte=now)

    stats = _get_stats(user)

    for ch in active:
        uc, _ = UserChallenge.objects.get_or_create(user=user, challenge=ch)
        if uc.completed_at:
            continue

        if ch.goal_type == "PROGRESS_COUNT":
            value = ProgressEntry.objects.filter(
                patient=user, performed_at__gte=ch.starts_at, performed_at__lte=ch.ends_at
            ).count()

        elif ch.goal_type == "MINUTES_TOTAL":
            value = int(
                ProgressEntry.objects.filter(
                    patient=user, performed_at__gte=ch.starts_at, performed_at__lte=ch.ends_at
                ).aggregate(s=Sum("duration_minutes"))["s"] or 0
            )

        elif ch.goal_type == "STREAK":
            value = stats.current_streak

        else:
            value = 0

        uc.progress_value = value

        if value >= ch.goal_target:
            uc.completed_at = timezone.now()
            uc.save()

            # recompensa: pontos extra
            if ch.reward_points:
                award_points(
                    user=user,
                    points=ch.reward_points,
                    reason=PointReason.CHALLENGE_COMPLETE,
                    skip_challenges=True,  # evita re-entrar no update_challenges
                )
        else:
            uc.save()