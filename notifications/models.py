from django.conf import settings
from django.db import models

class NotificationType(models.TextChoices):
    PLAN_ASSIGNED = "PLAN_ASSIGNED", "Plan assigned"
    PLAN_UPDATED = "PLAN_UPDATED", "Plan updated"
    NEW_MESSAGE = "NEW_MESSAGE", "New message"
    RESOURCE_ADDED = "RESOURCE_ADDED", "Resource added"
    SESSION_SCHEDULED = "SESSION_SCHEDULED", "Session scheduled"
    
class Notification(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications")
    type = models.CharField(max_length=32, choices=NotificationType.choices, db_index=True)
    title = models.CharField(max_length=120)
    body = models.CharField(max_length=300, blank=True)

    object_type = models.CharField(max_length=64, blank=True)
    object_id = models.CharField(max_length=64, blank=True)

    is_read = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    def __str__(self):
        return f"{self.user.username} - {self.type} - {'read' if self.is_read else 'unread'}"