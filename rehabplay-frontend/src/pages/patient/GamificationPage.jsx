import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import PatientSubnav from "../../components/PatientSubnav";
import {
  fetchMyGamification,
  fetchLeaderboard,
  fetchChallenges,
  fetchRewards,
  redeemReward,
} from "../../api/patient";
import { useAppPreferences } from "../../context/AppPreferencesContext.jsx";

const gamificationText = {
  "pt-PT": {
    title: "Gamificação",
    subtitle:
      "Acompanha pontos, níveis, badges, desafios e recompensas enquanto manténs a regularidade na reabilitação.",

    loadingTitle: "A carregar...",
    loadingText: "A obter os teus dados de gamificação.",
    errorTitle: "Erro",
    loadError: "Erro ao carregar gamificação.",

    totalPoints: "Pontuação total",
    totalPointsText: "Pontos acumulados através da atividade na plataforma.",
    level: "Nível",
    levelText: "Representa a tua evolução dentro da RehabPlay.",
    currentStreak: "Sequência atual",
    currentStreakText: "Dias consecutivos com atividade registada.",
    days: "dias",
    pointsShort: "pts",

    mainSummary: "Resumo principal",
    today: "Hoje",
    bestStreak: "Melhor sequência",
    lastActivity: "Última atividade",
    unlockedBadges: "Badges conquistadas",

    ranking: "Ranking",
    leaderboard: "Leaderboard",
    noData: "Sem dados",
    user: "Utilizador",

    badgesCollectionTitle: "Badges",
    badgesCollectionSubtitle:
      "Consulta as badges conquistadas e as que ainda podes desbloquear.",
    noBadgesTitle: "Sem badges ainda",
    noBadgesText:
      "Continua a usar a plataforma para começares a desbloquear conquistas.",
    all: "Todas",
    earned: "Conquistadas",
    lockedOnly: "Por conquistar",
    locked: "Bloqueada",
    unlocked: "Desbloqueada",
    progressToUnlock: "Progresso para desbloquear",
    showMoreBadges: "Ver todas",
    showLessBadges: "Mostrar menos",

    challengesTitle: "Desafios",
    challengesSubtitle: "Acompanha o teu progresso nos desafios ativos.",
    noChallengesTitle: "Sem desafios",
    noChallengesText: "Não existem desafios para este filtro.",
    allChallenges: "Todos",
    activeChallenges: "Ativos",
    completedChallengesFilter: "Concluídos",
    progress: "Progresso",
    completedAt: "Concluído em",
    activeUntil: "Ativo até",

    rewardsTitle: "Recompensas",
    rewardsSubtitle: "Usa os teus pontos para resgatar recompensas disponíveis.",
    noRewardsTitle: "Sem recompensas",
    noRewardsText: "Não existem recompensas para este filtro.",
    allRewards: "Todas",
    availableRewardsFilter: "Disponíveis",
    lockedRewardsFilter: "Bloqueadas",
    redeemedRewardsFilter: "Resgatadas",
    showMoreRewards: "Ver todas",
    showLessRewards: "Mostrar menos",
    available: "Disponível",
    redeemed: "Resgatada",
    redeeming: "A resgatar...",
    redeem: "Resgatar",
    insufficientPoints: "Pontos insuficientes",
    redeemSuccess: "Recompensa resgatada com sucesso.",
    redeemError: "Erro ao resgatar recompensa.",

    latestRedemptions: "Últimos resgates",
    noRedemptions: "Sem resgates ainda",

    quickAction: "Ação rápida",
    keepGoing: "Continua a evoluir",
    keepGoingText:
      "Completa exercícios e mantém regularidade para subires de nível e desbloqueares mais recompensas.",
    seePlan: "Ver plano",

    highlighted: "Em destaque",
    availableRewards: "recompensas",
    noDate: "-",
  },

  en: {
    title: "Gamification",
    subtitle:
      "Track points, levels, badges, challenges and rewards while keeping consistency in your rehabilitation.",

    loadingTitle: "Loading...",
    loadingText: "Fetching your gamification data.",
    errorTitle: "Error",
    loadError: "Error loading gamification.",

    totalPoints: "Total points",
    totalPointsText: "Points earned through activity on the platform.",
    level: "Level",
    levelText: "Represents your progression inside RehabPlay.",
    currentStreak: "Current streak",
    currentStreakText: "Consecutive days with registered activity.",
    days: "days",
    pointsShort: "pts",

    mainSummary: "Main summary",
    today: "Today",
    bestStreak: "Best streak",
    lastActivity: "Last activity",
    unlockedBadges: "Unlocked badges",

    ranking: "Ranking",
    leaderboard: "Leaderboard",
    noData: "No data",
    user: "User",

    badgesCollectionTitle: "Badges",
    badgesCollectionSubtitle:
      "Check unlocked badges and the ones you can still unlock.",
    noBadgesTitle: "No badges yet",
    noBadgesText: "Keep using the platform to start unlocking achievements.",
    all: "All",
    earned: "Unlocked",
    lockedOnly: "Locked",
    locked: "Locked",
    unlocked: "Unlocked",
    progressToUnlock: "Unlock progress",
    showMoreBadges: "View all",
    showLessBadges: "Show less",

    challengesTitle: "Challenges",
    challengesSubtitle: "Track your progress in active challenges.",
    noChallengesTitle: "No challenges",
    noChallengesText: "There are no challenges for this filter.",
    allChallenges: "All",
    activeChallenges: "Active",
    completedChallengesFilter: "Completed",
    progress: "Progress",
    completedAt: "Completed on",
    activeUntil: "Active until",

    rewardsTitle: "Rewards",
    rewardsSubtitle: "Use your points to redeem available rewards.",
    noRewardsTitle: "No rewards",
    noRewardsText: "There are no rewards for this filter.",
    allRewards: "All",
    availableRewardsFilter: "Available",
    lockedRewardsFilter: "Locked",
    redeemedRewardsFilter: "Redeemed",
    showMoreRewards: "View all",
    showLessRewards: "Show less",
    available: "Available",
    redeemed: "Redeemed",
    redeeming: "Redeeming...",
    redeem: "Redeem",
    insufficientPoints: "Not enough points",
    redeemSuccess: "Reward redeemed successfully.",
    redeemError: "Error redeeming reward.",

    latestRedemptions: "Latest redemptions",
    noRedemptions: "No redemptions yet",

    quickAction: "Quick action",
    keepGoing: "Keep progressing",
    keepGoingText:
      "Complete exercises and stay consistent to level up and unlock more rewards.",
    seePlan: "View plan",

    highlighted: "Highlighted",
    availableRewards: "rewards",
    noDate: "-",
  },
};

