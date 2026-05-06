import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute() {
  const { isAuthed, loading } = useAuth();
  const loc = useLocation();

  if (loading) {
    return <div style={{ padding: 20 }}>A carregar...</div>;
  }

  if (!isAuthed) {
    return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  }

  return <Outlet />;
}