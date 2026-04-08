from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from accounts.permissions import IsAuthenticatedOTP
from audit.services import log_action
from audit.models import AuditAction
from accounts.permissions import IsTherapist
from .models import MediaResource
from .serializers import MediaResourceSerializer

class MediaResourceListCreateView(APIView):
    permission_classes = [IsAuthenticatedOTP]

    def get(self, request):
        qs = MediaResource.objects.select_related("exercise").all().order_by("exercise_id", "type")

        # Filtros
        exercise_id = request.GET.get("exercise")
        if exercise_id:
            qs = qs.filter(exercise_id=exercise_id)

        rtype = request.GET.get("type")
        if rtype:
            qs = qs.filter(type=rtype)

        difficulty = request.GET.get("difficulty")
        if difficulty:
            qs = qs.filter(difficulty=difficulty)

        return Response(MediaResourceSerializer(qs, many=True).data)

    def post(self, request):
        # Só terapeuta pode criar
        if not IsTherapist().has_permission(request, self):
            return Response({"detail": "Only therapists can create resources."}, status=status.HTTP_403_FORBIDDEN)

        ser = MediaResourceSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        obj = ser.save(created_by=request.user)
        log_action(
    user=request.user,
    action=AuditAction.MEDIA_CREATED,
    request=request,
    object_type="MediaResource",
    object_id=obj.id,
    extra={"exercise_id": obj.exercise_id, "type": obj.type},
)
        return Response(MediaResourceSerializer(obj).data, status=status.HTTP_201_CREATED)

class MediaResourceDetailView(APIView):
    permission_classes = [IsAuthenticatedOTP]

    def get(self, request, pk: int):
        obj = MediaResource.objects.select_related("exercise").get(pk=pk)
        return Response(MediaResourceSerializer(obj).data)