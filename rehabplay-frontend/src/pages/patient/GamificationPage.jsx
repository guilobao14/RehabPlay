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

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("pt-PT", {
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
        setError(err.message || "Erro ao carregar gamificação.");
      } finally {
        setLoading(false);
      }
    }

    loadGamification();
  }, []);

  const stats = summary?.stats || {};
  const badges = summary?.badges || [];
  const redemptions = summary?.redemptions || [];

  const visibleChallenges = useMemo(() => {
    if (challenges.length) return challenges;
    if (summary?.challenges?.length) return summary.challenges;
    return [];
  }, [challenges, summary]);

  async function handleRedeemReward(rewardId) {
    try {
      setRedeemingId(rewardId);
      setError("");
      setSuccess("");

      const result = await redeemReward(rewardId);

      setSuccess("Recompensa resgatada com sucesso.");

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
      setError(err.message || "Erro ao resgatar recompensa.");
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
          <div className="userArea">Olá, Guilherme</div>
        </div>

        <div className="pageHeader">
          <h1 className="pageTitle">Gamificação</h1>
          <div className="pageSubtitle">
            Acompanha pontos, badges, desafios e recompensas
          </div>
        </div>

        <div className="content">
          <PatientSubnav />

          {loading && (
            <div className="gamiCard">
              <h3 className="gamiCardTitle">A carregar...</h3>
              <p className="gamiActionText">A obter os teus dados de gamificação.</p>
            </div>
          )}

          {!loading && error && (
            <div className="gamiCard">
              <h3 className="gamiCardTitle">Erro</h3>
              <p className="gamiActionText">{error}</p>
            </div>
          )}

          {!loading && !error && (
            <>
              {success && <div className="gamiNoticeOk">{success}</div>}

              <div className="gamiTopGrid">
                <div className="gamiMetricCard">
                  <div className="gamiMetricLabel">Pontuação total</div>
                  <div className="gamiMetricValue">
                    {stats.total_points ?? 0}
                  </div>
                </div>

                <div className="gamiMetricCard">
                  <div className="gamiMetricLabel">Nível</div>
                  <div className="gamiMetricValue gamiAccent">
                    {stats.level ?? 0}
                  </div>
                </div>

                <div className="gamiMetricCard">
                  <div className="gamiMetricLabel">Sequência atual</div>
                  <div className="gamiMetricValue">
                    {stats.current_streak ?? 0} dias
                  </div>
                </div>
              </div>

              <div className="gamiMainGrid">
                <div className="gamiCard">
                  <div className="gamiCardHeader">
                    <h3 className="gamiCardTitle">Resumo principal</h3>
                    <span className="gamiTag">Hoje</span>
                  </div>

                  <div className="gamiInfoList">
                    <div className="gamiInfoItem">
                      <span>Melhor sequência</span>
                      <strong>{stats.best_streak ?? 0} dias</strong>
                    </div>
                    <div className="gamiInfoItem">
                      <span>Última atividade</span>
                      <strong>{formatDate(stats.last_activity_date)}</strong>
                    </div>
                    <div className="gamiInfoItem">
                      <span>Badges conquistadas</span>
                      <strong>{badges.length}</strong>
                    </div>
                  </div>
                </div>

                <div className="gamiCard">
                  <div className="gamiCardHeader">
                    <h3 className="gamiCardTitle">Ranking</h3>
                    <span className="gamiTag">Leaderboard</span>
                  </div>

                  <div className="gamiRankingList">
                    {leaderboard.length === 0 ? (
                      <div className="gamiRankingItem">
                        <span>Sem dados</span>
                        <strong>-</strong>
                      </div>
                    ) : (
                      leaderboard.slice(0, 5).map((entry, index) => (
                        <div
                          key={`${entry.patient_id}-${index}`}
                          className="gamiRankingItem"
                        >
                          <span>
                            #{index + 1} {entry.patient__username || "Utilizador"}
                          </span>
                          <strong>{entry.total ?? 0} pts</strong>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="gamiSectionHeader">
                <h2 className="gamiSectionTitle">Badges desbloqueadas</h2>
                <p className="gamiSectionSub">
                  Recompensas conquistadas ao longo do teu percurso
                </p>
              </div>

              <div className="gamiBadgesGrid">
                {badges.length === 0 ? (
                  <div className="gamiBadgeCard">
                    <div className="gamiBadgeTitle">Sem badges ainda</div>
                    <div className="gamiBadgeText">
                      Continua a usar a plataforma para começares a desbloquear
                      conquistas.
                    </div>
                  </div>
                ) : (
                  badges.map((badge, index) => (
                    <div key={`${badge.code}-${index}`} className="gamiBadgeCard">
                      <div className="gamiBadgeIcon">🏅</div>
                      <div className="gamiBadgeTitle">{badge.name}</div>
                      <div className="gamiBadgeText">{badge.description}</div>
                      <div className="gamiBadgeDate">
                        {formatDate(badge.awarded_at)}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="gamiSectionHeader">
                <h2 className="gamiSectionTitle">Desafios</h2>
                <p className="gamiSectionSub">
                  Acompanha o teu progresso nos desafios ativos
                </p>
              </div>

              <div className="gamiChallengesGrid">
                {visibleChallenges.length === 0 ? (
                  <div className="gamiCard">
                    <h3 className="gamiCardTitle">Sem desafios ativos</h3>
                    <p className="gamiActionText">
                      Neste momento não existem desafios disponíveis.
                    </p>
                  </div>
                ) : (
                  visibleChallenges.map((challenge, index) => {
                    const progress = challengeProgressPercent(challenge);
                    const current =
                      challenge.user_progress_value ??
                      challenge.progress_value ??
                      0;

                    return (
                      <div
                        key={`${challenge.code}-${index}`}
                        className="gamiCard"
                      >
                        <div className="gamiCardHeader">
                          <h3 className="gamiCardTitle">{challenge.title}</h3>
                          <span className="gamiTag">
                            +{challenge.reward_points ?? 0} pts
                          </span>
                        </div>

                        <div className="gamiChallengeBox">
                          <div className="gamiChallengeText">
                            {challenge.description}
                          </div>

                          <div className="gamiChallengeMeta">
                            Progresso: <strong>{current}</strong> /{" "}
                            <strong>{challenge.goal_target ?? 0}</strong>
                          </div>

                          <div className="gamiProgressBar">
                            <div
                              className="gamiProgressFill"
                              style={{ width: `${progress}%` }}
                            />
                          </div>

                          <div className="gamiMutedLine">
                            {challenge.completed_at
                              ? `Concluído em ${formatDate(
                                  challenge.completed_at
                                )}`
                              : `Ativo até ${formatDate(challenge.ends_at)}`}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="gamiSectionHeader">
                <h2 className="gamiSectionTitle">Recompensas</h2>
                <p className="gamiSectionSub">
                  Usa os teus pontos para resgatar recompensas disponíveis
                </p>
              </div>

              <div className="gamiRewardsGrid">
                {rewards.length === 0 ? (
                  <div className="gamiCard">
                    <h3 className="gamiCardTitle">Sem recompensas</h3>
                    <p className="gamiActionText">
                      Não existem recompensas disponíveis neste momento.
                    </p>
                  </div>
                ) : (
                  rewards.map((reward) => {
                    const canRedeem =
                      Number(stats.total_points || 0) >=
                      Number(reward.cost_points || 0);

                    return (
                      <div key={reward.id} className="gamiCard">
                        <div className="gamiCardHeader">
                          <h3 className="gamiCardTitle">{reward.title}</h3>
                          <span className="gamiTag">
                            {reward.cost_points} pts
                          </span>
                        </div>

                        <div className="gamiRewardText">
                          {reward.description}
                        </div>

                        <button
                          className="mediumButton gamiRedeemBtn"
                          onClick={() => handleRedeemReward(reward.id)}
                          disabled={!canRedeem || redeemingId === reward.id}
                        >
                          {redeemingId === reward.id
                            ? "A resgatar..."
                            : canRedeem
                            ? "Resgatar"
                            : "Pontos insuficientes"}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="gamiBottomGrid">
                <div className="gamiCard">
                  <div className="gamiCardHeader">
                    <h3 className="gamiCardTitle">Últimos resgates</h3>
                  </div>

                  <div className="gamiRankingList">
                    {redemptions.length === 0 ? (
                      <div className="gamiRankingItem">
                        <span>Sem resgates ainda</span>
                        <strong>-</strong>
                      </div>
                    ) : (
                      redemptions.slice(0, 5).map((item, index) => (
                        <div
                          key={`${item.reward_code}-${index}`}
                          className="gamiRankingItem"
                        >
                          <span>{item.reward_title}</span>
                          <strong>{item.cost_points} pts</strong>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="gamiCard">
                  <div className="gamiCardHeader">
                    <h3 className="gamiCardTitle">Ação rápida</h3>
                  </div>

                  <div className="gamiActionBox">
                    <div>
                      <div className="gamiActionTitle">Continua a evoluir</div>
                      <div className="gamiActionText">
                        Completa exercícios e mantém regularidade para subires de
                        nível e desbloqueares mais recompensas.
                      </div>
                    </div>

                    <Link
                      to="/patient/plan"
                      className="mediumButton gamiActionBtn"
                    >
                      Ver plano
                    </Link>
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