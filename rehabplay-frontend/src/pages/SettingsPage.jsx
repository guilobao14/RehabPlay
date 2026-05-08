import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { useAppPreferences } from "../context/AppPreferencesContext";
import {
  fetchMySettings,
  updateMySettings,
  logout,
  setup2FA,
  verify2FA,
  fetchMe,
} from "../api/auth";

const text = {
  "pt-PT": {
    title: "Definições",
    subtitle: "Personaliza a tua experiência e segurança na plataforma",
    panel: "Painel de controlo",
    summary: "Resumo atual",
    account: "Conta",
    preferences: "Preferências",
    reminders: "Lembretes",
    active: "Ativos",
    inactive: "Desativados",
    theme: "Tema",
    language: "Idioma",
    autoChanges: "Alterações automáticas",
    accountState: "Estado da conta",
    available: "Disponível",
    twoFA: "2FA",
    save: "Guardar alterações",
    saving: "A guardar...",
    exerciseReminders: "Receber lembretes de exercícios",
    exerciseText: "Ativa notificações para manteres regularidade no plano.",
    light: "Claro",
    dark: "Escuro",
    portuguese: "Português",
    english: "English",
    security: "Segurança",
    securityText: "Protege a tua conta com autenticação de dois fatores.",
    twoFAActive: "2FA ativo",
    twoFADesc:
      "A tua conta está protegida com Google Authenticator. No próximo login será pedido um código de verificação.",
    activate2FA: "Ativar 2FA com Google Authenticator",
    preparing: "A preparar...",
    qrText:
      "Faz scan deste QR code com o Google Authenticator e confirma com o código de 6 dígitos.",
    manualLink: "Mostrar ligação manual",
    codePlaceholder: "Código de 6 dígitos",
    confirmCode: "Confirmar código",
    confirming: "A confirmar...",
    privacy: "Privacidade",
    password: "Alterar palavra-passe",
    personalData: "Gerir dados pessoais",
    session: "Sessão",
    logout: "Terminar sessão",
    loggingOut: "A terminar...",
    dashboard: "Voltar ao dashboard",
    success: "Definições guardadas com sucesso.",
    errorLoad: "Erro ao carregar definições.",
    errorSave: "Erro ao guardar definições.",
    errorLogout: "Erro ao terminar sessão.",
    error2FA: "Erro ao iniciar configuração do 2FA.",
    errorVerify: "Erro ao confirmar o código 2FA.",
    loading: "A carregar definições...",
    loadingText: "A obter as preferências reais da tua conta.",
    noData: "Sem dados",
    noDataText: "Não foi possível encontrar as definições da conta.",
    hello: "Olá",
  },
  en: {
    title: "Settings",
    subtitle: "Customize your experience and account security",
    panel: "Control panel",
    summary: "Current summary",
    account: "Account",
    preferences: "Preferences",
    reminders: "Reminders",
    active: "Active",
    inactive: "Disabled",
    theme: "Theme",
    language: "Language",
    autoChanges: "Automatic updates",
    accountState: "Account status",
    available: "Available",
    twoFA: "2FA",
    save: "Save changes",
    saving: "Saving...",
    exerciseReminders: "Receive exercise reminders",
    exerciseText: "Enable notifications to keep your routine consistent.",
    light: "Light",
    dark: "Dark",
    portuguese: "Portuguese",
    english: "English",
    security: "Security",
    securityText: "Protect your account with two-factor authentication.",
    twoFAActive: "2FA enabled",
    twoFADesc:
      "Your account is protected with Google Authenticator. A verification code will be required on your next login.",
    activate2FA: "Enable 2FA with Google Authenticator",
    preparing: "Preparing...",
    qrText:
      "Scan this QR code with Google Authenticator and confirm with the 6-digit code.",
    manualLink: "Show manual link",
    codePlaceholder: "6-digit code",
    confirmCode: "Confirm code",
    confirming: "Confirming...",
    privacy: "Privacy",
    password: "Change password",
    personalData: "Manage personal data",
    session: "Session",
    logout: "Sign out",
    loggingOut: "Signing out...",
    dashboard: "Back to dashboard",
    success: "Settings saved successfully.",
    errorLoad: "Error loading settings.",
    errorSave: "Error saving settings.",
    errorLogout: "Error signing out.",
    error2FA: "Error starting 2FA setup.",
    errorVerify: "Error confirming 2FA code.",
    loading: "Loading settings...",
    loadingText: "Getting your real account preferences.",
    noData: "No data",
    noDataText: "Could not find account settings.",
    hello: "Hi",
  },
};

function applyTheme(theme, setTheme) {
  setTheme(theme || "light");
}

