import { apiFetch } from "./client";

export async function loginUser(body) {
  return apiFetch("/api/auth/login/", {
    method: "POST",
    body,
  });
}

export async function logout() {
  return apiFetch("/api/auth/logout/", {
    method: "POST",
  });
}

export async function fetchMe() {
  return apiFetch("/api/auth/me/");
}

export async function fetchMyProfile() {
  return apiFetch("/api/me/profile/");
}

export async function updateMyProfile(body) {
  return apiFetch("/api/me/profile/", {
    method: "PUT",
    body,
  });
}

export async function fetchMySettings() {
  return apiFetch("/api/me/settings/");
}

export async function updateMySettings(body) {
  return apiFetch("/api/me/settings/", {
    method: "PUT",
    body,
  });
} 

export async function registerUser(body) {
  return apiFetch("/api/auth/register/", {
    method: "POST",
    body,
  });
}
