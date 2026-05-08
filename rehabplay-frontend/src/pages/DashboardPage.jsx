import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppPreferences } from "../context/AppPreferencesContext";
import { fetchMyProfile, logout } from "../api/auth";
import {
  fetchActivePlan,
  fetchMyProgress,
  fetchMyGamification,
} from "../api/patient";
import { fetchNotifications } from "../api/notifications";

const dashboardText = {
  "pt-PT": {
    noDate: "Sem data",
    week: "Semana",
    loadingTitle: "A carregar dashboard...",
    loadingText: "A obter os dados reais da tua conta.",
    error: "Erro",
    hello: "Olá",
    viewProfile: "Ver perfil",
    settings: "Definições",
    logout: "Terminar sessão",
    loggingOut: "A terminar...",
    activePlan: "Plano ativo",
    noActivePlan: "Sem plano ativo",
    mainPanel: "Painel principal",
    welcome: "Bem-vindo de volta",
    subtitle:
      "Acompanha o teu plano, mantém a consistência e segue a tua evolução com uma visão clara do teu progresso diário e semanal.",
    exercises: "Exercícios",
    totalTime: "Tempo total",
    notifications: "Notificações",
    currentFocus: "Foco atual",
    noPlan: "Sem plano ativo",
    focusActive:
      "Tens um plano em curso. Mantém o registo das sessões para acompanhar melhor a tua evolução.",
    focusInactive:
      "Ainda não existe um plano ativo associado à tua conta neste momento.",
    state: "Estado",
    active: "Ativo",
    inactive: "Inativo",
    items: "Itens",
    item: "item",
    generalProgress: "Progresso geral",
    currentPlan: "Plano atual",
    completed: "Concluído",
    registeredExercises: "exercícios com registo",
    progressMessageWithPlan: "Tens {count} exercício(s) do plano com registo.",
    progressMessageNoPlan: "Ainda não tens exercícios ativos para acompanhar.",
    sessionsThisWeek: "Sessões esta semana",
    motivation: "Motivação",
    gamification: "Gamificação",
    badges: "Badges",
    points: "Pontos",
    accumulatedPerformance: "Desempenho acumulado",
    motivationText:
      "Continua consistente para reforçar a tua progressão na plataforma.",
    quickActions: "Ações rápidas",
    quickActionsSub: "Acessos diretos às áreas mais importantes do teu dia",
    plan: "Plano",
    consultPlan: "Consultar plano",
    consultPlanText: "Ver exercícios, séries e sessões do plano atual.",
    openPlan: "Abrir plano",
    progress: "Progresso",
    gamificationText: "Acompanhar pontos, badges, desafios e recompensas.",
    seeGamification: "Ver gamificação",
    communication: "Comunicação",
    messageTherapist: "Mensagem ao terapeuta",
    messageTherapistText: "Enviar dúvidas, feedback ou acompanhar orientações.",
    openMessages: "Abrir mensagens",
    weeklySummary: "Resumo da semana",
    current: "Atual",
    performedExercises: "Exercícios realizados",
    currentState: "Estado atual",
    goodEvolution: "Boa evolução",
    noActivity: "Sem atividade",
    weeklyMessageActive:
      "Manténs um ritmo estável esta semana. Continua assim para consolidar a tua evolução.",
    weeklyMessageInactive:
      "Ainda não tens atividade registada esta semana. Completa uma sessão para começares a acompanhar a evolução.",
    dailyReminder: "Lembrete diário",
    today: "Hoje",
    pendingNotifications: "Notificações pendentes",
    noPendingNotifications: "Sem notificações pendentes",
    reminderActive:
      "Tens atualizações pendentes. Verifica as notificações e mensagens para não perderes nada importante.",
    reminderInactive:
      "Está tudo em dia. Continua atento às notificações para acompanhares novas atualizações.",
    seeNotifications: "Ver notificações",
    goMessages: "Ir para mensagens",
    errorLoad: "Erro ao carregar dashboard.",
    errorLogout: "Erro ao terminar sessão.",
  },
  en: {
    noDate: "No date",
    week: "Week",
    loadingTitle: "Loading dashboard...",
    loadingText: "Getting your real account data.",
    error: "Error",
    hello: "Hi",
    viewProfile: "View profile",
    settings: "Settings",
    logout: "Sign out",
    loggingOut: "Signing out...",
    activePlan: "Active plan",
    noActivePlan: "No active plan",
    mainPanel: "Main panel",
    welcome: "Welcome back",
    subtitle:
      "Track your plan, stay consistent and follow your progress with a clear daily and weekly overview.",
    exercises: "Exercises",
    totalTime: "Total time",
    notifications: "Notifications",
    currentFocus: "Current focus",
    noPlan: "No active plan",
    focusActive:
      "You have an active plan. Keep logging your sessions to monitor your progress more clearly.",
    focusInactive: "There is no active plan linked to your account at the moment.",
    state: "Status",
    active: "Active",
    inactive: "Inactive",
    items: "Items",
    item: "item",
    generalProgress: "Overall progress",
    currentPlan: "Current plan",
    completed: "Completed",
    registeredExercises: "exercises logged",
    progressMessageWithPlan: "You have {count} plan exercise(s) logged.",
    progressMessageNoPlan: "You do not have active exercises to track yet.",
    sessionsThisWeek: "Sessions this week",
    motivation: "Motivation",
    gamification: "Gamification",
    badges: "Badges",
    points: "Points",
    accumulatedPerformance: "Accumulated performance",
    motivationText: "Keep consistent to strengthen your progress on the platform.",
    quickActions: "Quick actions",
    quickActionsSub: "Direct access to the most important areas of your day",
    plan: "Plan",
    consultPlan: "View plan",
    consultPlanText: "See exercises, sets and sessions from your current plan.",
    openPlan: "Open plan",
    progress: "Progress",
    gamificationText: "Track points, badges, challenges and rewards.",
    seeGamification: "View gamification",
    communication: "Communication",
    messageTherapist: "Message therapist",
    messageTherapistText: "Send questions, feedback or follow guidance.",
    openMessages: "Open messages",
    weeklySummary: "Weekly summary",
    current: "Current",
    performedExercises: "Exercises completed",
    currentState: "Current status",
    goodEvolution: "Good progress",
    noActivity: "No activity",
    weeklyMessageActive:
      "You are keeping a steady rhythm this week. Keep going to consolidate your progress.",
    weeklyMessageInactive:
      "You have no activity logged this week yet. Complete a session to start tracking your progress.",
    dailyReminder: "Daily reminder",
    today: "Today",
    pendingNotifications: "Pending notifications",
    noPendingNotifications: "No pending notifications",
    reminderActive:
      "You have pending updates. Check your notifications and messages so you do not miss anything important.",
    reminderInactive:
      "Everything is up to date. Keep an eye on notifications for future updates.",
    seeNotifications: "View notifications",
    goMessages: "Go to messages",
    errorLoad: "Error loading dashboard.",
    errorLogout: "Error signing out.",
  },
};