function applyLanguage(language, setLanguage) {
  setLanguage(language || "pt-PT");
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const { setTheme, setLanguage } = useAppPreferences();

  const [settings, setSettings] = useState(null);
  const [form, setForm] = useState({
    reminder_opt_in: false,
    theme: localStorage.getItem("rehabplay_theme") || "light",
    language: localStorage.getItem("rehabplay_language") || "pt-PT",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  const [otpSetupData, setOtpSetupData] = useState(null);
  const [otpToken, setOtpToken] = useState("");
  const [otpEnabled, setOtpEnabled] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const t = useMemo(() => text[form.language] || text["pt-PT"], [form.language]);

  useEffect(() => {
    applyTheme(form.theme, setTheme);
    applyLanguage(form.language, setLanguage);
  }, [form.theme, form.language]);

  useEffect(() => {
    async function loadPage() {
      try {
        const [settingsData, meData] = await Promise.all([
          fetchMySettings(),
          fetchMe(),
        ]);

        const nextForm = {
          reminder_opt_in: !!settingsData?.reminder_opt_in,
          theme:
            settingsData?.theme ||
            localStorage.getItem("rehabplay_theme") ||
            "light",
          language:
            settingsData?.language ||
            localStorage.getItem("rehabplay_language") ||
            "pt-PT",
        };

        setSettings(settingsData);
        setForm(nextForm);
        applyTheme(nextForm.theme, setTheme);
        applyLanguage(nextForm.language, setLanguage);
        setOtpEnabled(!!meData?.two_factor_enabled);
      } catch (err) {
        setError(err.message || t.errorLoad);
      } finally {
        setLoading(false);
      }
    }

    loadPage();
  }, []);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((prev) => {
      const next = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };

      if (name === "theme") applyTheme(value, setTheme);
      if (name === "language") applyLanguage(value, setLanguage);

      return next;
    });

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
        theme: updated?.theme || form.theme,
        language: updated?.language || form.language,
      });

      applyTheme(updated?.theme || form.theme, setTheme);
      applyLanguage(updated?.language || form.language, setLanguage);

      setSuccess(t.success);
    } catch (err) {
      setError(err.message || t.errorSave);
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    setLoggingOut(true);
    setError("");

    try {
      await logout();
      localStorage.removeItem("rehabplay_user");
      navigate("/login");
    } catch (err) {
      setError(err.message || t.errorLogout);
    } finally {
      setLoggingOut(false);
    }
  }

  async function handleSetup2FA() {
    setOtpLoading(true);
    setError("");
    setSuccess("");

    try {
      const data = await setup2FA();
      setOtpSetupData(data);

      if (data?.confirmed) {
        setOtpEnabled(true);
        setSuccess(t.twoFAActive);
      }
    } catch (err) {
      setError(err.message || t.error2FA);
    } finally {
      setOtpLoading(false);
    }
  }

  async function handleVerify2FA(event) {
    event.preventDefault();
    setOtpLoading(true);
    setError("");
    setSuccess("");

    try {
      await verify2FA(otpToken);
      setOtpEnabled(true);
      setOtpToken("");
      setOtpSetupData(null);
      setSuccess(t.twoFAActive);
    } catch (err) {
      setError(err.message || t.errorVerify);
    } finally {
      setOtpLoading(false);
    }
  }

  return (
    <div className="appPage">
      <div className="appShellMockup">
        <div className="topbar">
          <Link to="/dashboard" className="brandLink">
            RehabPlay
          </Link>
          <div className="userArea">{t.hello}, Guilherme</div>
        </div>

        <div className="content settingsProPage">
          {loading && (
            <div className="settingsProStateCard">
              <h3>{t.loading}</h3>
              <p>{t.loadingText}</p>
            </div>
          )}

          {error && !loading && <div className="settingsProError">{error}</div>}
          {success && !loading && <div className="settingsProSuccess">{success}</div>}

          {!loading && !error && settings && (
            <>
              <section className="settingsProHero">
                <div className="settingsProHeroMain">
                  <div className="settingsProEyebrow">{t.panel}</div>
                  <h1 className="settingsProTitle">{t.title}</h1>
                  <p className="settingsProSubtitle">{t.subtitle}</p>
                </div>

                <div className="settingsProHeroSide">
                  <div className="settingsProFocusCard">
                    <span>{t.twoFA}</span>
                    <strong>{otpEnabled ? t.active : t.inactive}</strong>
                    <p>{t.securityText}</p>
                  </div>
                </div>
              </section>

              <section className="settingsProTopGrid">
                <div className="settingsProCard">
                  <div className="settingsProCardHeader">
                    <h2>{t.summary}</h2>
                    <span>{t.preferences}</span>
                  </div>

                  <div className="settingsProInfoList">
                    <div className="settingsProInfoItem">
                      <span>{t.reminders}</span>
                      <strong>{form.reminder_opt_in ? t.active : t.inactive}</strong>
                    </div>
                    <div className="settingsProInfoItem">
                      <span>{t.theme}</span>
                      <strong>{form.theme === "dark" ? t.dark : t.light}</strong>
                    </div>
                    <div className="settingsProInfoItem">
                      <span>{t.language}</span>
                      <strong>
                        {form.language === "en" ? t.english : t.portuguese}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="settingsProCard">
                  <div className="settingsProCardHeader">
                    <h2>{t.account}</h2>
                    <span>RehabPlay</span>
                  </div>

                  <div className="settingsProInfoList">
                    <div className="settingsProInfoItem">
                      <span>{t.autoChanges}</span>
                      <strong>{t.active}</strong>
                    </div>
                    <div className="settingsProInfoItem">
                      <span>{t.accountState}</span>
                      <strong>{t.available}</strong>
                    </div>
                    <div className="settingsProInfoItem">
                      <span>{t.twoFA}</span>
                      <strong>{otpEnabled ? t.active : t.inactive}</strong>
                    </div>
                  </div>
                </div>
              </section>

              <form className="settingsProCard settingsProPreferences" onSubmit={handleSave}>
                <div className="settingsProCardHeader">
                  <h2>{t.preferences}</h2>
                  <span>{t.account}</span>
                </div>

                <div className="settingsProReminderBox">
                  <div>
                    <h3>{t.exerciseReminders}</h3>
                    <p>{t.exerciseText}</p>
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

                <div className="settingsProFormGrid">
                  <div className="settingsProField">
                    <label>{t.theme}</label>
                    <select name="theme" value={form.theme} onChange={handleChange}>
                      <option value="light">{t.light}</option>
                      <option value="dark">{t.dark}</option>
                    </select>
                  </div>

                  <div className="settingsProField">
                    <label>{t.language}</label>
                    <select
                      name="language"
                      value={form.language}
                      onChange={handleChange}
                    >
                      <option value="pt-PT">{t.portuguese}</option>
                      <option value="en">{t.english}</option>
                    </select>
                  </div>
                </div>

                <div className="settingsProActionsRight">
                  <button className="settingsProPrimaryBtn" disabled={saving}>
                    {saving ? t.saving : t.save}
                  </button>
                </div>
              </form>

              <section className="settingsProCard">
                <div className="settingsProCardHeader">
                  <h2>{t.security}</h2>
                  <span>{t.twoFA}</span>
                </div>

                {otpEnabled ? (
                  <div className="settingsPro2FAActive">
                    <strong>{t.twoFAActive}</strong>
                    <p>{t.twoFADesc}</p>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      className="settingsProGhostFullBtn"
                      onClick={handleSetup2FA}
                      disabled={otpLoading}
                    >
                      {otpLoading ? t.preparing : t.activate2FA}
                    </button>

                    {otpSetupData?.otpauth_url && (
                      <div className="settingsOtpBox">
                        <p className="settingsProMuted">{t.qrText}</p>

                        <div className="settingsQrWrap">
                          <div className="settingsQrCard">
                            <QRCodeSVG
                              value={otpSetupData.otpauth_url}
                              size={220}
                              includeMargin
                            />
                          </div>
                        </div>

                        <details className="settingsOtpDetails">
                          <summary>{t.manualLink}</summary>
                          <textarea readOnly value={otpSetupData.otpauth_url} />
                        </details>

                        <form
                          onSubmit={handleVerify2FA}
                          className="settingsOtpVerifyForm"
                        >
                          <input
                            type="text"
                            placeholder={t.codePlaceholder}
                            value={otpToken}
                            onChange={(e) => setOtpToken(e.target.value)}
                            required
                          />

                          <button className="settingsProPrimaryBtn" disabled={otpLoading}>
                            {otpLoading ? t.confirming : t.confirmCode}
                          </button>
                        </form>
                      </div>
                    )}
                  </>
                )}
              </section>

              <section className="settingsProBottomGrid">
                <div className="settingsProCard">
                  <div className="settingsProCardHeader">
                    <h2>{t.privacy}</h2>
                    <span>{t.account}</span>
                  </div>

                  <div className="settingsProActionList">
                    <button type="button">{t.password}</button>
                    <button type="button">{t.personalData}</button>
                  </div>
                </div>

                <div className="settingsProCard">
                  <div className="settingsProCardHeader">
                    <h2>{t.session}</h2>
                    <span>Login</span>
                  </div>

                  <div className="settingsProActionList">
                    <button
                      type="button"
                      className="danger"
                      onClick={handleLogout}
                      disabled={loggingOut}
                    >
                      {loggingOut ? t.loggingOut : t.logout}
                    </button>

                    <Link to="/dashboard">{t.dashboard}</Link>
                  </div>
                </div>
              </section>
            </>
          )}

          {!loading && !error && !settings && (
            <div className="settingsProStateCard">
              <h3>{t.noData}</h3>
              <p>{t.noDataText}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
