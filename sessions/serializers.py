from rest_framework import serializers
from .models import Session

class SessionSerializer(serializers.ModelSerializer):
    patient_username = serializers.CharField(source="patient.username", read_only=True)
    therapist_username = serializers.CharField(source="therapist.username", read_only=True)

    class Meta:
        model = Session
        fields = [
            "id",
            "therapist", "therapist_username",
            "patient", "patient_username",
            "session_type",
            "starts_at", "ends_at",
            "location", "meeting_url",
            "notes",
            "created_at",
        ]
        read_only_fields = ["id", "created_at", "patient_username", "therapist_username"]