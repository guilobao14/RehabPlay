import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import MessagesPage from "./pages/MessagesPage";
import NotificationsPage from "./pages/NotificationsPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import TestApi from "./pages/TestApi";

import MyPlanPage from "./pages/patient/MyPlanPage";
import ProgressPage from "./pages/patient/ProgressPage";
import LibraryPage from "./pages/patient/LibraryPage";
import GamificationPage from "./pages/patient/GamificationPage";

import ExerciseCrudPage from "./pages/therapist/ExerciseCrudPage";
import MediaCrudPage from "./pages/therapist/MediaCrudPage";
import PlanManagementPage from "./pages/therapist/PlanManagementPage";
import TherapistPatientProgressPage from "./pages/therapist/TherapistPatientProgressPage";

import FamilyDashboardPage from "./pages/family/FamilyDashboardPage";
import FamilyLinksPage from "./pages/family/FamilyLinksPage";
import FamilyProgressPage from "./pages/family/FamilyProgressPage";

function Nav() {
  const linkStyle = ({ isActive }) => ({
    marginRight: 12,
    textDecoration: "none",
    color: isActive ? "white" : "#aab",
    fontWeight: isActive ? 700 : 500,
  });

  return (
    <div
      style={{
        padding: 12,
        borderBottom: "1px solid #333",
        display: "flex",
        flexWrap: "wrap",
        gap: 6,
        background: "#0f1115",
      }}
    >
      <NavLink style={linkStyle} to="/">
        Home
      </NavLink>
      <NavLink style={linkStyle} to="/login">
        Login
      </NavLink>
      <NavLink style={linkStyle} to="/dashboard">
        Dashboard
      </NavLink>
      <NavLink style={linkStyle} to="/messages">
        Mensagens
      </NavLink>
      <NavLink style={linkStyle} to="/notifications">
        Notificações
      </NavLink>
      <NavLink style={linkStyle} to="/profile">
        Perfil
      </NavLink>
      <NavLink style={linkStyle} to="/settings">
        Definições
      </NavLink>
      <NavLink style={linkStyle} to="/test">
        Test API
      </NavLink>

      <span style={{ margin: "0 6px", opacity: 0.4, color: "#aab" }}>|</span>

      <NavLink style={linkStyle} to="/patient/plan">
        Paciente
      </NavLink>
      <NavLink style={linkStyle} to="/therapist/plans">
        Terapeuta
      </NavLink>
      <NavLink style={linkStyle} to="/family">
        Familiar
      </NavLink>
    </div>
  );
}

function PageShell({ children }) {
  return (
    <div style={{ minHeight: "100vh", background: "#0f1115", color: "white" }}>
      <Nav />
      <div style={{ width: "100%", margin: 0, padding: 0 }}>{children}</div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* páginas livres, sem shell */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* páginas com shell */}
        <Route
          path="/dashboard"
          element={
            <PageShell>
              <DashboardPage />
            </PageShell>
          }
        />
        <Route
          path="/messages"
          element={
            <PageShell>
              <MessagesPage />
            </PageShell>
          }
        />
        <Route
          path="/notifications"
          element={
            <PageShell>
              <NotificationsPage />
            </PageShell>
          }
        />
        <Route
          path="/profile"
          element={
            <PageShell>
              <ProfilePage />
            </PageShell>
          }
        />
        <Route
          path="/settings"
          element={
            <PageShell>
              <SettingsPage />
            </PageShell>
          }
        />
        <Route
          path="/test"
          element={
            <PageShell>
              <TestApi />
            </PageShell>
          }
        />

        {/* PATIENT */}
        <Route
          path="/patient/plan"
          element={
            <PageShell>
              <MyPlanPage />
            </PageShell>
          }
        />
        <Route
          path="/patient/progress"
          element={
            <PageShell>
              <ProgressPage />
            </PageShell>
          }
        />
        <Route
          path="/patient/library"
          element={
            <PageShell>
              <LibraryPage />
            </PageShell>
          }
        />
        <Route
          path="/patient/gamification"
          element={
            <PageShell>
              <GamificationPage />
            </PageShell>
          }
        />

        {/* THERAPIST */}
        <Route
          path="/therapist/exercises"
          element={
            <PageShell>
              <ExerciseCrudPage />
            </PageShell>
          }
        />
        <Route
          path="/therapist/media"
          element={
            <PageShell>
              <MediaCrudPage />
            </PageShell>
          }
        />
        <Route
          path="/therapist/plans"
          element={
            <PageShell>
              <PlanManagementPage />
            </PageShell>
          }
        />
        <Route
          path="/therapist/patient-progress"
          element={
            <PageShell>
              <TherapistPatientProgressPage />
            </PageShell>
          }
        />

        {/* FAMILY */}
        <Route
          path="/family"
          element={
            <PageShell>
              <FamilyDashboardPage />
            </PageShell>
          }
        />
        <Route
          path="/family/links"
          element={
            <PageShell>
              <FamilyLinksPage />
            </PageShell>
          }
        />
        <Route
          path="/family/progress"
          element={
            <PageShell>
              <FamilyProgressPage />
            </PageShell>
          }
        />

        <Route path="*" element={<div style={{ padding: 16 }}>404</div>} />
      </Routes>
    </BrowserRouter>
  );
}