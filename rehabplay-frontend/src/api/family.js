import { apiFetch } from "./client";

export async function fetchFamilyLinks() {
  return apiFetch("/api/family/links/");
}

export async function createFamilyLink(body) {
  return apiFetch("/api/family/links/", {
    method: "POST",
    body,
  });
}

export async function deleteFamilyLink(linkId) {
  return apiFetch(`/api/family/links/${linkId}/`, {
    method: "DELETE",
  });
}

export async function fetchFamilyPatientProgress(patientId) {
  return apiFetch(`/api/family/patients/${patientId}/progress/`);
}

export async function fetchFamilyPatientThreads(patientId) {
  return apiFetch(`/api/family/patients/${patientId}/threads/`);
}

export async function fetchFamilyThreadMessages(threadId) {
  return apiFetch(`/api/family/threads/${threadId}/messages/`);
}

export async function sendFamilyThreadMessage(threadId, body) {
  return apiFetch(`/api/family/threads/${threadId}/messages/`, {
    method: "POST",
    body,
  });
}