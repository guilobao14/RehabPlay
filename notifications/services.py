from .models import Notification

def notify(*, user, ntype, title, body="", object_type="", object_id=""):
    Notification.objects.create(
        user=user,
        type=ntype,
        title=title,
        body=body or "",
        object_type=object_type or "",
        object_id=str(object_id) if object_id else "",
    )