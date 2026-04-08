from django.contrib import admin
from .models import Profile, AccountSettings, FamilyLink

admin.site.register(Profile)
admin.site.register(AccountSettings)
admin.site.register(FamilyLink)