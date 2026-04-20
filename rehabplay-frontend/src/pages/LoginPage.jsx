import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../api/auth";

export default function LoginPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await loginUser(form);

      if (data?.role === "THERAPIST") {
        navigate("/therapist/plans");
        return;
      }

      if (data?.role === "FAMILY") {
        navigate("/family");
        return;
      }

      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Erro ao iniciar sessão.");
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

          <form className="loginForm" onSubmit={handleSubmit}>
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
        </div>

        <div className="loginBottom">
          Não tem conta? <Link to="/register">Criar conta</Link>
        </div>
      </div>
    </div>
  );
}

