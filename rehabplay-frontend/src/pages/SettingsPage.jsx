import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchMySettings, updateMySettings, logout } from "../api/auth";

function formatTheme(value) {
  if (value === "light") return "Claro";
  if (value === "dark") return "Escuro";
  return value || "-";
}

function formatLanguage(value) {
  if (value === "pt-PT") return "Português";
  if (value === "en") return "English";
  return value || "-";
}

export default function SettingsPage() {
  const navigate = useNavigate();

  const [settings, setSettings] = useState(null);
  const [form, setForm] = useState({
    reminder_opt_in: false,
    theme: "light",
    language: "pt-PT",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await fetchMySettings();
        setSettings(data);
        setForm({
          reminder_opt_in: !!data?.reminder_opt_in,
          theme: data?.theme || "light",
          language: data?.language || "pt-PT",
        });
      } catch (err) {
        setError(err.message || "Erro ao carregar definições.");
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    setSuccess("");
  }

  async function handleSave(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const updated = await updateMySettings(form);
      setSettings(updated);
      setForm({
        reminder_opt_in: !!updated?.reminder_opt_in,
        theme: updated?.theme || "light",
        language: updated?.language || "pt-PT",
      });
      setSuccess("Definições guardadas com sucesso.");
    } catch (err) {
      setError(err.message || "Erro ao guardar definições.");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    setLoggingOut(true);
    setError("");

    try {
      await logout();
      navigate("/login");
    } catch (err) {
      setError(err.message || "Erro ao terminar sessão.");
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="appPage">
      <div className="appShellMockup">
        <div className="topbar">
          <Link to="/dashboard" className="brandLink">
            RehabPlay
          </Link>
          <div className="userArea">Olá, Guilherme</div>
        </div>

        <div className="pageHeader">
          <h1 className="pageTitle">Definições</h1>
          <div className="pageSubtitle">
            Gere preferências da conta e personalização da aplicação
          </div>
        </div>

        <div className="content">
          {loading && (
            <div className="settingsCardModern">
              <h3 className="settingsBlockTitle">A carregar...</h3>
              <p className="settingsMutedText">A obter as definições da conta.</p>
            </div>
          )}

          {error && !loading && (
            <div className="settingsNoticeError">{error}</div>
          )}

          {success && !loading && (
            <div className="settingsNoticeOk">{success}</div>
          )}

          {!loading && !error && settings && (
            <>
              <div className="settingsTopGrid">
                <div className="settingsCardModern">
                  <h3 className="settingsBlockTitle">Resumo atual</h3>

                  <div className="settingsInfoList">
                    <div className="settingsInfoItem">
                      <span>Lembretes</span>
                      <strong>{form.reminder_opt_in ? "Ativos" : "Desativados"}</strong>
                    </div>

                    <div className="settingsInfoItem">
                      <span>Tema</span>
                      <strong>{formatTheme(form.theme)}</strong>
                    </div>

                    <div className="settingsInfoItem">
                      <span>Idioma</span>
                      <strong>{formatLanguage(form.language)}</strong>
                    </div>
                  </div>
                </div>

                <div className="settingsCardModern">
                  <h3 className="settingsBlockTitle">Conta</h3>

                  <div className="settingsInfoList">
                    <div className="settingsInfoItem">
                      <span>Alterações automáticas</span>
                      <strong>Ativas</strong>
                    </div>

                    <div className="settingsInfoItem">
                      <span>Estado da conta</span>
                      <strong>Disponível</strong>
                    </div>

                    <div className="settingsInfoItem">
                      <span>Personalização</span>
                      <strong>Ativa</strong>
                    </div>
                  </div>
                </div>
              </div>

              <form className="settingsFormCard" onSubmit={handleSave}>
                <h3 className="settingsBlockTitle">Preferências</h3>

                <div className="settingsFormGrid">
                  <div className="settingsToggleRow">
                    <div>
                      <div className="settingsToggleTitle">
                        Receber lembretes de exercícios
                      </div>
                      <div className="settingsMutedText">
                        Ativa notificações para manteres regularidade no plano.
                      </div>
                    </div>

                    <label className="settingsSwitch">
                      <input
                        type="checkbox"
                        name="reminder_opt_in"
                        checked={form.reminder_opt_in}
                        onChange={handleChange}
                      />
                      <span className="settingsSlider" />
                    </label>
                  </div>

                  <div className="settingsField">
                    <label className="settingsLabel">Tema</label>
                    <select
                      className="input"
                      name="theme"
                      value={form.theme}
                      onChange={handleChange}
                    >
                      <option value="light">Claro</option>
                      <option value="dark">Escuro</option>
                    </select>
                  </div>

                  <div className="settingsField">
                    <label className="settingsLabel">Idioma</label>
                    <select
                      className="input"
                      name="language"
                      value={form.language}
                      onChange={handleChange}
                    >
                      <option value="pt-PT">Português</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                </div>

                <div className="settingsFormActions">
                  <button
                    type="submit"
                    className="mediumButton"
                    disabled={saving}
                  >
                    {saving ? "A guardar..." : "Guardar alterações"}
                  </button>
                </div>
              </form>

              <div className="settingsBottomGrid">
                <div className="settingsCardModern">
                  <h3 className="settingsBlockTitle">Privacidade</h3>
                  <div className="settingsActionList">
                    <button type="button" className="settingsGhostBtn">
                      Alterar palavra-passe
                    </button>
                    <button type="button" className="settingsGhostBtn">
                      Gerir dados pessoais
                    </button>
                  </div>
                </div>

                <div className="settingsCardModern">
                  <h3 className="settingsBlockTitle">Sessão</h3>
                  <div className="settingsActionList">
                    <button
                      type="button"
                      className="settingsDangerBtn"
                      onClick={handleLogout}
                      disabled={loggingOut}
                    >
                      {loggingOut ? "A terminar..." : "Terminar sessão"}
                    </button>
                    <Link to="/dashboard" className="settingsGhostLinkBtn">
                      Voltar ao dashboard
                    </Link>
                  </div>
                </div>
              </div>
            </>
          )}

          {!loading && !error && !settings && (
            <div className="settingsCardModern">
              <h3 className="settingsBlockTitle">Sem dados</h3>
              <p className="settingsMutedText">
                Não foi possível encontrar as definições da conta.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}