from django.conf import settings
from django.db import models
from rehab.models import Exercise

class ResourceType(models.TextChoices):
    VIDEO = "VIDEO", "Vídeo"
    TEXT = "TEXT", "Texto"

class Difficulty(models.TextChoices):
    EASY = "EASY", "Fácil"
    MEDIUM = "MEDIUM", "Média"
    HARD = "HARD", "Difícil"

class MediaResource(models.Model):
    exercise = models.ForeignKey(Exercise, on_delete=models.CASCADE, related_name="resources")
    type = models.CharField(max_length=16, choices=ResourceType.choices)

    title = models.CharField(max_length=160)
    description = models.TextField(blank=True)   # usado no TEXT (e pode complementar VIDEO)
    video_url = models.URLField(blank=True)      # usado no VIDEO

    difficulty = models.CharField(max_length=16, choices=Difficulty.choices, default=Difficulty.EASY)
    duration_minutes = models.PositiveSmallIntegerField(blank=True, null=True)

    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["exercise", "type"], name="uniq_resource_type_per_exercise"),
        ]

    def __str__(self):
        return f"{self.exercise.name} - {self.type}"