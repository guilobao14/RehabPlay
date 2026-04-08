from django.contrib import admin
from .models import MediaResource

@admin.register(MediaResource)
class MediaResourceAdmin(admin.ModelAdmin):
    list_display = ("exercise", "type", "title", "difficulty", "duration_minutes", "created_by", "created_at")
    list_filter = ("type", "difficulty")
    search_fields = ("title", "exercise__name")