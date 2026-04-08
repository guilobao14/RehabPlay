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

  const totalPlanItems = plan?.items?.length || 0;

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

        <div className="content">
          {loading && (
            <div className="dashboardCard">
              <div className="dashboardCardHeader">
                <h3 className="dashboardCardTitle">A carregar...</h3>
              </div>
              <p className="dashboardSectionSub">
                A obter os dados reais do teu dashboard.
              </p>
            </div>
          )}

          {error && !loading && (
            <div className="dashboardCard">
              <div className="dashboardCardHeader">
                <h3 className="dashboardCardTitle">Erro</h3>
              </div>
              <p className="dashboardSectionSub">{error}</p>
            </div>
          )}

          {!loading && !error && (
            <>
              <div className="dashboardHero">
                <div>
                  <h1 className="dashboardTitle">
                    Bem-vindo de volta, {firstName}
                  </h1>
                  <p className="dashboardSubtitle">
                    Acompanha o teu plano, mantém a consistência e segue a tua
                    evolução na reabilitação.
                  </p>
                </div>

                <div className="dashboardHeroBadge">
                  {plan?.is_active ? "Plano ativo" : "Sem plano ativo"}
                </div>
              </div>

              <div className="dashboardTopGrid">
                <div className="dashboardCard progressCard">
                  <div className="dashboardCardHeader">
                    <h3 className="dashboardCardTitle">Progresso geral</h3>
                    <span className="dashboardSmallTag">Plano atual</span>
                  </div>

                  <div className="dashboardProgressValue">
                    {progressPercent}%
                  </div>
                  <div className="dashboardProgressText">Concluído</div>

                  <div className="dashboardProgressBar">
                    <div
                      className="dashboardProgressFill"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  <div className="dashboardMutedLine">
                    {completedPlanItemsCount} de {totalPlanItems} exercícios com
                    registo
                  </div>
                </div>

                <div className="dashboardCard">
                  <div className="dashboardCardHeader">
                    <h3 className="dashboardCardTitle">Plano atual</h3>
                    <span className="dashboardSmallTag">
                      {totalPlanItems} itens
                    </span>
                  </div>

                  <div className="dashboardInfoList">
                    <div className="dashboardInfoItem">
                      <span>Plano</span>
                      <strong>{plan?.title || "Sem plano ativo"}</strong>
                    </div>

                    <div className="dashboardInfoItem">
                      <span>Sessões esta semana</span>
                      <strong>{currentWeekCount}</strong>
                    </div>

                    <div className="dashboardInfoItem">
                      <span>Estado</span>
                      <strong>{plan?.is_active ? "Ativo" : "Inativo"}</strong>
                    </div>
                  </div>
                </div>

                <div className="dashboardCard motivationCard">
                  <div className="dashboardCardHeader">
                    <h3 className="dashboardCardTitle">Motivação</h3>
                    <span className="dashboardSmallTag">Gamificação</span>
                  </div>

                  <div className="dashboardMotivationStats">
                    <div className="dashboardMotivationItem">
                      <div className="dashboardMotivationValue">
                        {badges.length}
                      </div>
                      <div className="dashboardMotivationLabel">Badges</div>
                    </div>

                    <div className="dashboardMotivationItem">
                      <div className="dashboardMotivationValue">
                        {stats.total_points ?? 0}
                      </div>
                      <div className="dashboardMotivationLabel">Pontos</div>
                    </div>
                  </div>

                  <div className="dashboardStars">🏅 ⭐</div>
                </div>
              </div>

              <div className="dashboardSectionHeader">
                <h2 className="dashboardSectionTitle">Ações rápidas</h2>
                <p className="dashboardSectionSub">
                  Atalhos para as ações mais importantes do teu dia
                </p>
              </div>

              <div className="dashboardActionsGrid">
                <Link to="/patient/plan" className="dashboardActionCard">
                  <div className="dashboardActionIcon">📋</div>
                  <div className="dashboardActionTitle">Consultar plano</div>
                  <div className="dashboardActionText">
                    Ver exercícios, séries e sessões do plano atual.
                  </div>
                </Link>

                <Link to="/patient/gamification" className="dashboardActionCard">
                  <div className="dashboardActionIcon">⭐</div>
                  <div className="dashboardActionTitle">Gamificação</div>
                  <div className="dashboardActionText">
                    Acompanhar pontos, badges, desafios e recompensas.
                  </div>
                </Link>

                <Link to="/messages" className="dashboardActionCard">
                  <div className="dashboardActionIcon">💬</div>
                  <div className="dashboardActionTitle">Mensagem ao terapeuta</div>
                  <div className="dashboardActionText">
                    Enviar dúvidas, feedback ou acompanhar orientações.
                  </div>
                </Link>
              </div>

              <div className="dashboardBottomGrid">
                <div className="dashboardCard">
                  <div className="dashboardCardHeader">
                    <h3 className="dashboardCardTitle">Resumo da semana</h3>
                  </div>

                  <div className="dashboardInfoList">
                    <div className="dashboardInfoItem">
                      <span>Exercícios realizados</span>
                      <strong>{totalExercises}</strong>
                    </div>
                    <div className="dashboardInfoItem">
                      <span>Tempo total</span>
                      <strong>{totalMinutes} min</strong>
                    </div>
                    <div className="dashboardInfoItem">
                      <span>Estado atual</span>
                      <strong>
                        {totalExercises ? "Boa evolução" : "Sem atividade"}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="dashboardCard">
                  <div className="dashboardCardHeader">
                    <h3 className="dashboardCardTitle">Lembrete diário</h3>
                  </div>

                  <div className="dashboardReminderBox">
                    <div className="dashboardReminderTitle">
                      Tens {unreadNotifications} notificações por ver
                    </div>
                    <div className="dashboardReminderText">
                      Acompanha as tuas mensagens, alertas e atualizações da
                      plataforma para não perderes nada importante.
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}