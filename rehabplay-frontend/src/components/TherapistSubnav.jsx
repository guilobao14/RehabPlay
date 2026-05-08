import { NavLink } from "react-router-dom";
import { useAppPreferences } from "../context/AppPreferencesContext.jsx";

const therapistSubnavText = {
  "pt-PT": {
    plans: "Gestão de Planos",
    exercises: "Exercícios",
    media: "Recursos Multimédia",
    challenges: "Desafios",
    progress: "Progresso dos Pacientes",
  },
  en: {
    plans: "Plan Management",
    exercises: "Exercises",
    media: "Media Resources",
    challenges: "Challenges",
    progress: "Patient Progress",
  },
};

export default function TherapistSubnav() {
  const { language } = useAppPreferences();
  const text = therapistSubnavText[language] || therapistSubnavText["pt-PT"];

  return (
    <div className="therapistSubnav">
      <NavLink
        to="/therapist/plans"
        className={({ isActive }) =>
          `therapistSubnavLink ${isActive ? "therapistSubnavLinkActive" : ""}`
        }
      >
        {text.plans}
      </NavLink>

      <NavLink
        to="/therapist/exercises"
        className={({ isActive }) =>
          `therapistSubnavLink ${isActive ? "therapistSubnavLinkActive" : ""}`
        }
      >
        {text.exercises}
      </NavLink>

      <NavLink
        to="/therapist/media"
        className={({ isActive }) =>
          `therapistSubnavLink ${isActive ? "therapistSubnavLinkActive" : ""}`
        }
      >
        {text.media}
      </NavLink>

      <NavLink
        to="/therapist/challenges"
        className={({ isActive }) =>
          `therapistSubnavLink ${isActive ? "therapistSubnavLinkActive" : ""}`
        }
      >
        {text.challenges}
      </NavLink>

      <NavLink
        to="/therapist/patient-progress"
        className={({ isActive }) =>
          `therapistSubnavLink ${isActive ? "therapistSubnavLinkActive" : ""}`
        }
      >
        {text.progress}
      </NavLink>
    </div>
  );
}