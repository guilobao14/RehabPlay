from rest_framework import serializers
from .models import RehabPlan, PlanExerciseItem, ProgressEntry, MessageThread, Message
from django.contrib.auth import get_user_model
from .models import Exercise

class PlanExerciseItemSerializer(serializers.ModelSerializer):
    exercise_name = serializers.CharField(source="exercise.name", read_only=True)

    class Meta:
        model = PlanExerciseItem
        fields = ["id", "exercise", "exercise_name", "duration_minutes", "sets", "reps", "frequency_per_week"]

class RehabPlanSerializer(serializers.ModelSerializer):
    items = PlanExerciseItemSerializer(many=True, read_only=True)

    class Meta:
        model = RehabPlan
        fields = ["id", "title", "is_active", "items"]

class ProgressEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = ProgressEntry
        fields = ["id", "plan_item", "performed_at", "duration_minutes", "perceived_difficulty", "pain_level", "comfort_level", "notes"]
        read_only_fields = ["id", "performed_at"]

class MessageThreadSerializer(serializers.ModelSerializer):
    patient_username = serializers.CharField(source="patient.username", read_only=True)
    therapist_username = serializers.CharField(source="therapist.username", read_only=True)

    class Meta:
        model = MessageThread
        fields = ["id", "patient", "patient_username", "therapist", "therapist_username", "created_at"]
        read_only_fields = ["id", "created_at", "patient_username", "therapist_username"]

class MessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source="sender.username", read_only=True)

    class Meta:
        model = Message
        fields = ["id", "thread", "sender", "sender_username", "body", "created_at"]
        read_only_fields = ["id", "sender", "sender_username", "created_at", "thread"]

class SendMessageSerializer(serializers.Serializer):
    body = serializers.CharField(max_length=2000)


User = get_user_model()


class RehabPlanCreateSerializer(serializers.ModelSerializer):
    """
    Para o terapeuta criar um plano para um paciente.
    Envia: patient (id), title, is_active (opcional)
    """
    patient = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())

    class Meta:
        model = RehabPlan
        fields = ["id", "patient", "title", "is_active"]
        read_only_fields = ["id"]


class RehabPlanUpdateSerializer(serializers.ModelSerializer):
    """
    Para o terapeuta editar um plano (ex: título / ativo).
    """
    class Meta:
        model = RehabPlan
        fields = ["title", "is_active"]


class PlanExerciseItemCreateSerializer(serializers.ModelSerializer):
    """
    Para adicionar um exercício ao plano.
    Envia: exercise (id), duration_minutes, sets, reps, frequency_per_week
    """
    class Meta:
        model = PlanExerciseItem
        fields = ["id", "exercise", "duration_minutes", "sets", "reps", "frequency_per_week"]
        read_only_fields = ["id"]


class PlanExerciseItemUpdateSerializer(serializers.ModelSerializer):
    """
    Para editar um item do plano (sets/reps/duração/frequência).
    """
    class Meta:
        model = PlanExerciseItem
        fields = ["duration_minutes", "sets", "reps", "frequency_per_week"]


class ExerciseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exercise
        fields = ["id", "name", "area", "description"]
        read_only_fields = ["id"]


class ProgressEntryTherapistSerializer(serializers.ModelSerializer):
    patient_username = serializers.CharField(source="patient.username", read_only=True)
    exercise_name = serializers.CharField(source="plan_item.exercise.name", read_only=True)
    plan_id = serializers.IntegerField(source="plan_item.plan_id", read_only=True)

    class Meta:
        model = ProgressEntry
        fields = [
            "id",
            "patient", "patient_username",
            "plan_item", "plan_id",
            "exercise_name",
            "performed_at",
            "duration_minutes",
            "perceived_difficulty",
            "pain_level",
            "comfort_level",
            "notes",
        ]
        read_only_fields = fields