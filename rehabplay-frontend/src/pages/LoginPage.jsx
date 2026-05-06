import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser, verify2FA } from "../api/auth";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { refreshMe } = useAuth();

  const [step, setStep] = useState("login");

  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  const [otpToken, setOtpToken] = useState("");
  const [pendingUser, setPendingUser] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function goAfterLogin(role) {
    if (role === "THERAPIST") {
      navigate("/therapist/plans");
      return;
    }

    if (role === "FAMILY") {
      navigate("/family");
      return;
    }

    navigate("/dashboard");
  }

  async function handleLoginSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const data = await loginUser(form);

      if (data?.requires_2fa) {
        setPendingUser(data);
        setStep("otp");
        setSuccess("Conta com 2FA ativo. Introduz o código do Google Authenticator.");
        return;
      }

      await refreshMe();
      goAfterLogin(data?.role);
    } catch (err) {
      setError(err.message || "Erro ao iniciar sessão.");
    } finally {
      setLoading(false);
    }
  }

  async function handleOtpSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await verify2FA(otpToken);
      await refreshMe();
      goAfterLogin(pendingUser?.role);
    } catch (err) {
      setError(err.message || "Código 2FA inválido.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="loginPage">
      <div className="loginWrapper">
        <div className="loginCard">
          <h1 className="loginTitle">RehabPlay</h1>
          <p className="loginSubtitle">Apoio à Reabilitação com Gamificação</p>

          {error && <div className="loginErrorBox">{error}</div>}
          {success && <div className="loginSuccessBox">{success}</div>}

          {step === "login" ? (
            <form className="loginForm" onSubmit={handleLoginSubmit}>
              <input
                className="input"
                type="text"
                name="username"
                placeholder="Username"
                value={form.username}
                onChange={handleChange}
                required
              />

              <input
                className="input"
                type="password"
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                required
              />

              <button className="btnPrimary" type="submit" disabled={loading}>
                {loading ? "A entrar..." : "Entrar"}
              </button>
            </form>
          ) : (
            <form className="loginForm" onSubmit={handleOtpSubmit}>
              <div className="loginOtpInfo">
                Introduz o código de 6 dígitos do Google Authenticator.
              </div>

              <input
                className="input"
                type="text"
                inputMode="numeric"
                placeholder="Código 2FA"
                value={otpToken}
                onChange={(e) => setOtpToken(e.target.value)}
                required
              />

              <button className="btnPrimary" type="submit" disabled={loading}>
                {loading ? "A verificar..." : "Verificar código"}
              </button>

              <button
                type="button"
                className="loginSecondaryBtn"
                onClick={() => {
                  setStep("login");
                  setOtpToken("");
                  setPendingUser(null);
                  setError("");
                  setSuccess("");
                }}
              >
                Voltar
              </button>
            </form>
          )}
        </div>

        <div className="loginBottom">
          Não tem conta? <Link to="/register">Criar conta</Link>
        </div>
      </div>
    </div>
  );
}
