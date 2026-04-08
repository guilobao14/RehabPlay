from rest_framework import serializers
from .models import Profile, AccountSettings


class MyProfileSerializer(serializers.ModelSerializer):
     photo_url = serializers.SerializerMethodField()
     
     class Meta:
        model = Profile
        fields = ["role", "display_name", "phone", "photo", "photo_url"]
        read_only_fields = ["role", "photo_url"]

     def get_photo_url(self, obj):
        if obj.photo:
            request = self.context.get("request")
            url = obj.photo.url
            return request.build_absolute_uri(url) if request else url
        return None

class MyAccountSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = AccountSettings
        fields = ["reminder_opt_in", "theme", "language"]


class TherapistPatientOptionSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source="user.id", read_only=True)
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = Profile
        fields = ["user_id", "username", "display_name", "phone", "role"]