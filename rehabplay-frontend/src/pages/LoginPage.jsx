export default function LoginPage() {
  return (
    <div className="loginPage">
      <div className="loginWrapper">
        <div className="loginCard">
          <h1 className="loginTitle">RehabPlay</h1>
          <p className="loginSubtitle">Apoio à Reabilitação com Gamificação</p>

          <div className="loginForm">
            <input className="input" type="email" placeholder="Email" />
            <input className="input" type="password" placeholder="Password" />
            <button className="btnPrimary">Entrar</button>
          </div>
        </div>

        <div className="loginBottom">
          Não tem conta? <a href="/register">Criar conta</a>
        </div>
      </div>
    </div>
  );
}

