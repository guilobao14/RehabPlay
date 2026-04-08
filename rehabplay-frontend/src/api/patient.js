import { apiFetch } from "./client";

export async function fetchActivePlan() {
  return apiFetch("/api/plan/active/");
}

export async function fetchMyProgress() {
  return apiFetch("/api/progress/");
}

export async function fetchLibraryResources() {
  return apiFetch("/api/library/");
}

export async function fetchLibraryResourceDetail(id) {
  return apiFetch(`/api/library/${id}/`);
}

export async function fetchMyGamification() {
  return apiFetch("/api/me/gamification/");
}

export async function fetchLeaderboard() {
  return apiFetch("/api/leaderboard/");
}

export async function fetchChallenges() {
  return apiFetch("/api/challenges/");
}

export async function fetchRewards() {
  return apiFetch("/api/rewards/");
}

export async function redeemReward(rewardId) {
  return apiFetch(`/api/rewards/${rewardId}/redeem/`, {
    method: "POST",
  });
}

export async function fetchMyRedemptions() {
  return apiFetch("/api/me/redemptions/");
}

export async function fetchThreads() {
  return apiFetch("/api/threads/");
}

export async function fetchThreadMessages(threadId) {
  return apiFetch(`/api/threads/${threadId}/messages/`);
}

export async function sendThreadMessage(threadId, body) {
  return apiFetch(`/api/threads/${threadId}/messages/`, {
    method: "POST",
    body,
  });
}

export async function fetchMyReports() {
  return apiFetch("/api/reports/me/");
}

export async function fetchSessions() {
  return apiFetch("/api/sessions/");
}

export async function fetchSessionDetail(sessionId) {
  return apiFetch(`/api/sessions/${sessionId}/`);
}