import { apiFetch } from "./client";

export async function fetchPlans() {
  return apiFetch("/api/plans/");
}

export async function fetchTherapistPatients() {
  return apiFetch("/api/therapist/patients/");
}

export async function fetchPlanDetail(planId) {
  return apiFetch(`/api/plans/${planId}/`);
}

export async function createPlan(body) {
  return apiFetch("/api/plans/", {
    method: "POST",
    body,
  });
}

export async function updatePlan(planId, body) {
  return apiFetch(`/api/plans/${planId}/`, {
    method: "PATCH",
    body,
  });
}

export async function deletePlan(planId) {
  return apiFetch(`/api/plans/${planId}/`, {
    method: "DELETE",
  });
}

export async function fetchPlanItems(planId) {
  return apiFetch(`/api/plans/${planId}/items/`);
}

export async function createPlanItem(planId, body) {
  return apiFetch(`/api/plans/${planId}/items/`, {
    method: "POST",
    body,
  });
}

export async function updatePlanItem(itemId, body) {
  return apiFetch(`/api/plan-items/${itemId}/`, {
    method: "PATCH",
    body,
  });
}

export async function deletePlanItem(itemId) {
  return apiFetch(`/api/plan-items/${itemId}/`, {
    method: "DELETE",
  });
}

export async function fetchExercises() {
  return apiFetch("/api/exercises/");
}

export async function fetchExerciseDetail(exerciseId) {
  return apiFetch(`/api/exercises/${exerciseId}/`);
}

export async function createExercise(body) {
  return apiFetch("/api/exercises/", {
    method: "POST",
    body,
  });
}

export async function updateExercise(exerciseId, body) {
  return apiFetch(`/api/exercises/${exerciseId}/`, {
    method: "PATCH",
    body,
  });
}

export async function deleteExercise(exerciseId) {
  return apiFetch(`/api/exercises/${exerciseId}/`, {
    method: "DELETE",
  });
}

export async function fetchTherapistPatientProgress(patientId) {
  return apiFetch(`/api/therapist/patients/${patientId}/progress/`);
}

export async function fetchTherapistPatientReport(patientId) {
  return apiFetch(`/api/reports/patients/${patientId}/`);
}

export async function addPlanItem(planId, body) {
  return apiFetch(`/api/plans/${planId}/items/`, {
    method: "POST",
    body,
  });
}

export async function fetchMediaResources() {
  return apiFetch("/api/library/");
}

export async function createMediaResource(body) {
  return apiFetch("/api/library/", {
    method: "POST",
    body,
  });
}

export async function updateMediaResource(id, body) {
  return apiFetch(`/api/library/${id}/`, {
    method: "PATCH",
    body,
  });
}

export async function deleteMediaResource(id) {
  return apiFetch(`/api/library/${id}/`, {
    method: "DELETE",
  });
}