import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { useAppPreferences } from "./context/AppPreferencesContext";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import MessagesPage from "./pages/MessagesPage";
import NotificationsPage from "./pages/NotificationsPage";
import ProfilePage from "./pages/ProfilePage";
import RegisterPage from "./pages/RegisterPage";
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
import TherapistChallengesPage from "./pages/therapist/TherapistChallengesPage";

import FamilyDashboardPage from "./pages/family/FamilyDashboardPage";
import FamilyLinksPage from "./pages/family/FamilyLinksPage";
import FamilyProgressPage from "./pages/family/FamilyProgressPage";

import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/RoleRoute";

function Nav() {
  const { t } = useAppPreferences();

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
        {t("home")}
      </NavLink>

      <NavLink style={linkStyle} to="/login">
        {t("login")}
      </NavLink>

      <NavLink style={linkStyle} to="/dashboard">
        {t("dashboard")}
      </NavLink>

      <NavLink style={linkStyle} to="/messages">
        {t("messages")}
      </NavLink>

      <NavLink style={linkStyle} to="/notifications">
        {t("notifications")}
      </NavLink>

      <NavLink style={linkStyle} to="/profile">
        {t("profile")}
      </NavLink>

      <NavLink style={linkStyle} to="/settings">
        {t("settings")}
      </NavLink>

      <NavLink style={linkStyle} to="/test">
        {t("testApi")}
      </NavLink>

      <span style={{ margin: "0 6px", opacity: 0.4, color: "#aab" }}>|</span>

      <NavLink style={linkStyle} to="/patient/plan">
        {t("patient")}
      </NavLink>

      <NavLink style={linkStyle} to="/therapist/plans">
        {t("therapist")}
      </NavLink>

      <NavLink style={linkStyle} to="/family">
        {t("family")}
      </NavLink>
    </div>
  );
}

function PageShell({ children }) {
  return (
    <div style={{ minHeight: "100vh", background: "transparent", color: "white" }}>
      <Nav />
      <div style={{ width: "100%", margin: 0, padding: 0 }}>{children}</div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute />}>
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
        </Route>

        <Route element={<RoleRoute allow={["PATIENT"]} />}>
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
        </Route>

        <Route element={<RoleRoute allow={["THERAPIST"]} />}>
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
            path="/therapist/challenges"
            element={
              <PageShell>
                <TherapistChallengesPage />
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
        </Route>

        <Route element={<RoleRoute allow={["FAMILY"]} />}>
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
        </Route>

        <Route path="*" element={<div style={{ padding: 16 }}>404</div>} />
      </Routes>
    </BrowserRouter>
  );
}