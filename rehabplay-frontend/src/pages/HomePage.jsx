import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <div className="legacyHome">
      <div className="container">
        <h1 className="pageTitle">RehabPlay</h1>
        <p className="pageSub">
          Plataforma de apoio à reabilitação com gamificação (pontos, badges,
          desafios e ranking).
        </p>

        <div className="grid cols2">
          <div className="card">
            <div className="cardHeader">
              <div className="cardTitle">Começar</div>
            </div>

            <p className="homeLead">Web + API</p>
            <p className="homeText">
              Para já, o login é via Django (admin / login normal) e o React
              usa a sessão (cookies).
            </p>

            <div className="btnRow">
              <Link className="btn btnPrimary" to="/login">
                Login
              </Link>

              <Link className="btn" to="/dashboard">
                Dashboard
              </Link>

              <Link className="btn" to="/test">
                Test API
              </Link>
            </div>
          </div>

          <div className="card">
            <div className="cardHeader">
              <div className="cardTitle">Atalhos por perfil</div>
            </div>

            <p className="homeLead">Mockups</p>

            <div className="homeLinks">
              <Link to="/patient/plan">Paciente</Link>
              <span>·</span>
              <Link to="/patient/plan">PlanoPaciente</Link>
              <span>·</span>
              <Link to="/patient/gamification">RegistarPaciente</Link>
              <span>·</span>
              <Link to="/patient/library">BibliotecaPaciente</Link>
              <span>·</span>
              <Link to="/patient/gamification">Gamificação</Link>
              <span>·</span>
              <Link to="/therapist/plans">PlanosTerapeuta</Link>
              <span>·</span>
              <Link to="/family/progress">ProgressoFamiliar</Link>
              <span>·</span>
              <Link to="/dashboard">Dashboard</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}