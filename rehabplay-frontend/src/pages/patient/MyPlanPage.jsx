import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PatientSubnav from "../../components/PatientSubnav";
import { fetchActivePlan, fetchMyProgress } from "../../api/patient";
import { useAppPreferences } from "../../context/AppPreferencesContext.jsx";

const planText = {
  "pt-PT": {
    hello: "Olá",
    userFallback: "Guilherme",

    title: "Plano de Exercícios",
    subtitle:
      "Consulta o teu plano atual, acompanha os exercícios definidos e mantém o teu progresso organizado.",

    details: "Ver detalhes do plano",

    loadingTitle: "A carregar...",
    loadingText: "A obter o teu plano ativo.",

    errorTitle: "Erro",
    loadError: "Erro ao carregar plano.",

    noPlanTitle: "Sem plano ativo",
    noPlanText: "Neste momento não tens nenhum plano ativo associado.",

    currentPlan: "Plano atual",
    untitled: "Sem título",
    currentPlanText: "Plano ativo associado à tua reabilitação.",

    status: "Estado do plano",
    active: "Ativo",
    inactive: "Inativo",
    statusText: "Estado atual atribuído pelo teu terapeuta.",

    exercisesInPlan: "Exercícios no plano",
    exercisesInPlanText: "Total de exercícios incluídos neste plano.",

    weeklyFrequency: "Frequência semanal",
    weeklyFrequencyText: "Sessões previstas por semana.",

    planExercises: "Exercícios do plano",
    planExercisesText:
      "Vê os detalhes de cada exercício definido pelo terapeuta.",

    sortBy: "Ordenar por",
    sortPlan: "Ordem do plano",
    sortFrequency: "Frequência",
    sortDuration: "Duração",
    sortName: "Nome",

    noExercisesTitle: "Sem exercícios",
    noExercisesText: "Este plano ainda não tem exercícios associados.",

    exerciseFallback: "Exercício",
    frequency: "Frequência",
    perWeek: "semana",
    planned: "Planeado",

    duration: "Duração",
    sets: "Séries",
    reps: "Repetições",
    exerciseId: "ID exercício",
    minutesShort: "min",

    seeDetails: "Ver detalhes",

    quickSummary: "Resumo rápido",
    totalExercises: "Total de exercícios",
    completed: "Concluídos",
    pending: "Por fazer",
    completedPercent: "Concluído",

    updateProgress: "Atualizar progresso",
    updateProgressText:
      "Regista os exercícios realizados e mantém o teu histórico sempre atualizado.",
    registerExercise: "Registar exercício",

    professionalNote: "Nota clínica",
    professionalNoteText:
      "Segue sempre a frequência e duração indicadas pelo teu terapeuta. Caso sintas dor ou desconforto fora do normal, contacta o teu terapeuta.",

    footerNote:
      "As recomendações do plano podem ser alteradas pelo teu terapeuta.",
  },

  en: {
    hello: "Hi",
    userFallback: "Guilherme",

    title: "Exercise Plan",
    subtitle:
      "View your current plan, follow the assigned exercises and keep your progress organized.",

    details: "View plan details",

    loadingTitle: "Loading...",
    loadingText: "Fetching your active plan.",

    errorTitle: "Error",
    loadError: "Error loading plan.",

    noPlanTitle: "No active plan",
    noPlanText: "You currently have no active plan assigned.",

    currentPlan: "Current plan",
    untitled: "Untitled",
    currentPlanText: "Active plan associated with your rehabilitation.",

    status: "Plan status",
    active: "Active",
    inactive: "Inactive",
    statusText: "Current status assigned by your therapist.",

    exercisesInPlan: "Exercises in plan",
    exercisesInPlanText: "Total exercises included in this plan.",

    weeklyFrequency: "Weekly frequency",
    weeklyFrequencyText: "Planned sessions per week.",

    planExercises: "Plan exercises",
    planExercisesText: "View the details of each exercise set by the therapist.",

    sortBy: "Sort by",
    sortPlan: "Plan order",
    sortFrequency: "Frequency",
    sortDuration: "Duration",
    sortName: "Name",

    noExercisesTitle: "No exercises",
    noExercisesText: "This plan does not have any exercises assigned yet.",

    exerciseFallback: "Exercise",
    frequency: "Frequency",
    perWeek: "week",
    planned: "Planned",

    duration: "Duration",
    sets: "Sets",
    reps: "Reps",
    exerciseId: "Exercise ID",
    minutesShort: "min",

    seeDetails: "View details",

    quickSummary: "Quick summary",
    totalExercises: "Total exercises",
    completed: "Completed",
    pending: "To do",
    completedPercent: "Completed",

    updateProgress: "Update progress",
    updateProgressText:
      "Log completed exercises and keep your history always up to date.",
    registerExercise: "Log exercise",

    professionalNote: "Clinical note",
    professionalNoteText:
      "Always follow the frequency and duration recommended by your therapist. If you feel unusual pain or discomfort, contact your therapist.",

    footerNote: "Plan recommendations may be changed by your therapist.",
  },
};

