from django.conf import settings
from django.db import models

class Role(models.TextChoices):
    PATIENT = "PATIENT", "Paciente"
    THERAPIST = "THERAPIST", "Terapeuta"
    FAMILY = "FAMILY", "Familiar"

class Profile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    role = models.CharField(max_length=16, choices=Role.choices)
    display_name = models.CharField(max_length=120)
    phone = models.CharField(max_length=32, blank=True)
    photo = models.ImageField(upload_to="profile_photos/", blank=True, null=True)
    
    def __str__(self):
        return f"{self.display_name} ({self.user.username})"

class AccountSettings(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    reminder_opt_in = models.BooleanField(default=True)
    theme = models.CharField(max_length=16, default="light")
    language = models.CharField(max_length=16, default="pt-PT")

class FamilyLink(models.Model):
    patient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="family_links_as_patient")
    family = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="family_links_as_family")

    can_view_progress = models.BooleanField(default=True)
    can_view_messages = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="family_links_created")

    class Meta:
        unique_together = [("patient", "family")]

    def __str__(self):
        return f"{self.family.username} ↔ {self.patient.username}"