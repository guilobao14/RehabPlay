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
  });

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

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await registerUser(form);
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