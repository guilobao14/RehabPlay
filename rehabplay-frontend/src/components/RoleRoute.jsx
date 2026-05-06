import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RoleRoute({ allow = [] }) {
  const { role, isAuthed, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: 20 }}>A carregar...</div>;
  }

  if (!isAuthed) {
    return <Navigate to="/login" replace />;
  }

  if (!role) {
    return <Navigate to="/login" replace />;
  }

  if (!allow.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}