from django.contrib import admin
from .models import (
    PointLog, UserGamificationStats,
    Badge, UserBadge, BadgeRule,
    Challenge, UserChallenge,
    Reward, RewardRedemption,
)

@admin.register(PointLog)
class PointLogAdmin(admin.ModelAdmin):
    list_display = ("patient", "points", "reason", "created_at")
    list_filter = ("reason", "created_at")
    search_fields = ("patient__username",)
    ordering = ("-created_at",)

@admin.register(UserGamificationStats)
class UserGamificationStatsAdmin(admin.ModelAdmin):
    list_display = ("user", "total_points", "level", "current_streak", "best_streak", "last_activity_date")
    search_fields = ("user__username",)

@admin.register(Badge)
class BadgeAdmin(admin.ModelAdmin):
    list_display = ("code", "name")
    search_fields = ("code", "name")

@admin.register(UserBadge)
class UserBadgeAdmin(admin.ModelAdmin):
    list_display = ("user", "badge", "awarded_at")
    list_filter = ("badge", "awarded_at")
    search_fields = ("user__username", "badge__code", "badge__name")
    ordering = ("-awarded_at",)

@admin.register(BadgeRule)
class BadgeRuleAdmin(admin.ModelAdmin):
    list_display = ("badge", "rule_type", "threshold")
    list_filter = ("rule_type",)
    search_fields = ("badge__code", "badge__name")

@admin.register(Challenge)
class ChallengeAdmin(admin.ModelAdmin):
    list_display = ("code", "title", "goal_type", "goal_target", "reward_points", "starts_at", "ends_at", "is_active")
    list_filter = ("goal_type", "challenge_type", "is_active")
    search_fields = ("code", "title")

@admin.register(UserChallenge)
class UserChallengeAdmin(admin.ModelAdmin):
    list_display = ("user", "challenge", "progress_value", "completed_at")
    list_filter = ("completed_at",)
    search_fields = ("user__username", "challenge__code", "challenge__title")

@admin.register(Reward)
class RewardAdmin(admin.ModelAdmin):
    list_display = ("code", "title", "cost_points", "is_active")
    list_filter = ("is_active",)
    search_fields = ("code", "title")

@admin.register(RewardRedemption)
class RewardRedemptionAdmin(admin.ModelAdmin):
    list_display = ("user", "reward", "cost_points", "redeemed_at")
    list_filter = ("redeemed_at",)
    search_fields = ("user__username", "reward__code", "reward__title")
    ordering = ("-redeemed_at",)