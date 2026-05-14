import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../api/auth";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    password: "",
    role: "PATIENT",
    display_name: "",
    phone: "",
    accepted_terms: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.accepted_terms) {
      setError("Tens de aceitar a Política de Privacidade e os Termos.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        username: form.username,
        password: form.password,
        role: form.role,
        display_name: form.display_name,
        phone: form.phone,
      };

      await registerUser(payload);

      setSuccess("Conta criada com sucesso. Agora podes iniciar sessão.");

      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (err) {
      setError(err.message || "Erro ao criar conta.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="loginPage">
      <div className="loginWrapper">
        <div className="loginCard">
          <h1 className="loginTitle">Criar conta</h1>
          <p className="loginSubtitle">Junta-te à plataforma RehabPlay</p>

          {error && <div className="loginErrorBox">{error}</div>}
          {success && <div className="loginSuccessBox">{success}</div>}

          <form className="loginForm" onSubmit={handleSubmit}>
            <input
              className="input"
              type="text"
              name="display_name"
              placeholder="Nome apresentado"
              value={form.display_name}
              onChange={handleChange}
              required
            />

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

            <select
              className="input"
              name="role"
              value={form.role}
              onChange={handleChange}
            >
              <option value="PATIENT">Paciente</option>
              <option value="THERAPIST">Terapeuta</option>
              <option value="FAMILY">Familiar</option>
            </select>

            <input
              className="input"
              type="text"
              name="phone"
              placeholder="Telefone (opcional)"
              value={form.phone}
              onChange={handleChange}
            />

            <label className="legalConsentBox">
              <input
                type="checkbox"
                name="accepted_terms"
                checked={form.accepted_terms}
                onChange={handleChange}
                required
              />

              <span>
                Li e aceito a{" "}
                <Link to="/privacy-policy" target="_blank">
                  Política de Privacidade
                </Link>{" "}
                e os{" "}
                <Link to="/terms" target="_blank">
                  Termos e Condições
                </Link>
                .
              </span>
            </label>

            <button className="btnPrimary" type="submit" disabled={loading}>
              {loading ? "A criar..." : "Criar conta"}
            </button>
          </form>
        </div>

        <div className="loginBottom">
          Já tens conta? <Link to="/login">Iniciar sessão</Link>
        </div>
      </div>
    </div>
  );
}