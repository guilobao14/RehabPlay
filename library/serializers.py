from rest_framework import serializers
from .models import MediaResource

class MediaResourceSerializer(serializers.ModelSerializer):
    exercise_name = serializers.CharField(source="exercise.name", read_only=True)

    class Meta:
        model = MediaResource
        fields = [
            "id",
            "exercise", "exercise_name",
            "type",
            "title",
            "description",
            "video_url",
            "difficulty",
            "duration_minutes",
            "created_by",
            "created_at",
        ]
        read_only_fields = ["id", "created_by", "created_at"]