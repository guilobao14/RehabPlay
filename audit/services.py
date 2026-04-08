from .models import AuditLog


def log_action(*, user, action, request=None, object_type="", object_id="", extra=None):
    ip = None
    ua = ""

    if request is not None:
        ip = request.META.get("REMOTE_ADDR")
        ua = (request.META.get("HTTP_USER_AGENT") or "")[:256]

    AuditLog.objects.create(
        user=user if getattr(user, "is_authenticated", False) else None,
        action=action,
        object_type=object_type or "",
        object_id=str(object_id) if object_id else "",
        ip_address=ip,
        user_agent=ua,
        extra=extra or {},
    )