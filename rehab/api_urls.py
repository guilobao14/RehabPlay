from django.urls import path
from . import api_views

urlpatterns = [
    path("plan/active/", api_views.ActivePlanView.as_view(), name="api_active_plan"),
    path("progress/", api_views.ProgressListCreateView.as_view(), name="api_progress"),
    path("threads/", api_views.ThreadListView.as_view(), name="api_threads"),
    path("threads/<int:thread_id>/messages/", api_views.ThreadMessageListCreateView.as_view(), name="api_thread_messages"),
    path("plans/", api_views.PlanListCreateView.as_view(), name="api_plans_list_create"),
    path("plans/<int:plan_id>/", api_views.PlanDetailView.as_view(), name="api_plan_detail"),
    path("plans/<int:plan_id>/items/", api_views.PlanItemListCreateView.as_view(), name="api_plan_items_list_create"),
    path("plan-items/<int:item_id>/", api_views.PlanItemDetailView.as_view(), name="api_plan_item_detail"),
    path("exercises/", api_views.ExerciseListCreateView.as_view(), name="api_exercises_list_create"),
    path("exercises/<int:exercise_id>/", api_views.ExerciseDetailView.as_view(), name="api_exercises_detail"),
    path("therapist/patients/<int:patient_id>/progress/", api_views.TherapistPatientProgressView.as_view(), name="api_therapist_patient_progress"),
]
