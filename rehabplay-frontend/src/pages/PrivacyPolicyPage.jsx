import { Link } from "react-router-dom";

export default function PrivacyPolicyPage() {
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
            <span>RGPD</span>
            <h1>Política de Privacidade</h1>
            <p>
              A RehabPlay respeita a privacidade dos utilizadores e aplica
              princípios de proteção de dados pessoais, minimização de acesso e
              confidencialidade.
            </p>
          </section>

          <section className="legalCard">
            <h2>1. Dados recolhidos</h2>
            <p>
              A plataforma pode recolher dados como nome de utilizador, nome
              apresentado, contacto telefónico, fotografia de perfil, função do
              utilizador, planos de reabilitação, registos de progresso,
              mensagens internas, notificações e informação relacionada com
              gamificação.
            </p>
          </section>

          <section className="legalCard">
            <h2>2. Finalidade do tratamento</h2>
            <p>
              Os dados são tratados para permitir o funcionamento da plataforma,
              acompanhamento dos planos de reabilitação, comunicação entre
              paciente e terapeuta, registo de progresso, atribuição de
              conquistas e gestão de permissões familiares.
            </p>
          </section>

          <section className="legalCard">
            <h2>3. Acesso familiar</h2>
            <p>
              Familiares apenas podem consultar progresso quando o paciente
              aprova explicitamente a ligação familiar. As mensagens entre
              paciente e terapeuta permanecem privadas e não são disponibilizadas
              aos familiares.
            </p>
          </section>

          <section className="legalCard">
            <h2>4. Segurança e controlo de acesso</h2>
            <p>
              A RehabPlay utiliza autenticação, permissões por tipo de utilizador
              e controlo de acesso para garantir que cada perfil apenas consulta
              informação adequada à sua função.
            </p>
          </section>

          <section className="legalCard">
            <h2>5. Direitos do utilizador</h2>
            <p>
              O utilizador pode solicitar acesso, correção, atualização ou
              eliminação dos seus dados, conforme aplicável.
            </p>
          </section>

          <section className="legalCard">
            <h2>6. Retenção de dados</h2>
            <p>
              Os dados são mantidos apenas enquanto forem necessários para o
              funcionamento da plataforma e para o acompanhamento do processo de
              reabilitação.
            </p>
          </section>

          <section className="legalCard">
            <h2>7. Contacto</h2>
            <p>
              Para questões relacionadas com privacidade e proteção de dados, o
              utilizador deve contactar o responsável pela plataforma RehabPlay.
            </p>
          </section>

          <div className="legalActions">
            <Link to="/register">Voltar ao registo</Link>
            <Link to="/login">Ir para login</Link>
          </div>
        </main>
      </div>
    </div>
  );
}