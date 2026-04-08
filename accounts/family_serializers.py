from rest_framework import serializers
from .models import FamilyLink

class FamilyLinkSerializer(serializers.ModelSerializer):
    patient_username = serializers.CharField(source="patient.username", read_only=True)
    family_username = serializers.CharField(source="family.username", read_only=True)

    class Meta:
        model = FamilyLink
        fields = [
            "id",
            "patient", "patient_username",
            "family", "family_username",
            "can_view_progress", "can_view_messages",
            "created_at", "created_by",
        ]
        read_only_fields = ["id", "created_at", "created_by", "patient_username", "family_username"]