import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout({ children }) {
  const { role, profile, refresh } = useAuth();

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside style={{ width: 260, padding: 16, borderRight: "1px solid #333" }}>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontWeight: 700 }}>RehabPlay</div>
          <div style={{ opacity: 0.8, fontSize: 12 }}>
            {profile?.display_name} • {role}
          </div>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Link to="/">Dashboard</Link>
          <Link to="/notifications">Notificações</Link>
          <Link to="/messages">Mensagens</Link>
          <Link to="/me/profile">Perfil</Link>
          <Link to="/me/settings">Settings</Link>

          {role === "PATIENT" && (
            <>
              <hr />
              <Link to="/patient/plan">Plano ativo</Link>
              <Link to="/patient/progress">Progresso</Link>
              <Link to="/patient/library">Biblioteca</Link>
              <Link to="/patient/gamification">Gamificação</Link>
            </>
          )}

          {role === "THERAPIST" && (
            <>
              <hr />
              <Link to="/therapist/plans">Planos</Link>
              <Link to="/therapist/exercises">Exercícios</Link>
              <Link to="/therapist/library">Recursos</Link>
            </>
          )}

          {role === "FAMILY" && (
            <>
              <hr />
              <Link to="/family">Dashboard Familiar</Link>
              <Link to="/family/progress">Progresso (autorizado)</Link>
            </>
          )}
        </nav>

        <button onClick={refresh} style={{ marginTop: 16 }}>
          Recarregar sessão
        </button>
      </aside>

      <main style={{ flex: 1, padding: 20 }}>{children}</main>
    </div>
  );
}