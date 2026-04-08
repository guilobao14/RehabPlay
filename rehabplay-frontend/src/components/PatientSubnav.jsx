import { NavLink } from "react-router-dom";

export default function PatientSubnav() {
  return (
    <div className="patientSubnav">
      <NavLink
        to="/patient/plan"
        className={({ isActive }) =>
          `patientSubnavLink ${isActive ? "patientSubnavLinkActive" : ""}`
        }
      >
        Meu Plano
      </NavLink>

      <NavLink
        to="/patient/progress"
        className={({ isActive }) =>
          `patientSubnavLink ${isActive ? "patientSubnavLinkActive" : ""}`
        }
      >
        Progresso
      </NavLink>

      <NavLink
        to="/patient/library"
        className={({ isActive }) =>
          `patientSubnavLink ${isActive ? "patientSubnavLinkActive" : ""}`
        }
      >
        Biblioteca
      </NavLink>

      <NavLink
        to="/patient/gamification"
        className={({ isActive }) =>
          `patientSubnavLink ${isActive ? "patientSubnavLinkActive" : ""}`
        }
      >
        Gamificação
      </NavLink>
    </div>
  );
}