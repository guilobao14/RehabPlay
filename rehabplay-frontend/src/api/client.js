// src/api/client.js
const API_BASE = "http://localhost:8000";

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

export async function apiFetch(path, { method = "GET", body, headers } = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;

  const opts = {
    method,
    credentials: "include", //  usa session cookie do Django
    headers: {
      ...(headers || {}),
    },
  };

  const hasBody = body !== undefined && body !== null;

  if (hasBody && body instanceof FormData) {
    opts.body = body; // browser define multipart boundary
  } else if (hasBody) {
    opts.headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  }

  // CSRF para métodos unsafe
  const unsafe = ["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase());
  if (unsafe) {
    const csrf = getCookie("csrftoken");
    if (csrf) opts.headers["X-CSRFToken"] = csrf;
  }

  const res = await fetch(url, opts);

  const contentType = res.headers.get("content-type") || "";
  let data = null;
  if (contentType.includes("application/json")) data = await res.json();
  else data = await res.text();

  if (!res.ok) {
    const msg = typeof data === "string" ? data : (data?.detail || `HTTP ${res.status}`);
    throw new Error(msg);
  }

  return data;
}

export { API_BASE };