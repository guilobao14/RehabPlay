// src/pages/AppShell.jsx
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function LinkItem({ to, children }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        display: "block",
        padding: "10px 12px",
        borderRadius: 8,
        textDecoration: "none",
        color: isActive ? "#ffffff" : "#d9dce3",
        background: isActive ? "rgba(255,255,255,0.12)" : "transparent",
        fontWeight: isActive ? 700 : 500,
      })}
    >
      {children}
    </NavLink>
  );
}

export default function AppShell() {
  const { role, me } = useAuth();

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "240px 1fr",
        minHeight: "100vh",
        width: "100%",
        background: "#f3f3f3",
      }}
    >
      <aside
        style={{
          background: "#0f1115",
          color: "white",
          padding: 16,
          borderRight: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: 10 }}>RehabPlay</h3>

        <div style={{ opacity: 0.85, marginBottom: 16, lineHeight: 1.5 }}>
          {me?.display_name || me?.user || me?.username || "Utilizador"}
          <br />
          <small>Role: {role || "-"}</small>
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <LinkItem to="/app/dashboard">Dashboard</LinkItem>
          <LinkItem to="/app/messages">Mensagens</LinkItem>
          <LinkItem to="/app/notifications">Notificações</LinkItem>
          <LinkItem to="/app/profile">Perfil</LinkItem>
          <LinkItem to="/app/settings">Definições</LinkItem>
          <LinkItem to="/app/test">Test API</LinkItem>

          {role === "PATIENT" && (
            <>
              <hr style={{ opacity: 0.2, width: "100%" }} />
              <LinkItem to="/app/patient/plan">Meu Plano</LinkItem>
              <LinkItem to="/app/patient/progress">Meu Progresso</LinkItem>
              <LinkItem to="/app/patient/gamification">Gamificação</LinkItem>
              <LinkItem to="/app/patient/library">Biblioteca</LinkItem>
            </>
          )}

          {role === "THERAPIST" && (
            <>
              <hr style={{ opacity: 0.2, width: "100%" }} />
              <LinkItem to="/app/therapist/plans">Gerir Planos</LinkItem>
              <LinkItem to="/app/therapist/patients/progress">
                Progresso Pacientes
              </LinkItem>
              <LinkItem to="/app/therapist/exercises">CRUD Exercícios</LinkItem>
              <LinkItem to="/app/therapist/media">CRUD Recursos</LinkItem>
            </>
          )}

          {role === "FAMILY" && (
            <>
              <hr style={{ opacity: 0.2, width: "100%" }} />
              <LinkItem to="/app/family">Dashboard Familiar</LinkItem>
              <LinkItem to="/app/family/links">Ligações</LinkItem>
              <LinkItem to="/app/family/progress">Progresso</LinkItem>
            </>
          )}
        </div>
      </aside>

      <main
        style={{
          width: "100%",
          minHeight: "100vh",
          padding: 0,
          margin: 0,
          background: "#f3f3f3",
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}