function translateBackendText(value, language, fallback = "") {
  if (!value) return fallback;

  let text = String(value);

  const ptToEn = {
    "Primeiro Registo": "First Record",
    "Regista o teu primeiro progresso.": "Log your first progress.",
    "Primeiros 5 Registos": "First 5 Records",
    "Regista progresso 5 vezes.": "Log progress 5 times.",
    "Rotina Inicial": "Initial Routine",
    "Regista progresso 10 vezes.": "Log progress 10 times.",
    "Consistência Forte": "Strong Consistency",
    "Regista progresso 20 vezes.": "Log progress 20 times.",

    "50 Pontos": "50 Points",
    "Atinge 50 pontos.": "Reach 50 points.",
    "Atingiste 50 pontos.": "Reach 50 points.",
    "100 Pontos": "100 Points",
    "Atinge 100 pontos.": "Reach 100 points.",
    "Atingiste 100 pontos.": "Reach 100 points.",
    "200 Pontos": "200 Points",
    "Atinge 200 pontos.": "Reach 200 points.",
    "Atingiste 200 pontos.": "Reach 200 points.",

    "Sequência de 3 Dias": "3 Day Streak",
    "Streak 3": "3 Day Streak",
    "Mantém uma sequência de 3 dias.": "Maintain a 3-day streak.",
    "3 dias seguidos a treinar.": "Train for 3 days in a row.",
    "Semana Consistente": "Consistent Week",
    "Mantém uma sequência de 7 dias.": "Maintain a 7-day streak.",
    "7 dias seguidos a treinar.": "Train for 7 days in a row.",

    "Primeiro Desafio": "First Challenge",
    "Completa o teu primeiro desafio.": "Complete your first challenge.",
    "Especialista em Desafios": "Challenge Specialist",
    "Completa 3 desafios.": "Complete 3 challenges.",

    "Primeiro exercício": "First exercise",
    "Primeira semana": "First week",
    "Consistência": "Consistency",
    "Sequência": "Streak",
    "Plano completo": "Completed plan",
    "Conquista": "Achievement",
    "Recompensa": "Reward",
    "Desafio": "Challenge",
    "Sem descrição": "No description",

    "3 treinos esta semana": "3 workouts this week",
    "Regista 3 progressos esta semana e ganha 20 pontos!":
      "Log 3 progress records this week and earn 20 points!",

    "Treinar 10 minutos esta semana": "Workout for 10 minutes this week",
    "Treinar 3 dias seguidos": "Workout for 3 days straight",
    "Treina durante 10 minutos esta semana": "Workout for 10 minutes this week",
    "Treina 3 dias seguidos": "Workout for 3 days straight",

    "Desbloquear Tema Premium": "Unlock Premium Theme",
    "Acesso a temas premium.": "Access to premium themes.",
    "Badge Motivacional": "Motivational Badge",
    "Recebe uma badge simbólica de motivação.":
      "Receive a symbolic motivational badge.",
    "Destaque no Perfil": "Profile Highlight",
    "Adiciona um destaque especial ao teu perfil.":
      "Add a special highlight to your profile.",
    "Título Campeão da Recuperação": "Recovery Champion Title",
    "Desbloqueia um título especial de recuperação.":
      "Unlock a special recovery title.",
    "Conquista Especial": "Special Achievement",
    "Recebe uma conquista especial pelo teu esforço.":
      "Receive a special achievement for your effort.",
  };

  const customEnToPt = {
    "Workout for 10 minutes this week": "Treinar 10 minutos esta semana",
    "Workout for 3 days straight": "Treinar 3 dias seguidos",
    "Log 3 progress records this week and earn 20 points!":
      "Regista 3 progressos esta semana e ganha 20 pontos!",
    "3 workouts this week": "3 treinos esta semana",
    "Unlock Premium Theme": "Desbloquear Tema Premium",
    "Access to premium themes.": "Acesso a temas premium.",
    "Access to premium themes": "Acesso a temas premium.",
    "Motivational Badge": "Badge Motivacional",
    "Receive a symbolic motivational badge.":
      "Recebe uma badge simbólica de motivação.",
    "Profile Highlight": "Destaque no Perfil",
    "Add a special highlight to your profile.":
      "Adiciona um destaque especial ao teu perfil.",
    "Recovery Champion Title": "Título Campeão da Recuperação",
    "Unlock a special recovery title.":
      "Desbloqueia um título especial de recuperação.",
    "Special Achievement": "Conquista Especial",
    "Receive a special achievement for your effort.":
      "Recebe uma conquista especial pelo teu esforço.",
  };

  const enToPt = {
    ...Object.fromEntries(Object.entries(ptToEn).map(([pt, en]) => [en, pt])),
    ...customEnToPt,
  };

  const dictionary = language === "en" ? ptToEn : enToPt;

  Object.entries(dictionary).forEach(([from, to]) => {
    text = text.replaceAll(from, to);
  });

  return text;
}

