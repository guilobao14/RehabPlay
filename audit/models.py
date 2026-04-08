from django.conf import settings
from django.db import models


class AuditAction(models.TextChoices):
    PLAN_CREATED = "PLAN_CREATED", "Plan created"
    PLAN_UPDATED = "PLAN_UPDATED", "Plan updated"
    PLAN_ITEM_CREATED = "PLAN_ITEM_CREATED", "Plan item created"
    PLAN_ITEM_UPDATED = "PLAN_ITEM_UPDATED", "Plan item updated"
    PLAN_ITEM_DELETED = "PLAN_ITEM_DELETED", "Plan item deleted"
    PROGRESS_CREATED = "PROGRESS_CREATED", "Progress created"
    MESSAGE_SENT = "MESSAGE_SENT", "Message sent"
    MEDIA_CREATED = "MEDIA_CREATED", "Media created"
    REWARD_REDEEMED = "REWARD_REDEEMED", "Reward redeemed"
    EXERCISE_CREATED = "EXERCISE_CREATED", "Exercise created"
    EXERCISE_UPDATED = "EXERCISE_UPDATED", "Exercise updated"
    EXERCISE_DELETED = "EXERCISE_DELETED", "Exercise deleted"
    THERAPIST_VIEW_PROGRESS = "THERAPIST_VIEW_PROGRESS", "Therapist viewed patient progress"
    PROFILE_UPDATED = "PROFILE_UPDATED", "Profile updated"
    SETTINGS_UPDATED = "SETTINGS_UPDATED", "Settings updated"
    FAMILY_LINK_CREATED = "FAMILY_LINK_CREATED", "Family link created"
    FAMILY_LINK_REVOKED = "FAMILY_LINK_REVOKED", "Family link revoked"
    FAMILY_VIEW_PROGRESS = "FAMILY_VIEW_PROGRESS", "Family viewed patient progress"
    FAMILY_VIEW_MESSAGES = "FAMILY_VIEW_MESSAGES", "Family viewed patient messages"
    SESSION_CREATED = "SESSION_CREATED", "Session created"
    SESSION_CANCELLED = "SESSION_CANCELLED", "Session cancelled"
    REPORT_VIEWED = "REPORT_VIEWED", "Report viewed"
    
class AuditLog(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)

    action = models.CharField(max_length=64, choices=AuditAction.choices, db_index=True)

    object_type = models.CharField(max_length=64, blank=True, db_index=True)
    object_id = models.CharField(max_length=64, blank=True, db_index=True)

    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=256, blank=True)

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    extra = models.JSONField(default=dict, blank=True)

    def __str__(self):
        who = self.user.username if self.user else "anonymous"
        return f"{self.created_at:%Y-%m-%d %H:%M:%S} {who} {self.action}"