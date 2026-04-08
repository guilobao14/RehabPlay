from django.conf import settings
from django.db import models



class PointReason(models.TextChoices):
    PROGRESS_LOG = "PROGRESS_LOG", "Progress log"
    MESSAGE_SENT = "MESSAGE_SENT", "Message sent"
    PLAN_ADHERENCE = "PLAN_ADHERENCE", "Plan adherence"
    CHALLENGE_COMPLETE = "CHALLENGE_COMPLETE", "Challenge completed"


class UserGamificationStats(models.Model):
    """
    Cache para não termos de somar PointLog sempre.
    """
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    total_points = models.PositiveIntegerField(default=0)
    level = models.PositiveIntegerField(default=1)
    current_streak = models.PositiveIntegerField(default=0)
    best_streak = models.PositiveIntegerField(default=0)
    last_activity_date = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.username} - pts:{self.total_points} lvl:{self.level}"


class Badge(models.Model):
    code = models.CharField(max_length=40, unique=True)
    name = models.CharField(max_length=80)
    description = models.CharField(max_length=200, blank=True)

    def __str__(self):
        return f"{self.name} ({self.code})"


class UserBadge(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    badge = models.ForeignKey(Badge, on_delete=models.CASCADE)
    awarded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [("user", "badge")]


class BadgeRuleType(models.TextChoices):
    PROGRESS_COUNT = "PROGRESS_COUNT", "Progress count"
    POINTS_TOTAL = "POINTS_TOTAL", "Total points"
    STREAK = "STREAK", "Streak days"
    CHALLENGES_COMPLETED = "CHALLENGES_COMPLETED", "Challenges completed"


class BadgeRule(models.Model):
    """
    Permite definires badges por regras no admin, sem hardcode.
    """
    badge = models.OneToOneField(Badge, on_delete=models.CASCADE, related_name="rule")
    rule_type = models.CharField(max_length=32, choices=BadgeRuleType.choices)
    threshold = models.PositiveIntegerField()

    def __str__(self):
        return f"{self.badge.code}: {self.rule_type} >= {self.threshold}"


class ChallengeType(models.TextChoices):
    WEEKLY = "WEEKLY", "Weekly"
    MONTHLY = "MONTHLY", "Monthly"
    CUSTOM = "CUSTOM", "Custom"


class ChallengeGoalType(models.TextChoices):
    PROGRESS_COUNT = "PROGRESS_COUNT", "Progress count"
    MINUTES_TOTAL = "MINUTES_TOTAL", "Total minutes"
    STREAK = "STREAK", "Streak"


class Challenge(models.Model):
    code = models.CharField(max_length=40, unique=True)
    title = models.CharField(max_length=120)
    description = models.CharField(max_length=200, blank=True)

    challenge_type = models.CharField(max_length=16, choices=ChallengeType.choices, default=ChallengeType.CUSTOM)
    goal_type = models.CharField(max_length=32, choices=ChallengeGoalType.choices)
    goal_target = models.PositiveIntegerField()

    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField()

    reward_points = models.PositiveIntegerField(default=0)

    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.title} ({self.code})"


class UserChallenge(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    challenge = models.ForeignKey(Challenge, on_delete=models.CASCADE)
    progress_value = models.PositiveIntegerField(default=0)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = [("user", "challenge")]

    @property
    def is_completed(self):
        return self.completed_at is not None


class Reward(models.Model):
    """
    Recompensas para gastar pontos.
    """
    code = models.CharField(max_length=40, unique=True)
    title = models.CharField(max_length=120)
    description = models.CharField(max_length=200, blank=True)
    cost_points = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.title} ({self.cost_points} pts)"


class RewardRedemption(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    reward = models.ForeignKey(Reward, on_delete=models.CASCADE)
    redeemed_at = models.DateTimeField(auto_now_add=True)
    cost_points = models.PositiveIntegerField()

class PointLog(models.Model):
    patient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, db_index=True)
    points = models.PositiveIntegerField()
    reason = models.CharField(max_length=40, default="PROGRESS_LOG", db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)