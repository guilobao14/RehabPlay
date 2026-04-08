import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PatientSubnav from "../../components/PatientSubnav";
import { fetchMyProgress, fetchActivePlan } from "../../api/patient";

function getWeekLabel(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Sem data";

  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const diffDays = Math.floor((date - startOfYear) / 86400000);
  const week = Math.ceil((diffDays + startOfYear.getDay() + 1) / 7);

  return `Semana ${week}`;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function ProgressPage() {
  const [entries, setEntries] = useState([]);
  const [planItemsMap, setPlanItemsMap] = useState({});
  const [planItemsList, setPlanItemsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProgress() {
      try {
        const [progressData, activePlanData] = await Promise.all([
          fetchMyProgress(),
          fetchActivePlan().catch(() => null),
        ]);

        const progressEntries = Array.isArray(progressData) ? progressData : [];
        setEntries(progressEntries);

        const items = Array.isArray(activePlanData?.items)
          ? activePlanData.items
          : [];

        setPlanItemsList(items);

        const map = {};
        for (const item of items) {
          map[String(item.id)] = item.exercise_name || `Item ${item.id}`;
        }

        setPlanItemsMap(map);
      } catch (err) {
        setError(err.message || "Erro ao carregar progresso.");
      } finally {
        setLoading(false);
      }
    }

    loadProgress();
  }, []);

  function getExerciseNameFromPlanItem(planItemId) {
    const directMatch = planItemsMap[String(planItemId)];
    if (directMatch) return directMatch;

    if (planItemsList.length === 1) {
      return planItemsList[0]?.exercise_name || `Item ${planItemId}`;
    }

    return `Item ${planItemId}`;
  }

  const totalExercises = entries.length;

  const totalMinutes = useMemo(() => {
    return entries.reduce(
      (sum, item) => sum + Number(item.duration_minutes || 0),
      0
    );
  }, [entries]);

  const avgComfort = useMemo(() => {
    const values = entries
      .map((item) => Number(item.comfort_level))
      .filter((value) => !Number.isNaN(value) && value > 0);

    if (!values.length) return null;

    const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
    return avg.toFixed(1);
  }, [entries]);

  const avgPain = useMemo(() => {
    const values = entries
      .map((item) => Number(item.pain_level))
      .filter((value) => !Number.isNaN(value) && value >= 0);

    if (!values.length) return null;

    const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
    return avg.toFixed(1);
  }, [entries]);

  const progressPercent = useMemo(() => {
    if (!entries.length) return 0;
    return Math.min(100, Math.round(entries.length * 10));
  }, [entries]);

  const weeklyData = useMemo(() => {
    const groups = {};

    for (const entry of entries) {
      const label = getWeekLabel(entry.performed_at);

      if (!groups[label]) {
        groups[label] = {
          label,
          exercises: 0,
          totalTime: 0,
          comfortValues: [],
        };
      }

      groups[label].exercises += 1;
      groups[label].totalTime += Number(entry.duration_minutes || 0);

      const comfort = Number(entry.comfort_level);
      if (!Number.isNaN(comfort) && comfort > 0) {
        groups[label].comfortValues.push(comfort);
      }
    }

    return Object.values(groups)
      .map((group) => {
        const comfortAverage = group.comfortValues.length
          ? group.comfortValues.reduce((sum, value) => sum + value, 0) /
            group.comfortValues.length
          : 0;

        return {
          week: group.label,
          exercises: group.exercises,
          totalTime: `${group.totalTime} min`,
          progress: Math.min(100, Math.round(group.exercises * 15)),
          comfortAverage: comfortAverage.toFixed(1),
        };
      })
      .sort((a, b) => {
        const aNum = Number(a.week.replace("Semana ", ""));
        const bNum = Number(b.week.replace("Semana ", ""));
        return aNum - bNum;
      });
  }, [entries]);

  const latestEntries = useMemo(() => {
    return [...entries]
      .sort((a, b) => new Date(b.performed_at) - new Date(a.performed_at))
      .slice(0, 5);
  }, [entries]);

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
          <h1 className="pageTitle">Histórico de Progresso</h1>
          <div className="pageSubtitle">
            Acompanha a tua evolução ao longo do tempo
          </div>
        </div>

        <div className="content">
          <PatientSubnav />

          {loading && (
            <div className="progressSummaryCard">
              <h3 className="progressSummaryTitle">A carregar...</h3>
              <p className="progressActionText">
                A obter os teus registos de progresso.
              </p>
            </div>
          )}

          {error && !loading && (
            <div className="progressSummaryCard">
              <h3 className="progressSummaryTitle">Erro</h3>
              <p className="progressActionText">{error}</p>
            </div>
          )}

          {!loading && !error && (
            <>
              <div className="progressHeroGrid">
                <div className="progressHeroCard">
                  <div className="progressHeroLabel">Progresso geral</div>
                  <div className="progressHeroValue">{progressPercent}%</div>
                  <div className="progressHeroText">
                    Estimativa baseada no número de registos realizados.
                  </div>
                </div>

                <div className="progressHeroCard">
                  <div className="progressHeroLabel">Tempo total</div>
                  <div className="progressHeroValue">{totalMinutes} min</div>
                  <div className="progressHeroText">
                    Tempo acumulado registado nas tuas sessões.
                  </div>
                </div>

                <div className="progressHeroCard">
                  <div className="progressHeroLabel">Exercícios registados</div>
                  <div className="progressHeroValue">{totalExercises}</div>
                  <div className="progressHeroText">
                    Total de entradas de progresso efetuadas.
                  </div>
                </div>
              </div>

              <div className="progressSummaryGrid">
                <div className="progressSummaryCard">
                  <h3 className="progressSummaryTitle">Resumo de bem-estar</h3>

                  <div className="progressSummaryStats">
                    <div className="progressSummaryStatBox">
                      <div className="progressSummaryStatValue">
                        {avgComfort ?? "-"}
                      </div>
                      <div className="progressSummaryStatLabel">
                        Conforto médio
                      </div>
                    </div>

                    <div className="progressSummaryStatBox">
                      <div className="progressSummaryStatValue">
                        {avgPain ?? "-"}
                      </div>
                      <div className="progressSummaryStatLabel">Dor média</div>
                    </div>
                  </div>
                </div>

                <div className="progressSummaryCard">
                  <h3 className="progressSummaryTitle">Resumo atual</h3>

                  <div className="progressInfoList">
                    <div className="progressInfoItem">
                      <span>Últimos registos</span>
                      <strong>{latestEntries.length}</strong>
                    </div>
                    <div className="progressInfoItem">
                      <span>Tempo total</span>
                      <strong>{totalMinutes} min</strong>
                    </div>
                    <div className="progressInfoItem">
                      <span>Estado atual</span>
                      <strong>
                        {entries.length ? "Em acompanhamento" : "Sem registos"}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="progressSectionHeader">
                <h2 className="progressSectionTitle">Evolução semanal</h2>
                <p className="progressSectionSub">
                  Vê o teu desempenho por semana e acompanha tendências
                </p>
              </div>

              <div className="progressWeeksGrid">
                {weeklyData.length === 0 ? (
                  <div className="progressSummaryCard">
                    <h3 className="progressSummaryTitle">Sem progresso ainda</h3>
                    <p className="progressActionText">
                      Ainda não existem entradas registadas no teu histórico.
                    </p>
                  </div>
                ) : (
                  weeklyData.map((item) => (
                    <div key={item.week} className="progressWeekCard">
                      <h3 className="progressWeekTitle">{item.week}</h3>

                      <div className="progressWeekInfo">
                        <div className="progressWeekLine">
                          Exercícios realizados: <strong>{item.exercises}</strong>
                        </div>
                        <div className="progressWeekLine">
                          Tempo total: <strong>{item.totalTime}</strong>
                        </div>
                        <div className="progressWeekLine">
                          Conforto médio: <strong>{item.comfortAverage}</strong>
                        </div>
                      </div>

                      <div className="progressWeekBarWrap">
                        <div
                          className="progressWeekBarFill"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="progressBottomGrid">
                <div className="progressSummaryCard">
                  <h3 className="progressSummaryTitle">Últimos registos</h3>

                  <div className="progressInfoList">
                    {latestEntries.length === 0 ? (
                      <div className="progressInfoItem">
                        <span>Sem registos recentes</span>
                        <strong>-</strong>
                      </div>
                    ) : (
                      latestEntries.map((entry) => (
                        <div key={entry.id} className="progressInfoItem">
                          <span>
                            {formatDate(entry.performed_at)} ·{" "}
                            {getExerciseNameFromPlanItem(entry.plan_item)}
                          </span>
                          <strong>{entry.duration_minutes || 0} min</strong>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="progressSummaryCard">
                  <h3 className="progressSummaryTitle">Próximo passo</h3>
                  <div className="progressActionBox">
                    <p className="progressActionText">
                      Continua a registar os exercícios para manteres um histórico
                      mais completo e preciso.
                    </p>

                    <Link
                      to="/patient/plan"
                      className="mediumButton progressActionBtn"
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