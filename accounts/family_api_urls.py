from django.urls import path
from .family_api_views import (
    FamilyLinkListCreateView,
    FamilyLinkDeleteView,
    FamilyPatientProgressView,
    FamilyThreadsView,
    FamilyThreadMessagesView,
)

urlpatterns = [
    path("family/links/", FamilyLinkListCreateView.as_view(), name="api_family_links"),
    path("family/links/<int:link_id>/", FamilyLinkDeleteView.as_view(), name="api_family_links_delete"),

    path("family/patients/<int:patient_id>/progress/", FamilyPatientProgressView.as_view(), name="api_family_patient_progress"),
    path("family/patients/<int:patient_id>/threads/", FamilyThreadsView.as_view(), name="api_family_patient_threads"),
    path("family/threads/<int:thread_id>/messages/", FamilyThreadMessagesView.as_view(), name="api_family_thread_messages"),
]