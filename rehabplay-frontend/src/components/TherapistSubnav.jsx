import { NavLink } from "react-router-dom";

export default function TherapistSubnav() {
  return (
    <div className="therapistSubnav">
      <NavLink
        to="/therapist/plans"
        className={({ isActive }) =>
          `therapistSubnavLink ${isActive ? "therapistSubnavLinkActive" : ""}`
        }
      >
        Gestão de Planos
      </NavLink>

      <NavLink
        to="/therapist/exercises"
        className={({ isActive }) =>
          `therapistSubnavLink ${isActive ? "therapistSubnavLinkActive" : ""}`
        }
      >
        Exercícios
      </NavLink>

      <NavLink
        to="/therapist/media"
        className={({ isActive }) =>
          `therapistSubnavLink ${isActive ? "therapistSubnavLinkActive" : ""}`
        }
      >
        Recursos Multimédia
      </NavLink>

      <NavLink
        to="/therapist/patient-progress"
        className={({ isActive }) =>
          `therapistSubnavLink ${isActive ? "therapistSubnavLinkActive" : ""}`
        }
      >
        Progresso dos Pacientes
      </NavLink>
    </div>
  );
}