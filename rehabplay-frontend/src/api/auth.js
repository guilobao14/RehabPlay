import { apiFetch } from "./client";

export async function fetchMyProfile() {
  return apiFetch("/api/me/profile/");
}

export async function updateMyProfile(body) {
  return apiFetch("/api/me/profile/", {
    method: "PATCH",
    body,
  });
}

export async function fetchMySettings() {
  return apiFetch("/api/me/settings/");
}

export async function updateMySettings(body) {
  return apiFetch("/api/me/settings/", {
    method: "PATCH",
    body,
  });
}

export async function logout() {
  try {
    return await apiFetch("/admin/logout/", { method: "POST" });
  } catch (error) {
    console.warn("Logout admin falhou:", error.message);
    return null;
  }
}