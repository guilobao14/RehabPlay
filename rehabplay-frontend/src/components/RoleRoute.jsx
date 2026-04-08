// src/components/RoleRoute.jsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RoleRoute({ allow = [] }) {
  const { role } = useAuth();

  if (!role) return <Navigate to="/login" replace />;

  if (!allow.includes(role)) {
    // se tiver login mas role errado
    return <Navigate to="/app/dashboard" replace />;
  }

  return <Outlet />;
}