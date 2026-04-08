from django.contrib import admin
from .models import Exercise, RehabPlan, PlanExerciseItem, ProgressEntry

admin.site.register(Exercise)
admin.site.register(RehabPlan)
admin.site.register(PlanExerciseItem)
admin.site.register(ProgressEntry)
