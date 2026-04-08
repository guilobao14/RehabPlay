from django.urls import path
from .api_views import MyReportView, TherapistPatientReportView

urlpatterns = [
    path("reports/me/", MyReportView.as_view(), name="api_reports_me"),
    path("reports/patients/<int:patient_id>/", TherapistPatientReportView.as_view(), name="api_reports_patient"),
]