function formatDate(value, language, text) {
  if (!value) return text.noDate;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString(language === "en" ? "en-GB" : "pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function capProgress(current, target) {
  const currentNumber = Number(current || 0);
  const targetNumber = Number(target || 0);

  if (!targetNumber || targetNumber <= 0) {
    return currentNumber;
  }

  return Math.min(currentNumber, targetNumber);
}

function challengeProgressPercent(challenge) {
  const target = Number(challenge.goal_target || 0);
  const current = Number(
    challenge.user_progress_value ?? challenge.progress_value ?? 0
  );

  if (!target || target <= 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}

export default function GamificationPage() {
  const { language } = useAppPreferences();
  const text = gamificationText[language] || gamificationText["pt-PT"];
  const location = useLocation();

  const [summary, setSummary] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [rewards, setRewards] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [redeemingId, setRedeemingId] = useState(null);
  const [success, setSuccess] = useState("");

  const [badgeFilter, setBadgeFilter] = useState("ALL");
  const [showAllBadges, setShowAllBadges] = useState(false);

  const [challengeFilter, setChallengeFilter] = useState("ALL");
  const [showAllChallenges, setShowAllChallenges] = useState(false);

  const [rewardFilter, setRewardFilter] = useState("ALL");
  const [showAllRewards, setShowAllRewards] = useState(false);

  useEffect(() => {
    async function loadGamification() {
      try {
        setLoading(true);
        setError("");

        const [summaryData, leaderboardData, challengesData, rewardsData] =
          await Promise.all([
            fetchMyGamification(),
            fetchLeaderboard().catch(() => []),
            fetchChallenges().catch(() => []),
            fetchRewards().catch(() => []),
          ]);

        setSummary(summaryData || null);
        setLeaderboard(Array.isArray(leaderboardData) ? leaderboardData : []);
        setChallenges(Array.isArray(challengesData) ? challengesData : []);
        setRewards(Array.isArray(rewardsData) ? rewardsData : []);
      } catch (err) {
        setError(err.message || text.loadError);
      } finally {
        setLoading(false);
      }
    }

    loadGamification();
  }, [text.loadError]);

  useEffect(() => {
  if (loading || error || !location.hash) return;

  const targetId = location.hash.replace("#", "");

  const timeout = setTimeout(() => {
    const element = document.getElementById(targetId);

    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, 300);

  return () => clearTimeout(timeout);
}, [loading, error, location.hash]);

  const stats = summary?.stats || {};
  const allBadges = summary?.all_badges || [];
  const badges = summary?.badges || [];
  const redemptions = summary?.redemptions || [];

  const unlockedAllBadges = useMemo(() => {
    return allBadges.filter((badge) => badge.unlocked);
  }, [allBadges]);

  const filteredAllBadges = useMemo(() => {
    if (badgeFilter === "UNLOCKED") {
      return allBadges.filter((badge) => badge.unlocked);
    }

    if (badgeFilter === "LOCKED") {
      return allBadges.filter((badge) => !badge.unlocked);
    }

    return allBadges;
  }, [allBadges, badgeFilter]);

  const visibleBadgeCards = useMemo(() => {
    if (showAllBadges) return filteredAllBadges;
    return filteredAllBadges.slice(0, 3);
  }, [filteredAllBadges, showAllBadges]);

  const visibleChallenges = useMemo(() => {
    if (challenges.length) return challenges;
    if (summary?.challenges?.length) return summary.challenges;
    return [];
  }, [challenges, summary]);

  const filteredChallenges = useMemo(() => {
    if (challengeFilter === "ACTIVE") {
      return visibleChallenges.filter((challenge) => !challenge.completed_at);
    }

    if (challengeFilter === "COMPLETED") {
      return visibleChallenges.filter((challenge) => challenge.completed_at);
    }

    return visibleChallenges;
  }, [visibleChallenges, challengeFilter]);

  const visibleChallengeCards = useMemo(() => {
    if (showAllChallenges) return filteredChallenges;
    return filteredChallenges.slice(0, 2);
  }, [filteredChallenges, showAllChallenges]);

  const completedChallenges = useMemo(() => {
    return visibleChallenges.filter((challenge) => challenge.completed_at).length;
  }, [visibleChallenges]);

  const filteredRewards = useMemo(() => {
    if (rewardFilter === "AVAILABLE") {
      return rewards.filter(
        (reward) =>
          !reward.redeemed &&
          Number(stats.total_points || 0) >= Number(reward.cost_points || 0)
      );
    }

    if (rewardFilter === "LOCKED") {
      return rewards.filter(
        (reward) =>
          !reward.redeemed &&
          Number(stats.total_points || 0) < Number(reward.cost_points || 0)
      );
    }

    if (rewardFilter === "REDEEMED") {
      return rewards.filter((reward) => reward.redeemed);
    }

    return rewards;
  }, [rewards, rewardFilter, stats.total_points]);

  const visibleRewardCards = useMemo(() => {
  if (showAllRewards) return filteredRewards;
  return filteredRewards.slice(0, 3);
}, [filteredRewards, showAllRewards]);
  async function handleRedeemReward(rewardId) {
    try {
      setRedeemingId(rewardId);
      setError("");
      setSuccess("");

      const result = await redeemReward(rewardId);

      setSuccess(text.redeemSuccess);

      setRewards((prev) =>
        prev.map((reward) =>
          reward.id === rewardId ? { ...reward, redeemed: true } : reward
        )
      );

      setSummary((prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          stats: {
            ...prev.stats,
            total_points:
              result?.new_total_points ?? prev.stats?.total_points ?? 0,
          },
          redemptions: [
            {
              reward_code: result?.reward?.code,
              reward_title: result?.reward?.title,
              cost_points: result?.reward?.cost_points,
              redeemed_at: result?.redeemed_at,
            },
            ...(prev.redemptions || []),
          ],
        };
      });
    } catch (err) {
      setError(err.message || text.redeemError);
    } finally {
      setRedeemingId(null);
    }
  }

  return (
    <div className="appPage">
      <div className="appShellMockup">
        <main className="gamiPrimePage">
          <section className="gamiPrimeHeader">
            <div>
              <h1>{text.title}</h1>
              <p>{text.subtitle}</p>
            </div>

            <div className="gamiPrimeHeaderCard">
              <span>{text.highlighted}</span>
              <strong>{stats.total_points ?? 0}</strong>
              <p>{text.pointsShort}</p>
            </div>
          </section>

          <PatientSubnav />

          {loading && (
            <div className="gamiPrimeState">
              <h3>{text.loadingTitle}</h3>
              <p>{text.loadingText}</p>
            </div>
          )}

          {!loading && error && (
            <div className="gamiPrimeState">
              <h3>{text.errorTitle}</h3>
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && (
            <>
              {success && <div className="gamiPrimeSuccess">{success}</div>}

              <section className="gamiPrimeStats">
                <div className="gamiPrimeStat">
                  <div className="gamiPrimeIcon">◆</div>
                  <span>{text.totalPoints}</span>
                  <strong>{stats.total_points ?? 0}</strong>
                  <p>{text.totalPointsText}</p>
                </div>

                <div className="gamiPrimeStat">
                  <div className="gamiPrimeIcon">↗</div>
                  <span>{text.level}</span>
                  <strong>{stats.level ?? 0}</strong>
                  <p>{text.levelText}</p>
                </div>

                <div className="gamiPrimeStat">
                  <div className="gamiPrimeIcon">◎</div>
                  <span>{text.currentStreak}</span>
                  <strong>
                    {stats.current_streak ?? 0} {text.days}
                  </strong>
                  <p>{text.currentStreakText}</p>
                </div>
              </section>

              <section className="gamiPrimeMainGrid">
                <div className="gamiPrimeCard">
                  <div className="gamiPrimeCardHeader">
                    <div>
                      <h3>{text.mainSummary}</h3>
                      <span>{text.today}</span>
                    </div>
                  </div>

                  <div className="gamiPrimeInfoList">
                    <div>
                      <span>{text.bestStreak}</span>
                      <strong>
                        {stats.best_streak ?? 0} {text.days}
                      </strong>
                    </div>

                    <div>
                      <span>{text.lastActivity}</span>
                      <strong>
                        {formatDate(stats.last_activity_date, language, text)}
                      </strong>
                    </div>

                    <div>
                      <span>{text.unlockedBadges}</span>
                      <strong>{unlockedAllBadges.length || badges.length}</strong>
                    </div>
                  </div>
                </div>

                <div className="gamiPrimeCard">
                  <div className="gamiPrimeCardHeader">
                    <div>
                      <h3>{text.ranking}</h3>
                      <span>{text.leaderboard}</span>
                    </div>
                  </div>

                  <div className="gamiPrimeRanking">
                    {leaderboard.length === 0 ? (
                      <div className="gamiPrimeRankingItem">
                        <span>{text.noData}</span>
                        <strong>-</strong>
                      </div>
                    ) : (
                      leaderboard.slice(0, 5).map((entry, index) => (
                        <div
                          key={`${entry.patient_id}-${index}`}
                          className="gamiPrimeRankingItem"
                        >
                          <span>
                            #{index + 1}{" "}
                            {entry.patient__username || text.user}
                          </span>
                          <strong>
                            {entry.total ?? 0} {text.pointsShort}
                          </strong>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </section>

              <section className="gamiPrimeSectionTitle" id="badges">
                <div>
                  <h2>{text.badgesCollectionTitle}</h2>
                  <p>{text.badgesCollectionSubtitle}</p>
                </div>

                <div className="gamiPrimeMiniPill">
                  {unlockedAllBadges.length}/{allBadges.length || badges.length}
                </div>
              </section>

              <div className="gamiPrimeBadgeToolbar">
                <div className="gamiPrimeBadgeFilters">
                  <button
                    type="button"
                    className={badgeFilter === "ALL" ? "isActive" : ""}
                    onClick={() => {
                      setBadgeFilter("ALL");
                      setShowAllBadges(false);
                    }}
                  >
                    {text.all}
                  </button>

                  <button
                    type="button"
                    className={badgeFilter === "UNLOCKED" ? "isActive" : ""}
                    onClick={() => {
                      setBadgeFilter("UNLOCKED");
                      setShowAllBadges(false);
                    }}
                  >
                    {text.earned}
                  </button>

                  <button
                    type="button"
                    className={badgeFilter === "LOCKED" ? "isActive" : ""}
                    onClick={() => {
                      setBadgeFilter("LOCKED");
                      setShowAllBadges(false);
                    }}
                  >
                    {text.lockedOnly}
                  </button>
                </div>

                {filteredAllBadges.length > 3 && (
                  <button
                    type="button"
                    className="gamiPrimeBadgeToggle"
                    onClick={() => setShowAllBadges((prev) => !prev)}
                  >
                    {showAllBadges ? text.showLessBadges : text.showMoreBadges}
                    <span>{showAllBadges ? "↑" : "↓"}</span>
                  </button>
                )}
              </div>

              <section className="gamiPrimeAllBadges">
                {visibleBadgeCards.length === 0 ? (
                  <div className="gamiPrimeEmptyCard">
                    <h3>{text.noBadgesTitle}</h3>
                    <p>{text.noBadgesText}</p>
                  </div>
                ) : (
                  visibleBadgeCards.map((badge) => (
                    <article
                      key={badge.code}
                      className={`gamiPrimeBadgeProgress ${
                        badge.unlocked ? "isUnlocked" : "isLocked"
                      }`}
                    >
                      <div className="gamiPrimeBadgeProgressTop">
                        <div className="gamiPrimeBadgeIcon">
                          {badge.unlocked ? "★" : "☆"}
                        </div>

                        <span>
                          {badge.unlocked ? text.unlocked : text.locked}
                        </span>
                      </div>

                      <h3>{translateBackendText(badge.name, language)}</h3>

                      <p>
                        {translateBackendText(
                          badge.description,
                          language,
                          ""
                        )}
                      </p>

                      <div className="gamiPrimeBadgeProgressMeta">
                        <span>{text.progressToUnlock}</span>
                        <strong>
                          {capProgress(badge.current_value, badge.threshold)} /{" "}
                          {badge.threshold ?? 0}
                        </strong>
                      </div>

                      <div className="gamiPrimeProgressBar">
                        <div
                          style={{
                            width: `${
                              badge.unlocked
                                ? 100
                                : badge.progress_percent ?? 0
                            }%`,
                          }}
                        />
                      </div>
                    </article>
                  ))
                )}
              </section>

              <section className="gamiPrimeSectionTitle" id="challenges">
                <div>
                  <h2>{text.challengesTitle}</h2>
                  <p>{text.challengesSubtitle}</p>
                </div>

                <div className="gamiPrimeMiniPill">
                  {completedChallenges}/{visibleChallenges.length}
                </div>
              </section>

              <div className="gamiPrimeChallengeToolbar">
                <div className="gamiPrimeChallengeFilters">
                  <button
                    type="button"
                    className={challengeFilter === "ALL" ? "isActive" : ""}
                    onClick={() => {
                      setChallengeFilter("ALL");
                      setShowAllChallenges(false);
                    }}
                  >
                    {text.allChallenges}
                  </button>

                  <button
                    type="button"
                    className={challengeFilter === "ACTIVE" ? "isActive" : ""}
                    onClick={() => {
                      setChallengeFilter("ACTIVE");
                      setShowAllChallenges(false);
                    }}
                  >
                    {text.activeChallenges}
                  </button>

                  <button
                    type="button"
                    className={challengeFilter === "COMPLETED" ? "isActive" : ""}
                    onClick={() => {
                      setChallengeFilter("COMPLETED");
                      setShowAllChallenges(false);
                    }}
                  >
                    {text.completedChallengesFilter}
                  </button>
                </div>

                {filteredChallenges.length > 2 && (
                  <button
                    type="button"
                    className="gamiPrimeBadgeToggle"
                    onClick={() => setShowAllChallenges((prev) => !prev)}
                  >
                    {showAllChallenges ? text.showLessBadges : text.showMoreBadges}
                    <span>{showAllChallenges ? "↑" : "↓"}</span>
                  </button>
                )}
              </div>

              <section className="gamiPrimeChallenges">
                {visibleChallengeCards.length === 0 ? (
                  <div className="gamiPrimeEmptyCard">
                    <h3>{text.noChallengesTitle}</h3>
                    <p>{text.noChallengesText}</p>
                  </div>
                ) : (
                  visibleChallengeCards.map((challenge, index) => {
                    const progress = challengeProgressPercent(challenge);
                    const current =
                      challenge.user_progress_value ??
                      challenge.progress_value ??
                      0;

                    return (
                      <article
                        key={`${challenge.code}-${index}`}
                        className="gamiPrimeChallenge"
                      >
                        <div className="gamiPrimeChallengeHeader">
                          <div>
                            <h3>
                              {translateBackendText(
                                challenge.title,
                                language
                              )}
                            </h3>
                            <p>
                              {translateBackendText(
                                challenge.description,
                                language,
                                ""
                              )}
                            </p>
                          </div>

                          <span>
                            +{challenge.reward_points ?? 0} {text.pointsShort}
                          </span>
                        </div>

                        <div className="gamiPrimeChallengeMeta">
                          <span>{text.progress}</span>
                          <strong>
                            {capProgress(current, challenge.goal_target)} /{" "}
                            {challenge.goal_target ?? 0}
                          </strong>
                        </div>

                        <div className="gamiPrimeProgressBar">
                          <div style={{ width: `${progress}%` }} />
                        </div>

                        <div className="gamiPrimeMuted">
                          {challenge.completed_at
                            ? `${text.completedAt} ${formatDate(
                                challenge.completed_at,
                                language,
                                text
                              )}`
                            : `${text.activeUntil} ${formatDate(
                                challenge.ends_at,
                                language,
                                text
                              )}`}
                        </div>
                      </article>
                    );
                  })
                )}
              </section>

              <section className="gamiPrimeSectionTitle" id="rewards">
                <div>
                  <h2>{text.rewardsTitle}</h2>
                  <p>{text.rewardsSubtitle}</p>
                </div>

                <div className="gamiPrimeMiniPill">
                  {rewards.length} {text.availableRewards}
                </div>
              </section>

              <div className="gamiPrimeChallengeToolbar">
                <div className="gamiPrimeChallengeFilters">
                  <button
                    type="button"
                    className={rewardFilter === "ALL" ? "isActive" : ""}
                    onClick={() => {
                      setRewardFilter("ALL");
                      setShowAllRewards(false);
                    }}
                  >
                    {text.allRewards}
                  </button>

                  <button
                    type="button"
                    className={rewardFilter === "AVAILABLE" ? "isActive" : ""}
                    onClick={() => {
                      setRewardFilter("AVAILABLE");
                      setShowAllRewards(false);
                    }}
                  >
                    {text.availableRewardsFilter}
                  </button>

                  <button
                    type="button"
                    className={rewardFilter === "LOCKED" ? "isActive" : ""}
                    onClick={() => {
                      setRewardFilter("LOCKED");
                      setShowAllRewards(false);
                    }}
                  >
                    {text.lockedRewardsFilter}
                  </button>

                  <button
                    type="button"
                    className={rewardFilter === "REDEEMED" ? "isActive" : ""}
                    onClick={() => {
                      setRewardFilter("REDEEMED");
                      setShowAllRewards(false);
                    }}
                  >
                    {text.redeemedRewardsFilter}
                  </button>
                </div>

                {filteredRewards.length > 3 && (
                  <button
                    type="button"
                    className="gamiPrimeBadgeToggle"
                    onClick={() => setShowAllRewards((prev) => !prev)}
                  >
                    {showAllRewards ? text.showLessRewards : text.showMoreRewards}
                    <span>{showAllRewards ? "↑" : "↓"}</span>
                  </button>
                )}
              </div>

              <section className="gamiPrimeRewards">
                {visibleRewardCards.length === 0 ? (
                  <div className="gamiPrimeEmptyCard">
                    <h3>{text.noRewardsTitle}</h3>
                    <p>{text.noRewardsText}</p>
                  </div>
                ) : (
                  visibleRewardCards.map((reward) => {
                    const canRedeem =
                      Number(stats.total_points || 0) >=
                      Number(reward.cost_points || 0);

                    return (
                      <article
                        key={reward.id}
                        className={`gamiPrimeReward ${
                          reward.redeemed ? "isRedeemed" : ""
                        }`}
                      >
                        <div className="gamiPrimeRewardTop">
  <div className="gamiPrimeRewardIcon">◇</div>

  <span>
    {reward.cost_points} {text.pointsShort}
  </span>
</div>

<h3>{translateBackendText(reward.title, language)}</h3>

<p>
  {translateBackendText(
    reward.description,
    language,
    ""
  )}
</p>

<div className="gamiPrimeRewardStatus">
  {reward.redeemed
    ? text.redeemed
    : canRedeem
    ? text.available
    : text.locked}
</div>

                        <button
                          type="button"
                          onClick={() => handleRedeemReward(reward.id)}
                          disabled={
                            reward.redeemed ||
                            !canRedeem ||
                            redeemingId === reward.id
                          }
                        >
                          {reward.redeemed
                            ? text.redeemed
                            : redeemingId === reward.id
                            ? text.redeeming
                            : canRedeem
                            ? text.redeem
                            : text.insufficientPoints}
                        </button>
                      </article>
                    );
                  })
                )}
              </section>

              <section className="gamiPrimeBottom">
                <div className="gamiPrimeCard">
                  <div className="gamiPrimeCardHeader">
                    <div>
                      <h3>{text.latestRedemptions}</h3>
                    </div>
                  </div>

                  <div className="gamiPrimeRanking">
                    {redemptions.length === 0 ? (
                      <div className="gamiPrimeRankingItem">
                        <span>{text.noRedemptions}</span>
                        <strong>-</strong>
                      </div>
                    ) : (
                      redemptions.slice(0, 5).map((item, index) => (
                        <div
                          key={`${item.reward_code}-${index}`}
                          className="gamiPrimeRankingItem"
                        >
                          <span>
                            {translateBackendText(
                              item.reward_title,
                              language
                            )}
                          </span>
                          <strong>
                            {item.cost_points} {text.pointsShort}
                          </strong>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="gamiPrimeActionCard">
                  <span>{text.quickAction}</span>
                  <h3>{text.keepGoing}</h3>
                  <p>{text.keepGoingText}</p>

                  <Link to="/patient/plan">
                    {text.seePlan}
                    <span>→</span>
                  </Link>
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}