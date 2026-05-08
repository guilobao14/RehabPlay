import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
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
    hello: "Olá",
    userFallback: "Guilherme",

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

    badgesTitle: "Badges desbloqueadas",
    badgesSubtitle: "Conquistas obtidas ao longo do teu percurso.",
    noBadgesTitle: "Sem badges ainda",
    noBadgesText:
      "Continua a usar a plataforma para começares a desbloquear conquistas.",

    challengesTitle: "Desafios",
    challengesSubtitle: "Acompanha o teu progresso nos desafios ativos.",
    noChallengesTitle: "Sem desafios ativos",
    noChallengesText: "Neste momento não existem desafios disponíveis.",
    progress: "Progresso",
    completedAt: "Concluído em",
    activeUntil: "Ativo até",

    rewardsTitle: "Recompensas",
    rewardsSubtitle: "Usa os teus pontos para resgatar recompensas disponíveis.",
    noRewardsTitle: "Sem recompensas",
    noRewardsText: "Não existem recompensas disponíveis neste momento.",
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
    hello: "Hi",
    userFallback: "Guilherme",

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

    badgesTitle: "Unlocked badges",
    badgesSubtitle: "Achievements earned throughout your journey.",
    noBadgesTitle: "No badges yet",
    noBadgesText:
      "Keep using the platform to start unlocking achievements.",

    challengesTitle: "Challenges",
    challengesSubtitle: "Track your progress in active challenges.",
    noChallengesTitle: "No active challenges",
    noChallengesText: "There are no challenges available right now.",
    progress: "Progress",
    completedAt: "Completed on",
    activeUntil: "Active until",

    rewardsTitle: "Rewards",
    rewardsSubtitle: "Use your points to redeem available rewards.",
    noRewardsTitle: "No rewards",
    noRewardsText: "There are no rewards available right now.",
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
    "Texto:": "Text:",
    "Vídeo:": "Video:",
    "Registaste o teu primeiro progresso!": "You logged your first progress!",
    "Atingiste 50 pontos.": "You reached 50 points.",
    "Primeiro Registo": "First Record",
    "50 Pontos": "50 Points",
    "3 treinos esta semana": "3 workouts this week",
    "Regista 3 progressos esta semana e ganha 20 pontos!":
      "Log 3 progress records this week and earn 20 points!",
    "Desbloquear Tema Premium": "Unlock Premium Theme",
    "Acesso a temas premium": "Access to premium themes",

    "Primeiro exercício": "First exercise",
    "Primeira semana": "First week",
    "Consistência": "Consistency",
    "Sequência": "Streak",
    "Plano completo": "Completed plan",
    "Completa exercícios": "Complete exercises",
    "Conquista": "Achievement",
    "Recompensa": "Reward",
    "Desafio": "Challenge",
    "Desconto": "Discount",
    "Consulta": "Appointment",
    "Sem descrição": "No description",
  };

  const enToPt = Object.fromEntries(
    Object.entries(ptToEn).map(([pt, en]) => [en, pt])
  );

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

  const [summary, setSummary] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [rewards, setRewards] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [redeemingId, setRedeemingId] = useState(null);
  const [success, setSuccess] = useState("");

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

  const stats = summary?.stats || {};
  const badges = summary?.badges || [];
  const redemptions = summary?.redemptions || [];

  const visibleChallenges = useMemo(() => {
    if (challenges.length) return challenges;
    if (summary?.challenges?.length) return summary.challenges;
    return [];
  }, [challenges, summary]);

  const completedChallenges = useMemo(() => {
    return visibleChallenges.filter((challenge) => challenge.completed_at).length;
  }, [visibleChallenges]);

  async function handleRedeemReward(rewardId) {
    try {
      setRedeemingId(rewardId);
      setError("");
      setSuccess("");

      const result = await redeemReward(rewardId);

      setSuccess(text.redeemSuccess);

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
        <div className="topbar">
          <Link to="/dashboard" className="brandLink">
            RehabPlay
          </Link>

          <div className="userArea">
            {text.hello}, {text.userFallback}
          </div>
        </div>

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
                      <strong>{badges.length}</strong>
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

              <section className="gamiPrimeSectionTitle">
                <div>
                  <h2>{text.badgesTitle}</h2>
                  <p>{text.badgesSubtitle}</p>
                </div>
              </section>

              <section className="gamiPrimeBadges">
                {badges.length === 0 ? (
                  <div className="gamiPrimeEmptyCard">
                    <h3>{text.noBadgesTitle}</h3>
                    <p>{text.noBadgesText}</p>
                  </div>
                ) : (
                  badges.map((badge, index) => (
                    <article
                      key={`${badge.code}-${index}`}
                      className="gamiPrimeBadge"
                    >
                      <div className="gamiPrimeBadgeIcon">★</div>
                      <h3>{translateBackendText(badge.name, language)}</h3>
                      <p>
                        {translateBackendText(
                          badge.description,
                          language,
                          ""
                        )}
                      </p>
                      <span>
                        {formatDate(badge.awarded_at, language, text)}
                      </span>
                    </article>
                  ))
                )}
              </section>

              <section className="gamiPrimeSectionTitle">
                <div>
                  <h2>{text.challengesTitle}</h2>
                  <p>{text.challengesSubtitle}</p>
                </div>

                <div className="gamiPrimeMiniPill">
                  {completedChallenges}/{visibleChallenges.length}
                </div>
              </section>

              <section className="gamiPrimeChallenges">
                {visibleChallenges.length === 0 ? (
                  <div className="gamiPrimeEmptyCard">
                    <h3>{text.noChallengesTitle}</h3>
                    <p>{text.noChallengesText}</p>
                  </div>
                ) : (
                  visibleChallenges.map((challenge, index) => {
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
                            {current} / {challenge.goal_target ?? 0}
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

              <section className="gamiPrimeSectionTitle">
                <div>
                  <h2>{text.rewardsTitle}</h2>
                  <p>{text.rewardsSubtitle}</p>
                </div>

                <div className="gamiPrimeMiniPill">
                  {rewards.length} {text.availableRewards}
                </div>
              </section>

              <section className="gamiPrimeRewards">
                {rewards.length === 0 ? (
                  <div className="gamiPrimeEmptyCard">
                    <h3>{text.noRewardsTitle}</h3>
                    <p>{text.noRewardsText}</p>
                  </div>
                ) : (
                  rewards.map((reward) => {
                    const canRedeem =
                      Number(stats.total_points || 0) >=
                      Number(reward.cost_points || 0);

                    return (
                      <article key={reward.id} className="gamiPrimeReward">
                        <div className="gamiPrimeRewardTop">
                          <div className="gamiPrimeRewardIcon">◇</div>
                          <span>
                            {reward.cost_points} {text.pointsShort}
                          </span>
                        </div>

                        <h3>
                          {translateBackendText(reward.title, language)}
                        </h3>

                        <p>
                          {translateBackendText(
                            reward.description,
                            language,
                            ""
                          )}
                        </p>

                        <button
                          type="button"
                          onClick={() => handleRedeemReward(reward.id)}
                          disabled={!canRedeem || redeemingId === reward.id}
                        >
                          {redeemingId === reward.id
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