from django.conf import settings
from django.db import models

class SessionType(models.TextChoices):
    IN_PERSON = "IN_PERSON", "Presencial"
    ONLINE = "ONLINE", "Virtual"

class Session(models.Model):
    therapist = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="sessions_as_therapist")
    patient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="sessions_as_patient")

    session_type = models.CharField(max_length=16, choices=SessionType.choices)
    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField()

    location = models.CharField(max_length=200, blank=True)  # presencial
    meeting_url = models.URLField(blank=True)                # virtual
    notes = models.CharField(max_length=300, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.patient.username} with {self.therapist.username} @ {self.starts_at:%Y-%m-%d %H:%M}"