from rest_framework import serializers
from .models import FamilyLink


class FamilyLinkSerializer(serializers.ModelSerializer):
    patient_username = serializers.CharField(source="patient.username", read_only=True)
    family_username = serializers.CharField(source="family.username", read_only=True)
    patient_display_name = serializers.CharField(source="patient.profile.display_name", read_only=True)
    family_display_name = serializers.CharField(source="family.profile.display_name", read_only=True)

    class Meta:
        model = FamilyLink
        fields = [
            "id",
            "patient",
            "patient_username",
            "patient_display_name",
            "family",
            "family_username",
            "family_display_name",
            "status",
            "can_view_progress",
            "created_at",
            "responded_at",
            "created_by",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "responded_at",
            "created_by",
            "patient_username",
            "patient_display_name",
            "family_username",
            "family_display_name",
        ]