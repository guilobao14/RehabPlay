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
    patient_username = serializers.CharField(source="patient.username", read_only=True)
    patient_display_name = serializers.CharField(source="patient.profile.display_name", read_only=True)

    class Meta:
        model = RehabPlan
        fields = [
            "id",
            "patient",
            "patient_username",
            "patient_display_name",
            "title",
            "is_active",
            "items",
        ]
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
    area = serializers.CharField()
    area_display = serializers.CharField(source="get_area_display", read_only=True)

    class Meta:
        model = Exercise
        fields = [
            "id",
            "name",
            "name_pt",
            "name_en",
            "area",
            "area_display",
            "description",
            "description_pt",
            "description_en",
        ]
        read_only_fields = ["id", "area_display"]

    def validate_area(self, value):
        normalized = str(value).strip().upper()

        area_map = {
            "CABEÇA": "HEAD",
            "CABECA": "HEAD",
            "HEAD": "HEAD",
            "FACE": "FACE",
            "PESCOÇO": "NECK",
            "PESCOCO": "NECK",
            "NECK": "NECK",
            "OMBRO": "SHOULDER",
            "OMBROS": "SHOULDER",
            "SHOULDER": "SHOULDER",
            "SHOULDERS": "SHOULDER",
            "BRAÇO": "ARM",
            "BRACO": "ARM",
            "BRAÇOS": "ARM",
            "BRACOS": "ARM",
            "ARM": "ARM",
            "ARMS": "ARM",
            "COTOVELO": "ELBOW",
            "COTOVELOS": "ELBOW",
            "ELBOW": "ELBOW",
            "ELBOWS": "ELBOW",
            "ANTEBRAÇO": "FOREARM",
            "ANTEBRACO": "FOREARM",
            "FOREARM": "FOREARM",
            "PULSO": "WRIST",
            "PULSOS": "WRIST",
            "WRIST": "WRIST",
            "MÃO": "HAND",
            "MAO": "HAND",
            "MÃOS": "HAND",
            "MAOS": "HAND",
            "HAND": "HAND",
            "HANDS": "HAND",
            "DEDOS": "FINGERS",
            "FINGERS": "FINGERS",
            "PEITO": "CHEST",
            "CHEST": "CHEST",
            "COSTAS": "BACK",
            "BACK": "BACK",
            "COSTAS SUPERIORES": "UPPER_BACK",
            "UPPER BACK": "UPPER_BACK",
            "LOMBAR": "LOWER_BACK",
            "LOWER BACK": "LOWER_BACK",
            "CORE": "CORE",
            "ABDÓMEN": "ABDOMEN",
            "ABDOMEN": "ABDOMEN",
            "ANCA": "HIP",
            "QUADRIL": "HIP",
            "HIP": "HIP",
            "GLÚTEOS": "GLUTES",
            "GLUTEOS": "GLUTES",
            "GLUTES": "GLUTES",
            "PERNA": "LEG",
            "PERNAS": "LEG",
            "LEG": "LEG",
            "LEGS": "LEG",
            "COXA": "THIGH",
            "COXAS": "THIGH",
            "THIGH": "THIGH",
            "POSTERIOR DA COXA": "HAMSTRINGS",
            "HAMSTRINGS": "HAMSTRINGS",
            "QUADRÍCEPS": "QUADRICEPS",
            "QUADRICEPS": "QUADRICEPS",
            "JOELHO": "KNEE",
            "JOELHOS": "KNEE",
            "KNEE": "KNEE",
            "KNEES": "KNEE",
            "GÉMEOS": "CALF",
            "GEMEOS": "CALF",
            "PANTURRILHA": "CALF",
            "PANTURRILHAS": "CALF",
            "CALF": "CALF",
            "CALVES": "CALF",
            "TORNOZELO": "ANKLE",
            "TORNOZELOS": "ANKLE",
            "ANKLE": "ANKLE",
            "ANKLES": "ANKLE",
            "PÉ": "FOOT",
            "PE": "FOOT",
            "PÉS": "FOOT",
            "PES": "FOOT",
            "FOOT": "FOOT",
            "FEET": "FOOT",
            "DEDOS DO PÉ": "TOES",
            "DEDOS DO PE": "TOES",
            "TOES": "TOES",
            "CORPO INTEIRO": "FULL_BODY",
            "FULL BODY": "FULL_BODY",
            "EQUILÍBRIO": "BALANCE",
            "EQUILIBRIO": "BALANCE",
            "BALANCE": "BALANCE",
            "MOBILIDADE": "MOBILITY",
            "MOBILITY": "MOBILITY",
        }

        mapped = area_map.get(normalized, normalized)

        valid_values = [
            choice[0]
            for choice in Exercise._meta.get_field("area").choices
        ]

        if mapped not in valid_values:
            raise serializers.ValidationError(
                f'"{value}" is not a valid body area.'
            )

        return mapped

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