function translateBackendText(value, language, fallback) {
  if (!value) return fallback;
  if (language !== "en") return value;

  let text = String(value);

  const dictionary = {
    "Plano - Teste Notificações": "Plan - Notification Test",
    "Plano de reabilitação": "Rehabilitation plan",
    "Plano de exercícios": "Exercise plan",
    "Plano joelho": "Knee plan",
    "Plano ombro": "Shoulder plan",
    "Plano lombar": "Lower back plan",
    "Elevação de braço": "Arm raise",
    Alongamento: "Stretching",
    Mobilidade: "Mobility",
    Fortalecimento: "Strengthening",
    Agachamento: "Squat",
    Prancha: "Plank",
    Flexão: "Push-up",
    Caminhada: "Walking",
  };

  Object.entries(dictionary).forEach(([pt, en]) => {
    text = text.replaceAll(pt, en);
  });

  return text;
}

export default function MyPlanPage() {
  const navigate = useNavigate();
  const { language } = useAppPreferences();
  const text = planText[language] || planText["pt-PT"];
  
  const [progressEntries, setProgressEntries] = useState([]);
  const [plan, setPlan] = useState(null);
  const [sortBy, setSortBy] = useState("plan");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPlan() {
  try {
    const [planData, progressData] = await Promise.all([
      fetchActivePlan(),
      fetchMyProgress().catch(() => []),
    ]);

    setPlan(planData);
    setProgressEntries(Array.isArray(progressData) ? progressData : []);
  } catch (err) {
    setError(err.message || text.loadError);
  } finally {
    setLoading(false);
  }
}

    loadPlan();
  }, [text.loadError]);

  const items = useMemo(() => {
    const rawItems = [...(plan?.items || [])];

    switch (sortBy) {
      case "frequency":
        return rawItems.sort(
          (a, b) => (b.frequency_per_week || 0) - (a.frequency_per_week || 0)
        );

      case "duration":
        return rawItems.sort(
          (a, b) => (b.duration_minutes || 0) - (a.duration_minutes || 0)
        );

      case "name":
        return rawItems.sort((a, b) =>
          String(a.exercise_name || "").localeCompare(
            String(b.exercise_name || "")
          )
        );

      default:
        return rawItems;
    }
  }, [plan, sortBy]);

  const completedCount = useMemo(() => {
  if (!items.length || !progressEntries.length) return 0;

  const planItemIds = new Set(items.map((item) => item.id));
  const completedItems = new Set();

  progressEntries.forEach((entry) => {
    if (planItemIds.has(entry.plan_item)) {
      completedItems.add(entry.plan_item);
    }
  });

  return completedItems.size;
}, [items, progressEntries]);