function getWeekLabel(dateString, t) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return t.noDate;

  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const diffDays = Math.floor((date - startOfYear) / 86400000);
  const week = Math.ceil((diffDays + startOfYear.getDay() + 1) / 7);

  return `${t.week} ${week}`;
}

function replaceCount(template, count) {
  return template.replace("{count}", String(count));
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const { language } = useAppPreferences();
  const t = dashboardText[language] || dashboardText["pt-PT"];

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
        setError(err.message || t.errorLoad);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [t.errorLoad]);

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
    const currentWeek = getWeekLabel(new Date().toISOString(), t);

    return progressEntries.filter(
      (entry) => getWeekLabel(entry.performed_at, t) === currentWeek
    ).length;
  }, [progressEntries, t]);

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

  const statusText = plan?.is_active ? t.activePlan : t.noActivePlan;
  const weeklyState = totalExercises > 0 ? t.goodEvolution : t.noActivity;

  const progressMessage =
    totalPlanItems > 0
      ? replaceCount(t.progressMessageWithPlan, completedPlanItemsCount)
      : t.progressMessageNoPlan;

  const weeklyMessage =
    totalExercises > 0 ? t.weeklyMessageActive : t.weeklyMessageInactive;

  const reminderMessage =
    unreadNotifications > 0 ? t.reminderActive : t.reminderInactive;

  async function handleLogout() {
    try {
      setLoggingOut(true);
      await logout();
      navigate("/login");
    } catch (err) {
      setError(err.message || t.errorLogout);
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
              {t.hello}, {firstName}
              <span className="caret">{menuOpen ? "▴" : "▾"}</span>
            </button>

            {menuOpen && (
              <div className="dropdownMenu dashboardDropdownMenu">
                <Link to="/profile" onClick={() => setMenuOpen(false)}>
                  {t.viewProfile}
                </Link>

                <Link to="/settings" onClick={() => setMenuOpen(false)}>
                  {t.settings}
                </Link>

                <button
                  type="button"
                  className="dropdownLogoutBtn"
                  onClick={handleLogout}
                  disabled={loggingOut}
                >
                  {loggingOut ? t.loggingOut : t.logout}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="content dashPrimePage">
          {loading && (
            <div className="dashPrimeNotice">
              <h3>{t.loadingTitle}</h3>
              <p>{t.loadingText}</p>
            </div>
          )}

          {error && !loading && (
            <div className="dashPrimeNotice dashPrimeNoticeError">
              <h3>{t.error}</h3>
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && (
            <>
              <section className="dashPrimeHero">
                <div className="dashPrimeHeroLeft">
                  <div className="dashPrimeHeroTop">
                    <span className="dashPrimeOverline">{t.mainPanel}</span>
                    <span
                      className={`dashPrimeStatus ${
                        plan?.is_active ? "isActive" : "isInactive"
                      }`}
                    >
                      {statusText}
                    </span>
                  </div>

                  <h1 className="dashPrimeTitle">
                    {t.welcome}, {firstName}
                  </h1>

                  <p className="dashPrimeSubtitle">{t.subtitle}</p>

                  <div className="dashPrimeKpiRow">
                    <div className="dashPrimeKpiCard">
                      <span>{t.exercises}</span>
                      <strong>{totalExercises}</strong>
                    </div>

                    <div className="dashPrimeKpiCard">
                      <span>{t.totalTime}</span>
                      <strong>{totalMinutes} min</strong>
                    </div>

                    <div className="dashPrimeKpiCard">
                      <span>{t.notifications}</span>
                      <strong>{unreadNotifications}</strong>
                    </div>
                  </div>
                </div>

                <div className="dashPrimeHeroRight">
                  <div className="dashPrimeFocusCard">
                    <div className="dashPrimeFocusLabel">{t.currentFocus}</div>
                    <div className="dashPrimeFocusValue">
                      {plan?.title || t.noPlan}
                    </div>
                    <p className="dashPrimeFocusText">
                      {plan?.is_active ? t.focusActive : t.focusInactive}
                    </p>

                    <div className="dashPrimeFocusMeta">
                      <div>
                        <span>{t.state}</span>
                        <strong>{plan?.is_active ? t.active : t.inactive}</strong>
                      </div>
                      <div>
                        <span>{t.items}</span>
                        <strong>{totalPlanItems}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="dashPrimeTopCards">
                <article className="dashPrimePanelCard dashPrimeProgressCard">
                  <div className="dashPrimeCardHead">
                    <h3>{t.generalProgress}</h3>
                    <span className="dashPrimeChip">{t.currentPlan}</span>
                  </div>

                  <div className="dashPrimeBigNumber">{progressPercent}%</div>
                  <div className="dashPrimeBigLabel">{t.completed}</div>

                  <div className="dashPrimeBar">
                    <div
                      className="dashPrimeBarFill"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  <div className="dashPrimeSoftText">
                    {completedPlanItemsCount} de {totalPlanItems}{" "}
                    {t.registeredExercises}
                  </div>

                  <div className="dashPrimeInlineNote">{progressMessage}</div>
                </article>

                <article className="dashPrimePanelCard">
                  <div className="dashPrimeCardHead">
                    <h3>{t.currentPlan}</h3>
                    <span className="dashPrimeChip">
                      {totalPlanItems} {totalPlanItems === 1 ? t.item : t.items}
                    </span>
                  </div>

                  <div className="dashPrimeDataRows">
                    <div className="dashPrimeDataRow">
                      <span>{t.plan}</span>
                      <strong>{plan?.title || t.noPlan}</strong>
                    </div>

                    <div className="dashPrimeDataRow">
                      <span>{t.sessionsThisWeek}</span>
                      <strong>{currentWeekCount}</strong>
                    </div>

                    <div className="dashPrimeDataRow">
                      <span>{t.state}</span>
                      <strong>{plan?.is_active ? t.active : t.inactive}</strong>
                    </div>
                  </div>
                </article>

                <article className="dashPrimePanelCard">
                  <div className="dashPrimeCardHead">
                    <h3>{t.motivation}</h3>
                    <span className="dashPrimeChip">{t.gamification}</span>
                  </div>

                  <div className="dashPrimeMotivationWrap">
                    <div className="dashPrimeMetricMini">
                      <span>{t.badges}</span>
                      <strong>{badges.length}</strong>
                    </div>

                    <div className="dashPrimeMetricMini">
                      <span>{t.points}</span>
                      <strong>{totalPoints}</strong>
                    </div>
                  </div>

                  <div className="dashPrimeScoreBlock">
                    <div className="dashPrimeScoreLine">
                      <span>{t.accumulatedPerformance}</span>
                      <strong>{totalPoints} pts</strong>
                    </div>
                    <div className="dashPrimeBar dashPrimeBarThin">
                      <div
                        className="dashPrimeBarFill"
                        style={{
                          width: `${Math.max(
                            8,
                            Math.min(100, totalPoints % 101)
                          )}%`,
                        }}
                      />
                    </div>
                    <p className="dashPrimeSoftText">{t.motivationText}</p>
                  </div>
                </article>
              </section>

              <section className="dashPrimeSectionTitleWrap">
                <div>
                  <h2 className="dashPrimeSectionTitle">{t.quickActions}</h2>
                  <p className="dashPrimeSectionSub">{t.quickActionsSub}</p>
                </div>
              </section>

              <section className="dashPrimeActionsGrid">
                <Link to="/patient/plan" className="dashPrimeActionCard">
                  <div className="dashPrimeActionTop">
                    <span className="dashPrimeActionPill">{t.plan}</span>
                  </div>
                  <h3>{t.consultPlan}</h3>
                  <p>{t.consultPlanText}</p>
                  <span className="dashPrimeActionLink">{t.openPlan}</span>
                </Link>

                <Link to="/patient/gamification" className="dashPrimeActionCard">
                  <div className="dashPrimeActionTop">
                    <span className="dashPrimeActionPill">{t.progress}</span>
                  </div>
                  <h3>{t.gamification}</h3>
                  <p>{t.gamificationText}</p>
                  <span className="dashPrimeActionLink">{t.seeGamification}</span>
                </Link>

                <Link to="/messages" className="dashPrimeActionCard">
                  <div className="dashPrimeActionTop">
                    <span className="dashPrimeActionPill">{t.communication}</span>
                  </div>
                  <h3>{t.messageTherapist}</h3>
                  <p>{t.messageTherapistText}</p>
                  <span className="dashPrimeActionLink">{t.openMessages}</span>
                </Link>
              </section>

              <section className="dashPrimeBottomGrid">
                <article className="dashPrimePanelCard">
                  <div className="dashPrimeCardHead">
                    <h3>{t.weeklySummary}</h3>
                    <span className="dashPrimeChip">{t.current}</span>
                  </div>

                  <div className="dashPrimeSummaryGrid">
                    <div className="dashPrimeSummaryBox">
                      <span>{t.performedExercises}</span>
                      <strong>{totalExercises}</strong>
                    </div>

                    <div className="dashPrimeSummaryBox">
                      <span>{t.totalTime}</span>
                      <strong>{totalMinutes} min</strong>
                    </div>

                    <div className="dashPrimeSummaryBox">
                      <span>{t.currentState}</span>
                      <strong>{weeklyState}</strong>
                    </div>
                  </div>

                  <div className="dashPrimeMessageBox">
                    <p>{weeklyMessage}</p>
                  </div>
                </article>

                <article className="dashPrimePanelCard">
                  <div className="dashPrimeCardHead">
                    <h3>{t.dailyReminder}</h3>
                    <span className="dashPrimeChip">{t.today}</span>
                  </div>

                  <div className="dashPrimeReminderCard">
                    <div className="dashPrimeReminderHeader">
                      <div className="dashPrimeReminderCounter">
                        {unreadNotifications}
                      </div>
                      <div>
                        <h4>
                          {unreadNotifications > 0
                            ? t.pendingNotifications
                            : t.noPendingNotifications}
                        </h4>
                        <p>{reminderMessage}</p>
                      </div>
                    </div>

                    <div className="dashPrimeReminderButtons">
                      <Link
                        to="/notifications"
                        className="dashPrimeBtn dashPrimeBtnPrimary"
                      >
                        {t.seeNotifications}
                      </Link>
                      <Link
                        to="/messages"
                        className="dashPrimeBtn dashPrimeBtnGhost"
                      >
                        {t.goMessages}
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