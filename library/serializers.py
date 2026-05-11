from rest_framework import serializers
from .models import MediaResource


class MediaResourceSerializer(serializers.ModelSerializer):
    exercise_name = serializers.CharField(source="exercise.name", read_only=True)

    video_url = serializers.URLField(
        required=False,
        allow_blank=True,
        allow_null=True,
    )

    duration_minutes = serializers.IntegerField(
        required=False,
        allow_null=True,
        min_value=1,
    )

    class Meta:
        model = MediaResource
        fields = [
            "id",
            "exercise",
            "exercise_name",
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

    def validate(self, data):
        resource_type = data.get("type")

        if resource_type == "VIDEO":
            if not data.get("video_url"):
                raise serializers.ValidationError(
                    {"video_url": "This field is required for video resources."}
                )

        if resource_type == "TEXT":
            data["video_url"] = ""
            data["duration_minutes"] = None

        return data