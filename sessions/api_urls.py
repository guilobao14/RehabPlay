from django.urls import path
from .api_views import SessionListCreateView, SessionDetailView

urlpatterns = [
    path("sessions/", SessionListCreateView.as_view(), name="api_sessions"),
    path("sessions/<int:session_id>/", SessionDetailView.as_view(), name="api_sessions_detail"),
]