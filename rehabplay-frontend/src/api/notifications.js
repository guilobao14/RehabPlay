import { apiFetch } from "./client";

export async function fetchNotifications() {
  return apiFetch("/api/notifications/");
}

export async function markNotificationAsRead(notificationId) {
  return apiFetch(`/api/notifications/${notificationId}/read/`, {
    method: "POST",
  });
}