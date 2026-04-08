from django.urls import path
from .api_views import NotificationListView, NotificationMarkReadView

urlpatterns = [
    path("notifications/", NotificationListView.as_view(), name="api_notifications"),
    path("notifications/<int:notification_id>/read/", NotificationMarkReadView.as_view(), name="api_notifications_read"),
]