const pendingCount = Math.max(items.length - completedCount, 0);

  const totalWeeklyFrequency = useMemo(() => {
    return items.reduce(
      (sum, item) => sum + Number(item.frequency_per_week || 0),
      0
    );
  }, [items]);

  const completedPercentage = items.length
    ? Math.round((completedCount / items.length) * 100)
    : 0;

  const planTitle = translateBackendText(plan?.title, language, text.untitled);

  function handleOpenExerciseDetails(item) {
    navigate(`/patient/library?exercise=${item.exercise}`);
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

        <main className="planPremiumPage">
          <section className="planPremiumHeader">
            <div>
              <h1>{text.title}</h1>
              <p>{text.subtitle}</p>
            </div>

            <button type="button" className="planPremiumOutlineBtn">
              {text.details}
            </button>
          </section>

          <PatientSubnav />

          {loading && (
            <div className="planPremiumState">
              <h3>{text.loadingTitle}</h3>
              <p>{text.loadingText}</p>
            </div>
          )}

          {error && !loading && (
            <div className="planPremiumState">
              <h3>{text.errorTitle}</h3>
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && !plan && (
            <div className="planPremiumState">
              <h3>{text.noPlanTitle}</h3>
              <p>{text.noPlanText}</p>
            </div>
          )}

          {!loading && !error && plan && (
            <>
              <section className="planPremiumStatsShell">
                <div className="planPremiumStat">
                  <div className="planPremiumStatIcon">▤</div>
                  <div>
                    <span>{text.currentPlan}</span>
                    <strong>{planTitle}</strong>
                    <p>{text.currentPlanText}</p>
                  </div>
                </div>

                <div className="planPremiumStat">
                  <div className="planPremiumStatIcon isGreen">✓</div>
                  <div>
                    <span>{text.status}</span>
                    <strong>
                      {plan.is_active ? text.active : text.inactive}
                    </strong>
                    <p>{text.statusText}</p>
                  </div>
                </div>

                <div className="planPremiumStat">
                  <div className="planPremiumStatIcon">↔</div>
                  <div>
                    <span>{text.exercisesInPlan}</span>
                    <strong>{items.length}</strong>
                    <p>{text.exercisesInPlanText}</p>
                  </div>
                </div>

                <div className="planPremiumStat">
                  <div className="planPremiumStatIcon">▣</div>
                  <div>
                    <span>{text.weeklyFrequency}</span>
                    <strong>{totalWeeklyFrequency}</strong>
                    <p>{text.weeklyFrequencyText}</p>
                  </div>
                </div>
              </section>

              <section className="planPremiumSectionTitle">
                <div className="planPremiumSectionTitleLeft">
                  <div className="planPremiumSectionIcon">≡</div>

                  <div>
                    <h2>{text.planExercises}</h2>
                    <p>{text.planExercisesText}</p>
                  </div>
                </div>

                <div className="planPremiumSort">
                  <span>{text.sortBy}</span>

                  <select
                    value={sortBy}
                    onChange={(event) => setSortBy(event.target.value)}
                    className="planPremiumSortSelect"
                  >
                    <option value="plan">{text.sortPlan}</option>
                    <option value="frequency">{text.sortFrequency}</option>
                    <option value="duration">{text.sortDuration}</option>
                    <option value="name">{text.sortName}</option>
                  </select>
                </div>
              </section>

              <section className="planPremiumExerciseList">
                {items.length === 0 ? (
                  <div className="planPremiumState">
                    <h3>{text.noExercisesTitle}</h3>
                    <p>{text.noExercisesText}</p>
                  </div>
                ) : (
                  items.map((item, index) => {
                    const exerciseName = translateBackendText(
                      item.exercise_name,
                      language,
                      text.exerciseFallback
                    );

                    return (
                      <article key={item.id} className="planPremiumExercise">
                        <div className="planPremiumExerciseIndex">
                          <strong>{String(index + 1).padStart(2, "0")}</strong>
                        </div>

                        <div className="planPremiumExerciseMain">
                          <div className="planPremiumExerciseHeader">
                            <div>
                              <h3>{exerciseName}</h3>
                              <span>
                                {text.frequency}: {item.frequency_per_week || 0}
                                /{text.perWeek}
                              </span>
                            </div>

                            <div className="planPremiumPlanned">
                              {text.planned}
                            </div>
                          </div>

                          <div className="planPremiumExerciseData">
                            <div>
                              <span>{text.duration}</span>
                              <strong>
                                {item.duration_minutes ?? 0} {text.minutesShort}
                              </strong>
                            </div>

                            <div>
                              <span>{text.sets}</span>
                              <strong>{item.sets ?? 0}</strong>
                            </div>

                            <div>
                              <span>{text.reps}</span>
                              <strong>{item.reps ?? 0}</strong>
                            </div>

                            <div>
                              <span>{text.exerciseId}</span>
                              <strong>{item.exercise ?? "-"}</strong>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleOpenExerciseDetails(item)}
                            >
                              {text.seeDetails}
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })
                )}
              </section>

              <section className="planPremiumBottomGrid">
                <div
  className={`planPremiumSummary ${
    completedPercentage === 100 ? "isComplete" : ""
  }`}
  style={{ "--progress": `${completedPercentage}%` }}
>
                  <div className="planPremiumCardTitle">
                    <div className="planPremiumCardIcon">▤</div>
                    <h3>{text.quickSummary}</h3>
                  </div>

                  <div className="planPremiumSummaryRows">
                    <div>
                      <span>{text.totalExercises}</span>
                      <strong>{items.length}</strong>
                    </div>

                    <div>
                      <span>{text.completed}</span>
                      <strong>{completedCount}</strong>
                    </div>

                    <div>
                      <span>{text.pending}</span>
                      <strong>{pendingCount}</strong>
                    </div>
                  </div>

                  <div className="planPremiumRing">
                    <div>
                      <strong>{completedPercentage}%</strong>
                      <span>{text.completedPercent}</span>
                    </div>
                  </div>
                </div>

                <div className="planPremiumProgressCard">
                  <div className="planPremiumCardTitle">
                    <div className="planPremiumCardIcon">↗</div>
                    <h3>{text.updateProgress}</h3>
                  </div>

                  <p>{text.updateProgressText}</p>

                  <div className="planPremiumProgressVisual">
                    <div className="planPremiumProgressBlob" />
                    <div className="planPremiumClipboard" />
                    <div className="planPremiumDumbbell">
                      <span />
                      <strong />
                    </div>
                  </div>

                  <Link to="/patient/progress">
                    {text.registerExercise}
                    <span>→</span>
                  </Link>
                </div>

                <div className="planPremiumClinical">
                  <div className="planPremiumClinicalIcon">✚</div>

                  <div>
                    <h3>{text.professionalNote}</h3>
                    <p>{text.professionalNoteText}</p>
                  </div>
                </div>
              </section>

              <div className="planPremiumFooterNote">{text.footerNote}</div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}