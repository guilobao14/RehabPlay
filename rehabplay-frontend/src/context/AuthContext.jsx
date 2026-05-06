import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api/client";

const AuthContext = createContext(null);

function normalizeRole(role) {
  if (!role) return null;
  if (role === "FAMILIAR") return "FAMILY";
  return role;
}

export function AuthProvider({ children }) {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);

  async function refreshMe() {
    setLoading(true);
    try {
      const data = await apiFetch("/api/me/profile/");
      const role = normalizeRole(data?.role);
      const normalized = { ...data, role };
      setMe(normalized);
      return { ok: true, data: normalized };
    } catch (e) {
      setMe(null);
      return { ok: false, error: e?.message || "Not authenticated" };
    } finally {
      setLoading(false);
    }
  }

  function logoutLocal() {
    setMe(null);
  }

  useEffect(() => {
    refreshMe();
  }, []);

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
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}