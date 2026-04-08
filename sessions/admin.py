from django.contrib import admin
from .models import Session

@admin.register(Session)
class SessionAdmin(admin.ModelAdmin):
    list_display = ("starts_at", "ends_at", "session_type", "patient", "therapist")
    list_filter = ("session_type", "starts_at")
    search_fields = ("patient__username", "therapist__username", "location", "meeting_url")
    ordering = ("-starts_at",)