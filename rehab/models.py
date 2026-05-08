from django.conf import settings
from django.db import models

class Area(models.TextChoices):
    HEAD = "HEAD", "Cabeça"
    FACE = "FACE", "Face"
    NECK = "NECK", "Pescoço"

    SHOULDER = "SHOULDER", "Ombro"
    ARM = "ARM", "Braço"
    UPPER_ARM = "UPPER_ARM", "Braço superior"
    ELBOW = "ELBOW", "Cotovelo"
    FOREARM = "FOREARM", "Antebraço"
    WRIST = "WRIST", "Pulso"
    HAND = "HAND", "Mão"
    FINGERS = "FINGERS", "Dedos"

    CHEST = "CHEST", "Peito"
    BACK = "BACK", "Costas"
    UPPER_BACK = "UPPER_BACK", "Costas superiores"
    LOWER_BACK = "LOWER_BACK", "Lombar"
    CORE = "CORE", "Core"
    ABDOMEN = "ABDOMEN", "Abdómen"

    HIP = "HIP", "Anca"
    GLUTES = "GLUTES", "Glúteos"
    LEG = "LEG", "Perna"
    THIGH = "THIGH", "Coxa"
    HAMSTRINGS = "HAMSTRINGS", "Posterior da coxa"
    QUADRICEPS = "QUADRICEPS", "Quadríceps"
    KNEE = "KNEE", "Joelho"
    CALF = "CALF", "Gémeos"
    ANKLE = "ANKLE", "Tornozelo"
    FOOT = "FOOT", "Pé"
    TOES = "TOES", "Dedos do pé"

    FULL_BODY = "FULL_BODY", "Corpo inteiro"
    BALANCE = "BALANCE", "Equilíbrio"
    MOBILITY = "MOBILITY", "Mobilidade geral"
    
class Difficulty(models.TextChoices):
    EASY = "EASY", "Fácil"
    MEDIUM = "MEDIUM", "Média"
    HARD = "HARD", "Difícil"

class Exercise(models.Model):
    name = models.CharField(max_length=140)
    name_pt = models.CharField(max_length=140, blank=True)
    name_en = models.CharField(max_length=140, blank=True)

    area = models.CharField(max_length=32, choices=Area.choices)

    description = models.TextField(blank=True)
    description_pt = models.TextField(blank=True)
    description_en = models.TextField(blank=True)

    def save(self, *args, **kwargs):
        

        area_translation_en = {
            "Ombro": "Shoulder",
            "Braço": "Arm",
            "Perna": "Leg",
            "Gémeos": "Calf",
            "Joelho": "Knee",
            "Costas": "Back",
            "Peito": "Chest",
            "Pescoço": "Neck",
            "Core": "Core",
            "Corpo Inteiro": "Full Body",
        }

        if not self.name_pt:
            self.name_pt = self.name

        if not self.name_en:
            self.name_en = self.name

            for pt, en in area_translation_en.items():
                self.name_en = self.name_en.replace(pt, en)

        if not self.description_pt:
            self.description_pt = self.description

        if not self.description_en:
            self.description_en = self.description

            for pt, en in area_translation_en.items():
                self.description_en = self.description_en.replace(pt, en)

        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

class RehabPlan(models.Model):
    patient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="rehab_plans")
    therapist = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="plans_created")
    title = models.CharField(max_length=160)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.title} - {self.patient.username}"

class PlanExerciseItem(models.Model):
    plan = models.ForeignKey(RehabPlan, on_delete=models.CASCADE, related_name="items")
    exercise = models.ForeignKey(Exercise, on_delete=models.PROTECT)
    duration_minutes = models.PositiveSmallIntegerField(blank=True, null=True)
    sets = models.PositiveSmallIntegerField(blank=True, null=True)
    reps = models.PositiveSmallIntegerField(blank=True, null=True)
    frequency_per_week = models.PositiveSmallIntegerField(default=1)

    def __str__(self):
       return f"{self.plan.title}: {self.exercise.name}"

class ProgressEntry(models.Model):
    patient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    plan_item = models.ForeignKey(PlanExerciseItem, on_delete=models.CASCADE, related_name="progress_entries")
    performed_at = models.DateTimeField(auto_now_add=True)
    duration_minutes = models.PositiveSmallIntegerField()
    perceived_difficulty = models.CharField(max_length=16, choices=Difficulty.choices)
    pain_level = models.PositiveSmallIntegerField(blank=True, null=True)
    comfort_level = models.PositiveSmallIntegerField(blank=True, null=True)
    notes = models.CharField(max_length=300, blank=True)

    def __str__(self):
       return f"{self.patient.username} - {self.plan_item.exercise.name} - {self.performed_at:%Y-%m-%d}" 
    
class MessageThread(models.Model):
    patient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="message_threads_as_patient",
    )
    therapist = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="message_threads_as_therapist",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [("patient", "therapist")]

    def __str__(self):
        return f"{self.patient.username} ↔ {self.therapist.username}"

class Message(models.Model):
    thread = models.ForeignKey(MessageThread, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="messages_sent")
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.sender.username}: {self.body[:30]}"
