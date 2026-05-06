import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchMyProfile, logout } from "../api/auth";
import {
  fetchActivePlan,
  fetchMyProgress,
  fetchMyGamification,
} from "../api/patient";
import { fetchNotifications } from "../api/notifications";

function getWeekLabel(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Sem data";

  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const diffDays = Math.floor((date - startOfYear) / 86400000);
  const week = Math.ceil((diffDays + startOfYear.getDay() + 1) / 7);

  return `Semana ${week}`;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const menuRef = useRef(null);

  const [menuOpen, setMenuOpen] = useState(false);

  const [profile, setProfile] = useState(null);
  const [plan, setPlan] = useState(null);
  const [progressEntries, setProgressEntries] = useState([]);
  const [gamification, setGamification] = useState(null);
  const [notifications, setNotifications] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [
          profileData,
          planData,
          progressData,
          gamificationData,
          notificationsData,
        ] = await Promise.all([
          fetchMyProfile().catch(() => null),
          fetchActivePlan().catch(() => null),
          fetchMyProgress().catch(() => []),
          fetchMyGamification().catch(() => null),
          fetchNotifications().catch(() => []),
        ]);

        setProfile(profileData);
        setPlan(planData);
        setProgressEntries(Array.isArray(progressData) ? progressData : []);
        setGamification(gamificationData);
        setNotifications(Array.isArray(notificationsData) ? notificationsData : []);
      } catch (err) {
        setError(err.message || "Erro ao carregar dashboard.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayName = profile?.display_name || "Utilizador";
  const firstName = displayName.split(" ")[0] || displayName;

  const totalExercises = progressEntries.length;
  const totalPlanItems = plan?.items?.length || 0;

  const totalMinutes = useMemo(() => {
    return progressEntries.reduce(
      (sum, item) => sum + Number(item.duration_minutes || 0),
      0
    );
  }, [progressEntries]);

  const currentWeekCount = useMemo(() => {
    const currentWeek = getWeekLabel(new Date().toISOString());

    return progressEntries.filter(
      (entry) => getWeekLabel(entry.performed_at) === currentWeek
    ).length;
  }, [progressEntries]);

  const completedPlanItemsCount = useMemo(() => {
    if (!plan?.items?.length || !progressEntries.length) return 0;

    const activePlanItemIds = new Set(plan.items.map((item) => item.id));
    const completed = new Set();

    for (const entry of progressEntries) {
      if (activePlanItemIds.has(entry.plan_item)) {
        completed.add(entry.plan_item);
      }
    }

    return completed.size;
  }, [plan, progressEntries]);

  const progressPercent = useMemo(() => {
    if (!totalPlanItems) return 0;
    return Math.round((completedPlanItemsCount / totalPlanItems) * 100);
  }, [completedPlanItemsCount, totalPlanItems]);

  const unreadNotifications = useMemo(() => {
    return notifications.filter((item) => item?.is_read === false).length;
  }, [notifications]);

  const stats = gamification?.stats || {};
  const badges = gamification?.badges || [];
  const totalPoints = stats.total_points ?? 0;

  const statusText = plan?.is_active ? "Plano ativo" : "Sem plano ativo";
  const weeklyState = totalExercises > 0 ? "Boa evolução" : "Sem atividade";
  const progressMessage =
    totalPlanItems > 0
      ? `Tens ${completedPlanItemsCount} exercício(s) do plano com registo.`
      : "Ainda não tens exercícios ativos para acompanhar.";
  const weeklyMessage =
    totalExercises > 0
      ? "Manténs um ritmo estável esta semana. Continua assim para consolidar a tua evolução."
      : "Ainda não tens atividade registada esta semana. Completa uma sessão para começares a acompanhar a evolução.";
  const reminderMessage =
    unreadNotifications > 0
      ? "Tens atualizações pendentes. Verifica as notificações e mensagens para não perderes nada importante."
      : "Está tudo em dia. Continua atento às notificações para acompanhares novas atualizações.";

  async function handleLogout() {
    try {
      setLoggingOut(true);
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

          <div className="userArea" ref={menuRef}>
            <button
              className="userButton"
              onClick={() => setMenuOpen((prev) => !prev)}
              type="button"
            >
              Olá, {firstName}
              <span className="caret">{menuOpen ? "▴" : "▾"}</span>
            </button>

            {menuOpen && (
              <div className="dropdownMenu dashboardDropdownMenu">
                <Link to="/profile" onClick={() => setMenuOpen(false)}>
                  Ver perfil
                </Link>
                <Link to="/settings" onClick={() => setMenuOpen(false)}>
                  Definições
                </Link>
                <button
                  type="button"
                  className="dropdownLogoutBtn"
                  onClick={handleLogout}
                  disabled={loggingOut}
                >
                  {loggingOut ? "A terminar..." : "Terminar sessão"}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="content dashPrimePage">
          {loading && (
            <div className="dashPrimeNotice">
              <h3>A carregar dashboard...</h3>
              <p>A obter os dados reais da tua conta.</p>
            </div>
          )}

          {error && !loading && (
            <div className="dashPrimeNotice dashPrimeNoticeError">
              <h3>Erro</h3>
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && (
            <>
              <section className="dashPrimeHero">
                <div className="dashPrimeHeroLeft">
                  <div className="dashPrimeHeroTop">
                    <span className="dashPrimeOverline">Painel principal</span>
                    <span
                      className={`dashPrimeStatus ${
                        plan?.is_active ? "isActive" : "isInactive"
                      }`}
                    >
                      {statusText}
                    </span>
                  </div>

                  <h1 className="dashPrimeTitle">
                    Bem-vindo de volta, {firstName}
                  </h1>

                  <p className="dashPrimeSubtitle">
                    Acompanha o teu plano, mantém a consistência e segue a tua
                    evolução com uma visão clara do teu progresso diário e semanal.
                  </p>

                  <div className="dashPrimeKpiRow">
                    <div className="dashPrimeKpiCard">
                      <span>Exercícios</span>
                      <strong>{totalExercises}</strong>
                    </div>

                    <div className="dashPrimeKpiCard">
                      <span>Tempo total</span>
                      <strong>{totalMinutes} min</strong>
                    </div>

                    <div className="dashPrimeKpiCard">
                      <span>Notificações</span>
                      <strong>{unreadNotifications}</strong>
                    </div>
                  </div>
                </div>

                <div className="dashPrimeHeroRight">
                  <div className="dashPrimeFocusCard">
                    <div className="dashPrimeFocusLabel">Foco atual</div>
                    <div className="dashPrimeFocusValue">
                      {plan?.title || "Sem plano ativo"}
                    </div>
                    <p className="dashPrimeFocusText">
                      {plan?.is_active
                        ? "Tens um plano em curso. Mantém o registo das sessões para acompanhar melhor a tua evolução."
                        : "Ainda não existe um plano ativo associado à tua conta neste momento."}
                    </p>

                    <div className="dashPrimeFocusMeta">
                      <div>
                        <span>Estado</span>
                        <strong>{plan?.is_active ? "Ativo" : "Inativo"}</strong>
                      </div>
                      <div>
                        <span>Itens</span>
                        <strong>{totalPlanItems}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="dashPrimeTopCards">
                <article className="dashPrimePanelCard dashPrimeProgressCard">
                  <div className="dashPrimeCardHead">
                    <h3>Progresso geral</h3>
                    <span className="dashPrimeChip">Plano atual</span>
                  </div>

                  <div className="dashPrimeBigNumber">{progressPercent}%</div>
                  <div className="dashPrimeBigLabel">Concluído</div>

                  <div className="dashPrimeBar">
                    <div
                      className="dashPrimeBarFill"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  <div className="dashPrimeSoftText">
                    {completedPlanItemsCount} de {totalPlanItems} exercícios com registo
                  </div>

                  <div className="dashPrimeInlineNote">{progressMessage}</div>
                </article>

                <article className="dashPrimePanelCard">
                  <div className="dashPrimeCardHead">
                    <h3>Plano atual</h3>
                    <span className="dashPrimeChip">
                      {totalPlanItems} item{totalPlanItems !== 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="dashPrimeDataRows">
                    <div className="dashPrimeDataRow">
                      <span>Plano</span>
                      <strong>{plan?.title || "Sem plano ativo"}</strong>
                    </div>

                    <div className="dashPrimeDataRow">
                      <span>Sessões esta semana</span>
                      <strong>{currentWeekCount}</strong>
                    </div>

                    <div className="dashPrimeDataRow">
                      <span>Estado</span>
                      <strong>{plan?.is_active ? "Ativo" : "Inativo"}</strong>
                    </div>
                  </div>
                </article>

                <article className="dashPrimePanelCard">
                  <div className="dashPrimeCardHead">
                    <h3>Motivação</h3>
                    <span className="dashPrimeChip">Gamificação</span>
                  </div>

                  <div className="dashPrimeMotivationWrap">
                    <div className="dashPrimeMetricMini">
                      <span>Badges</span>
                      <strong>{badges.length}</strong>
                    </div>

                    <div className="dashPrimeMetricMini">
                      <span>Pontos</span>
                      <strong>{totalPoints}</strong>
                    </div>
                  </div>

                  <div className="dashPrimeScoreBlock">
                    <div className="dashPrimeScoreLine">
                      <span>Desempenho acumulado</span>
                      <strong>{totalPoints} pts</strong>
                    </div>
                    <div className="dashPrimeBar dashPrimeBarThin">
                      <div
                        className="dashPrimeBarFill"
                        style={{
                          width: `${Math.max(8, Math.min(100, totalPoints % 101))}%`,
                        }}
                      />
                    </div>
                    <p className="dashPrimeSoftText">
                      Continua consistente para reforçar a tua progressão na plataforma.
                    </p>
                  </div>
                </article>
              </section>

              <section className="dashPrimeSectionTitleWrap">
                <div>
                  <h2 className="dashPrimeSectionTitle">Ações rápidas</h2>
                  <p className="dashPrimeSectionSub">
                    Acessos diretos às áreas mais importantes do teu dia
                  </p>
                </div>
              </section>

              <section className="dashPrimeActionsGrid">
                <Link to="/patient/plan" className="dashPrimeActionCard">
                  <div className="dashPrimeActionTop">
                    <span className="dashPrimeActionPill">Plano</span>
                  </div>
                  <h3>Consultar plano</h3>
                  <p>Ver exercícios, séries e sessões do plano atual.</p>
                  <span className="dashPrimeActionLink">Abrir plano</span>
                </Link>

                <Link to="/patient/gamification" className="dashPrimeActionCard">
                  <div className="dashPrimeActionTop">
                    <span className="dashPrimeActionPill">Progresso</span>
                  </div>
                  <h3>Gamificação</h3>
                  <p>Acompanhar pontos, badges, desafios e recompensas.</p>
                  <span className="dashPrimeActionLink">Ver gamificação</span>
                </Link>

                <Link to="/messages" className="dashPrimeActionCard">
                  <div className="dashPrimeActionTop">
                    <span className="dashPrimeActionPill">Comunicação</span>
                  </div>
                  <h3>Mensagem ao terapeuta</h3>
                  <p>Enviar dúvidas, feedback ou acompanhar orientações.</p>
                  <span className="dashPrimeActionLink">Abrir mensagens</span>
                </Link>
              </section>

              <section className="dashPrimeBottomGrid">
                <article className="dashPrimePanelCard">
                  <div className="dashPrimeCardHead">
                    <h3>Resumo da semana</h3>
                    <span className="dashPrimeChip">Atual</span>
                  </div>

                  <div className="dashPrimeSummaryGrid">
                    <div className="dashPrimeSummaryBox">
                      <span>Exercícios realizados</span>
                      <strong>{totalExercises}</strong>
                    </div>

                    <div className="dashPrimeSummaryBox">
                      <span>Tempo total</span>
                      <strong>{totalMinutes} min</strong>
                    </div>

                    <div className="dashPrimeSummaryBox">
                      <span>Estado atual</span>
                      <strong>{weeklyState}</strong>
                    </div>
                  </div>

                  <div className="dashPrimeMessageBox">
                    <p>{weeklyMessage}</p>
                  </div>
                </article>

                <article className="dashPrimePanelCard">
                  <div className="dashPrimeCardHead">
                    <h3>Lembrete diário</h3>
                    <span className="dashPrimeChip">Hoje</span>
                  </div>

                  <div className="dashPrimeReminderCard">
                    <div className="dashPrimeReminderHeader">
                      <div className="dashPrimeReminderCounter">
                        {unreadNotifications}
                      </div>
                      <div>
                        <h4>
                          {unreadNotifications > 0
                            ? "Notificações pendentes"
                            : "Sem notificações pendentes"}
                        </h4>
                        <p>{reminderMessage}</p>
                      </div>
                    </div>

                    <div className="dashPrimeReminderButtons">
                      <Link
                        to="/notifications"
                        className="dashPrimeBtn dashPrimeBtnPrimary"
                      >
                        Ver notificações
                      </Link>
                      <Link
                        to="/messages"
                        className="dashPrimeBtn dashPrimeBtnGhost"
                      >
                        Ir para mensagens
                      </Link>
                    </div>
                  </div>
                </article>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}