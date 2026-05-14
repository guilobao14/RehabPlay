import { Link } from "react-router-dom";

export default function TermsPage() {
  return (
    <div className="appPage">
      <div className="appShellMockup">
        <div className="topbar">
          <Link to="/" className="brandLink">
            RehabPlay
          </Link>
        </div>

        <main className="legalPage">
          <section className="legalHero">
            <span>Termos</span>
            <h1>Termos e Condições</h1>
            <p>
              Estes termos regulam a utilização da plataforma RehabPlay enquanto
              ferramenta digital de apoio à reabilitação.
            </p>
          </section>

          <section className="legalCard">
            <h2>1. Utilização da plataforma</h2>
            <p>
              A RehabPlay destina-se a apoiar o acompanhamento de planos de
              reabilitação, permitindo o registo de progresso, consulta de
              exercícios, comunicação e utilização de funcionalidades de
              gamificação.
            </p>
          </section>

          <section className="legalCard">
            <h2>2. Responsabilidade clínica</h2>
            <p>
              A plataforma não substitui acompanhamento médico ou terapêutico. O
              paciente deve seguir sempre as indicações do terapeuta responsável.
            </p>
          </section>

          <section className="legalCard">
            <h2>3. Contas de utilizador</h2>
            <p>
              Cada utilizador é responsável por manter a confidencialidade das
              suas credenciais de acesso e por utilizar a plataforma de forma
              adequada.
            </p>
          </section>

          <section className="legalCard">
            <h2>4. Perfis e permissões</h2>
            <p>
              A plataforma distingue perfis de paciente, terapeuta e familiar.
              Cada perfil possui permissões próprias, de forma a proteger dados
              clínicos e informação privada.
            </p>
          </section>

          <section className="legalCard">
            <h2>5. Ligações familiares</h2>
            <p>
              O acesso familiar depende de autorização do paciente. Familiares
              podem consultar apenas informação autorizada, não tendo acesso às
              mensagens privadas entre paciente e terapeuta.
            </p>
          </section>

          <section className="legalCard">
            <h2>6. Alterações</h2>
            <p>
              Estes termos podem ser atualizados para refletir melhorias da
              plataforma, alterações funcionais ou requisitos legais.
            </p>
          </section>

          <div className="legalActions">
            <Link to="/register">Voltar ao registo</Link>
            <Link to="/privacy-policy">Política de Privacidade</Link>
          </div>
        </main>
      </div>
    </div>
  );
}