// src/api/client.js
const API_BASE = "http://localhost:8000";

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

function getCurrentLanguage() {
  return localStorage.getItem("rehabplay_language") || "pt-PT";
}

export async function apiFetch(path, { method = "GET", body, headers } = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;

  const opts = {
    method,
    credentials: "include",
    headers: {
      "Accept-Language": getCurrentLanguage(),
      ...(headers || {}),
    },
  };

  const hasBody = body !== undefined && body !== null;

  if (hasBody && body instanceof FormData) {
    opts.body = body;
  } else if (hasBody) {
    opts.headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  }

  const unsafe = ["POST", "PUT", "PATCH", "DELETE"].includes(
    method.toUpperCase()
  );

  if (unsafe) {
    const csrf = getCookie("csrftoken");
    if (csrf) opts.headers["X-CSRFToken"] = csrf;
  }

  const res = await fetch(url, opts);

  const contentType = res.headers.get("content-type") || "";

  let data = null;

  if (contentType.includes("application/json")) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;

    if (typeof data === "string") {
      msg = data || msg;
    } else if (data?.detail) {
      msg = Array.isArray(data.detail) ? data.detail.join(", ") : data.detail;
    } else if (data && typeof data === "object") {
      msg = Object.entries(data)
        .map(([key, value]) => {
          const text = Array.isArray(value) ? value.join(", ") : String(value);
          return `${key}: ${text}`;
        })
        .join(" | ");
    }

    throw new Error(msg);
  }

  return data;
}

export { API_BASE };