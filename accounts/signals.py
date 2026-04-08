from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Profile, AccountSettings, Role

User = get_user_model()

@receiver(post_save, sender=User)
def create_profile_and_settings(sender, instance, created, **kwargs):
    if not created:
        return
    Profile.objects.create(user=instance, role=Role.PATIENT, display_name=instance.username)
    AccountSettings.objects.create(user=instance)