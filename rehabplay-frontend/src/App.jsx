import { BrowserRouter, Routes, Route, Link, useNavigate } from "react-router-dom";
import { useAppPreferences } from "./context/AppPreferencesContext";
import { fetchMyProfile, logout } from "./api/auth";
import { useEffect, useState, useRef } from "react";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import MessagesPage from "./pages/MessagesPage";
import NotificationsPage from "./pages/NotificationsPage";
import ProfilePage from "./pages/ProfilePage";
import RegisterPage from "./pages/RegisterPage";
import SettingsPage from "./pages/SettingsPage";

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
import PageNavigationArrows from "./components/PageNavigationArrows";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsPage from "./pages/TermsPage";

function GlobalTopbar() {
  const navigate = useNavigate();
  const menuRef = useRef(null);

  const { language } = useAppPreferences();
  const [profile, setProfile] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const hello = language === "en" ? "Hi" : "Olá";
  const viewProfile = language === "en" ? "View profile" : "Ver perfil";
  const settings = language === "en" ? "Settings" : "Definições";
  const logoutText = language === "en" ? "Sign out" : "Terminar sessão";
  const loggingOutText = language === "en" ? "Signing out..." : "A terminar...";

  useEffect(() => {
    fetchMyProfile()
      .then(setProfile)
      .catch(() => setProfile(null));
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const name = profile?.display_name || (language === "en" ? "User" : "Utilizador");
  const firstName = String(name).split(" ")[0];

  async function handleLogout() {
    try {
      setLoggingOut(true);
      await logout();

      sessionStorage.removeItem("rehabplay_back_stack");
      sessionStorage.removeItem("rehabplay_forward_stack");

      navigate("/login", { replace: true });
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="globalAppTopbar">
      <div className="globalTopbarLeft">
        <PageNavigationArrows />
        <div className="globalTopbarDivider" />
        <span className="globalTopbarBrand">RehabPlay</span>
      </div>

      <div className="globalTopbarUserZone">
        <div className="globalTopbarUserWrap" ref={menuRef}>
          <button
            type="button"
            className="globalTopbarUser"
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            {hello}, {firstName}
            <span className="globalTopbarChevron">{menuOpen ? "▴" : "▾"}</span>
          </button>

          {menuOpen && (
            <div className="dropdownMenu dashboardDropdownMenu globalTopbarDropdown">
              <Link to="/profile" onClick={() => setMenuOpen(false)}>
                {viewProfile}
              </Link>

              <Link to="/settings" onClick={() => setMenuOpen(false)}>
                {settings}
              </Link>

              <button
                type="button"
                className="dropdownLogoutBtn"
                onClick={handleLogout}
                disabled={loggingOut}
              >
                {loggingOut ? loggingOutText : logoutText}
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          className="globalTopbarAvatar"
          onClick={() => navigate("/profile")}
          title={viewProfile}
        >
          {profile?.photo_url ? (
            <img src={profile.photo_url} alt="Foto de perfil" />
          ) : (
            <strong>{firstName?.[0]?.toUpperCase() || "U"}</strong>
          )}
        </button>
      </div>
    </div>
  );
}

function PageShell({ children }) {
  return (
    <div style={{ minHeight: "100vh", background: "transparent", color: "white" }}>
      <GlobalTopbar />
      <div style={{ width: "100%", margin: 0, padding: 0 }}>{children}</div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Públicas */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsPage />} />

        {/* Comum a todos os utilizadores autenticados */}
        <Route element={<ProtectedRoute />}>
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
        </Route>

        {/* Paciente + Terapeuta */}
        <Route element={<RoleRoute allow={["PATIENT", "THERAPIST"]} />}>
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
        </Route>

        {/* Paciente */}
        <Route element={<RoleRoute allow={["PATIENT"]} />}>
          <Route
            path="/dashboard"
            element={
              <PageShell>
                <DashboardPage />
              </PageShell>
            }
          />

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

        {/* Terapeuta */}
        <Route element={<RoleRoute allow={["THERAPIST"]} />}>
          <Route
            path="/therapist/plans"
            element={
              <PageShell>
                <PlanManagementPage />
              </PageShell>
            }
          />

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

        {/* Familiar */}
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