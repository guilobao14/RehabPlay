import { NavLink } from "react-router-dom";
import { useAppPreferences } from "../context/AppPreferencesContext";

const patientSubnavText = {
  "pt-PT": {
    plan: "Meu Plano",
    progress: "Progresso",
    library: "Biblioteca",
    gamification: "Gamificação",
  },
  en: {
    plan: "My Plan",
    progress: "Progress",
    library: "Library",
    gamification: "Gamification",
  },
};

export default function PatientSubnav() {
  const { language } = useAppPreferences();
  const t = patientSubnavText[language] || patientSubnavText["pt-PT"];

  function goToTop() {
    setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    }, 80);
  }

  return (
    <div className="patientSubnav">
      <NavLink
        to="/patient/plan"
        onClick={goToTop}
        className={({ isActive }) =>
          `patientSubnavLink ${isActive ? "patientSubnavLinkActive" : ""}`
        }
      >
        {t.plan}
      </NavLink>

      <NavLink
        to="/patient/progress"
        onClick={goToTop}
        className={({ isActive }) =>
          `patientSubnavLink ${isActive ? "patientSubnavLinkActive" : ""}`
        }
      >
        {t.progress}
      </NavLink>

      <NavLink
        to="/patient/library"
        onClick={goToTop}
        className={({ isActive }) =>
          `patientSubnavLink ${isActive ? "patientSubnavLinkActive" : ""}`
        }
      >
        {t.library}
      </NavLink>

      <NavLink
        to="/patient/gamification"
        onClick={goToTop}
        className={({ isActive }) =>
          `patientSubnavLink ${isActive ? "patientSubnavLinkActive" : ""}`
        }
      >
        {t.gamification}
      </NavLink>
    </div>
  );
}