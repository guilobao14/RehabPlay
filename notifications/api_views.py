from django.shortcuts import get_object_or_404

from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from accounts.permissions import IsAuthenticatedOTP
from .models import Notification

class NotificationListView(APIView):
    permission_classes = [IsAuthenticatedOTP]

    def get(self, request):
        qs = Notification.objects.filter(user=request.user).order_by("-created_at")[:200]
        return Response([
            {
                "id": n.id,
                "type": n.type,
                "title": n.title,
                "body": n.body,
                "object_type": n.object_type,
                "object_id": n.object_id,
                "is_read": n.is_read,
                "created_at": n.created_at,
            }
            for n in qs
        ])

class NotificationMarkReadView(APIView):
    permission_classes = [IsAuthenticatedOTP]

    def post(self, request, notification_id: int):
        n = get_object_or_404(Notification, id=notification_id, user=request.user)
        n.is_read = True
        n.save(update_fields=["is_read"])
        return Response({"detail": "marked as read"}, status=status.HTTP_200_OK)