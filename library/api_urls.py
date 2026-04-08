from django.urls import path
from . import api_views

urlpatterns = [
    path("library/", api_views.MediaResourceListCreateView.as_view(), name="api_library_list_create"),
    path("library/<int:pk>/", api_views.MediaResourceDetailView.as_view(), name="api_library_detail"),
]