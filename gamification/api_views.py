from django.db.models import Sum
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.db import transaction
from datetime import timedelta
from accounts.permissions import IsAuthenticatedOTP
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from audit.services import log_action
from audit.models import AuditAction

from gamification.models import (
    PointLog,
    UserGamificationStats,
    UserBadge,
    Challenge,
    UserChallenge,
    Reward,
    RewardRedemption,
)



class MyGamificationSummaryView(APIView):
    """
    Dashboard do utilizador:
    - stats (points/level/streak)
    - badges
    - challenges (com progresso e se completou)
    - rewards redemptions (histórico)
    """
    permission_classes = [IsAuthenticatedOTP]

    def get(self, request):
        stats, _ = UserGamificationStats.objects.get_or_create(user=request.user)

        badges = (
            UserBadge.objects.filter(user=request.user)
            .select_related("badge")
            .order_by("-awarded_at")
        )

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
    """
    Leaderboard de pontos
    GET /api/leaderboard/?period=all|7d|30d
    """
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
    """
    Lista desafios ativos (e o estado do user nesse desafio).
    """
    permission_classes = [IsAuthenticatedOTP]

    def get(self, request):
        now = timezone.now()
        active = Challenge.objects.filter(is_active=True, starts_at__lte=now, ends_at__gte=now).order_by("ends_at")

        # map do user -> progress
        user_map = {
            uc.challenge_id: uc
            for uc in UserChallenge.objects.filter(user=request.user, challenge__in=active).select_related("challenge")
        }

        data = []
        for ch in active:
            uc = user_map.get(ch.id)
            data.append({
                "code": ch.code,
                "title": ch.title,
                "description": ch.description,
                "goal_type": ch.goal_type,
                "goal_target": ch.goal_target,
                "reward_points": ch.reward_points,
                "starts_at": ch.starts_at,
                "ends_at": ch.ends_at,
                "user_progress_value": uc.progress_value if uc else 0,
                "user_completed_at": uc.completed_at if uc else None,
            })

        return Response(data)


class RewardListView(APIView):
    permission_classes = [IsAuthenticatedOTP]

    def get(self, request):
        rewards = Reward.objects.filter(is_active=True).order_by("cost_points", "title")
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
            return Response({"detail": "Not enough points."}, status=status.HTTP_400_BAD_REQUEST)

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
    extra={"cost_points": reward.cost_points},
)

        return Response(
            {
                "detail": "Reward redeemed.",
                "reward": {
                    "id": reward.id,
                    "code": reward.code,
                    "title": reward.title,
                    "cost_points": reward.cost_points,
                },
                "new_total_points": stats.total_points,
                "redeemed_at": redemption.redeemed_at,
            },
            status=status.HTTP_201_CREATED,
        )


class MyRedemptionsView(APIView):
    permission_classes = [IsAuthenticatedOTP]

    def get(self, request):
        qs = RewardRedemption.objects.filter(user=request.user).select_related("reward").order_by("-redeemed_at")[:50]
        return Response([
            {
                "reward_code": rr.reward.code,
                "reward_title": rr.reward.title,
                "cost_points": rr.cost_points,
                "redeemed_at": rr.redeemed_at,
            }
            for rr in qs
        ])
