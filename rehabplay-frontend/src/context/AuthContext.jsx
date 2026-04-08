// src/context/AuthContext.jsx
import { createContext, useContext, useMemo, useState } from "react";
import { apiFetch } from "../api/client";

const AuthContext = createContext(null);

function normalizeRole(role) {
  if (!role) return null;
  // aceitamos FAMILY ou FAMILIAR (e outros sinónimos se aparecerem)
  if (role === "FAMILIAR") return "FAMILY";
  return role;
}

export function AuthProvider({ children }) {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(false);

  async function refreshMe() {
    setLoading(true);
    try {
      // tu já tens este endpoint no backend
      const data = await apiFetch("/api/me/profile/");
      const role = normalizeRole(data?.role);
      setMe({ ...data, role });
      return { ok: true, data: { ...data, role } };
    } catch (e) {
      setMe(null);
      return { ok: false, error: e?.message || "Not authenticated" };
    } finally {
      setLoading(false);
    }
  }

  function logoutLocal() {
    // só limpa frontend; o logout real do Django podes fazer depois
    setMe(null);
  }

  const value = useMemo(
    () => ({
      me,
      role: me?.role || null,
      isAuthed: !!me,
      loading,
      refreshMe,
      logoutLocal,
      setMe,
    }),
    [me, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}