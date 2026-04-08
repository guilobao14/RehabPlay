from django.contrib import admin
from .models import Notification

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("created_at", "user", "type", "title", "is_read", "object_type", "object_id")
    list_filter = ("type", "is_read", "created_at")
    search_fields = ("user__username", "title", "body", "object_type", "object_id")
    ordering = ("-created_at",)