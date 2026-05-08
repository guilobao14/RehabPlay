from django.urls import path
from .family_api_views import (
    FamilyLinkListCreateView,
    FamilyLinkDeleteView,
    FamilyLinkRespondView,
    FamilyPatientProgressView,
)

urlpatterns = [
    path("family/links/", FamilyLinkListCreateView.as_view(), name="api_family_links"),
    path("family/links/<int:link_id>/", FamilyLinkDeleteView.as_view(), name="api_family_links_delete"),
    path("family/links/<int:link_id>/respond/", FamilyLinkRespondView.as_view(), name="api_family_links_respond"),
    path("family/patients/<int:patient_id>/progress/", FamilyPatientProgressView.as_view(), name="api_family_patient_progress"),
]