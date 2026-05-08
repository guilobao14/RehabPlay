import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PatientSubnav from "../../components/PatientSubnav";
import {
  fetchMyProgress,
  fetchActivePlan,
  createProgressEntry,
  fetchProgressOptions,
} from "../../api/patient";
import { useAppPreferences } from "../../context/AppPreferencesContext.jsx";

const progressText = {
  "pt-PT": {
    hello: "Olá",
    userFallback: "Guilherme",

    title: "Histórico de Progresso",
    subtitle:
      "Regista os exercícios realizados e acompanha a tua evolução clínica ao longo do tempo.",

    loadingTitle: "A carregar...",
    loadingText: "A obter os teus registos de progresso.",
    errorTitle: "Erro",
    loadError: "Erro ao carregar progresso.",

    progressGeneral: "Progresso semanal",
    progressGeneralText:
    "Baseado nas sessões realizadas esta semana em comparação com a frequência semanal definida no plano.",
    totalTime: "Tempo total",
    totalTimeText: "Tempo acumulado registado nas tuas sessões.",
    registeredExercises: "Exercícios registados",
    registeredExercisesText: "Total de entradas de progresso efetuadas.",

    registerTitle: "Registar exercício",
    registerSubtitle:
      "Preenche apenas os dados reais da sessão. Séries, repetições e frequência já vêm definidos no plano.",
    exercise: "Exercício",
    selectExercise: "Seleciona um exercício",
    performedAt: "Data e hora",
    duration: "Duração real",
    painLevel: "Nível de dor",
    comfortLevel: "Nível de conforto",
    perceivedDifficulty: "Dificuldade percebida",
    selectDifficulty: "Seleciona a dificuldade",
    notes: "Notas",
    notesPlaceholder:
      "Exemplo: exercício concluído sem dificuldade, ligeiro desconforto ou melhoria sentida.",
    minutes: "min",
    save: "Guardar registo",
    saving: "A guardar...",
    success: "Exercício registado com sucesso.",
    saveError: "Erro ao registar exercício.",

    wellbeing: "Resumo de bem-estar",
    avgComfort: "Conforto médio",
    avgPain: "Dor média",

    latestRecords: "Últimos registos",
    currentStatus: "Estado atual",
    monitoring: "Em acompanhamento",
    noRecords: "Sem registos",

    weeklyEvolution: "Evolução semanal",
    weeklyEvolutionText:
      "Analisa a consistência, o tempo acumulado e o conforto médio por semana.",
    noProgressYet: "Sem progresso ainda",
    noProgressText: "Ainda não existem entradas registadas no teu histórico.",
    performedExercises: "Exercícios realizados",
    averageComfort: "Conforto médio",

    recentRecords: "Últimos registos",
    noRecentRecords: "Sem registos recentes",
    nextStep: "Próximo passo",
    nextStepText:
      "Continua a registar os exercícios para manteres um histórico mais completo e preciso.",
    seePlan: "Ver plano",

    week: "Semana",
    noDate: "Sem data",
    item: "Item",
  },

  en: {
    hello: "Hi",
    userFallback: "Guilherme",

    title: "Progress History",
    subtitle:
      "Log completed exercises and track your clinical evolution over time.",

    loadingTitle: "Loading...",
    loadingText: "Fetching your progress records.",
    errorTitle: "Error",
    loadError: "Error loading progress.",

    progressGeneral: "Weekly progress",
    progressGeneralText:
    "Based on completed sessions this week compared with the weekly frequency defined in your plan.",
    totalTime: "Total time",
    totalTimeText: "Accumulated time logged in your sessions.",
    registeredExercises: "Logged exercises",
    registeredExercisesText: "Total progress entries submitted.",

    registerTitle: "Log exercise",
    registerSubtitle:
      "Fill in only the real session data. Sets, reps and frequency are already defined in the plan.",
    exercise: "Exercise",
    selectExercise: "Select an exercise",
    performedAt: "Date and time",
    duration: "Real duration",
    painLevel: "Pain level",
    comfortLevel: "Comfort level",
    perceivedDifficulty: "Perceived difficulty",
    selectDifficulty: "Select difficulty",
    notes: "Notes",
    notesPlaceholder:
      "Example: completed without difficulty, slight discomfort or noticeable improvement.",
    minutes: "min",
    save: "Save record",
    saving: "Saving...",
    success: "Exercise logged successfully.",
    saveError: "Error logging exercise.",

    wellbeing: "Wellbeing summary",
    avgComfort: "Average comfort",
    avgPain: "Average pain",

    latestRecords: "Latest records",
    currentStatus: "Current status",
    monitoring: "Being monitored",
    noRecords: "No records",

    weeklyEvolution: "Weekly evolution",
    weeklyEvolutionText:
      "Analyze consistency, accumulated time and average comfort by week.",
    noProgressYet: "No progress yet",
    noProgressText: "There are no entries in your history yet.",
    performedExercises: "Exercises completed",
    averageComfort: "Average comfort",

    recentRecords: "Latest records",
    noRecentRecords: "No recent records",
    nextStep: "Next step",
    nextStepText:
      "Keep logging exercises to maintain a more complete and accurate history.",
    seePlan: "View plan",

    week: "Week",
    noDate: "No date",
    item: "Item",
  },
};

function translateBackendText(value, language, fallback) {
  if (!value) return fallback;
  if (language !== "en") return value;

  let text = String(value);

  const dictionary = {
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

function getWeekLabel(dateString, text) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return text.noDate;

  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const diffDays = Math.floor((date - startOfYear) / 86400000);
  const week = Math.ceil((diffDays + startOfYear.getDay() + 1) / 7);

  return `${text.week} ${week}`;
}

function formatDate(dateString, language) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString(language === "en" ? "en-GB" : "pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getDefaultDateTimeLocal() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}

function normalizeChoices(optionsData, language) {
  const fallbackChoices =
    language === "en"
      ? [
          { value: "EASY", label: "Easy" },
          { value: "MEDIUM", label: "Medium" },
          { value: "HARD", label: "Hard" },
        ]
      : [
          { value: "EASY", label: "Fácil" },
          { value: "MEDIUM", label: "Médio" },
          { value: "HARD", label: "Difícil" },
        ];

  const choices =
    optionsData?.actions?.POST?.perceived_difficulty?.choices || [];

  if (!Array.isArray(choices) || choices.length === 0) {
    return fallbackChoices;
  }

  return choices.map((choice) => {
    const value = String(choice.value);
    const rawLabel = String(choice.display_name || choice.label || choice.value);

    const translatedLabel =
      language === "en"
        ? rawLabel
            .replace("Fácil", "Easy")
            .replace("Médio", "Medium")
            .replace("Difícil", "Hard")
        : rawLabel
            .replace("Easy", "Fácil")
            .replace("Medium", "Médio")
            .replace("Hard", "Difícil");

    return {
      value,
      label: translatedLabel,
    };
  });
}

export default function ProgressPage() {
  const { language } = useAppPreferences();
  const text = progressText[language] || progressText["pt-PT"];
  const [searchParams] = useSearchParams();

  const [entries, setEntries] = useState([]);
  const [planItemsMap, setPlanItemsMap] = useState({});
  const [planItemsList, setPlanItemsList] = useState([]);
  const [difficultyChoices, setDifficultyChoices] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  const [form, setForm] = useState({
    plan_item: "",
    performed_at: getDefaultDateTimeLocal(),
    duration_minutes: "",
    pain_level: "0",
    comfort_level: "5",
    perceived_difficulty: "",
    notes: "",
  });

  async function loadProgress() {
    try {
      setLoading(true);
      setError("");

      const [progressData, activePlanData, optionsData] = await Promise.all([
        fetchMyProgress(),
        fetchActivePlan().catch(() => null),
        fetchProgressOptions().catch(() => null),
      ]);

      const progressEntries = Array.isArray(progressData) ? progressData : [];
      setEntries(progressEntries);

      const items = Array.isArray(activePlanData?.items)
        ? activePlanData.items
        : [];

      const safeChoices = normalizeChoices(optionsData, language);

      setPlanItemsList(items);
      setDifficultyChoices(safeChoices);

      const map = {};
      for (const item of items) {
        map[String(item.id)] = translateBackendText(
          item.exercise_name,
          language,
          `${text.item} ${item.id}`
        );
      }

      setPlanItemsMap(map);

      const itemFromUrl = searchParams.get("plan_item");
      const firstItemId = items[0]?.id ? String(items[0].id) : "";

      setForm((prev) => ({
        ...prev,
        plan_item:
          itemFromUrl && items.some((item) => String(item.id) === itemFromUrl)
            ? itemFromUrl
            : prev.plan_item || firstItemId,
        perceived_difficulty:
          prev.perceived_difficulty || safeChoices[0]?.value || "",
      }));
    } catch (err) {
      setError(err.message || text.loadError);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProgress();
  }, [language]);

  function getExerciseNameFromPlanItem(planItemId) {
    const directMatch = planItemsMap[String(planItemId)];
    if (directMatch) return directMatch;

    if (planItemsList.length === 1) {
      return translateBackendText(
        planItemsList[0]?.exercise_name,
        language,
        `${text.item} ${planItemId}`
      );
    }

    return `${text.item} ${planItemId}`;
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSaveMessage("");

    try {
      const payload = {
        plan_item: Number(form.plan_item),
        duration_minutes: Number(form.duration_minutes),
        pain_level: Number(form.pain_level),
        comfort_level: Number(form.comfort_level),
        perceived_difficulty: form.perceived_difficulty,
        notes: form.notes,
      };

      const created = await createProgressEntry(payload);

      setEntries((prev) => [created, ...prev]);

      setForm((prev) => ({
        ...prev,
        performed_at: getDefaultDateTimeLocal(),
        duration_minutes: "",
        pain_level: "0",
        comfort_level: "5",
        perceived_difficulty: difficultyChoices[0]?.value || "",
        notes: "",
      }));

      setSaveMessage(text.success);
    } catch (err) {
      setError(err.message || text.saveError);
    } finally {
      setSaving(false);
    }
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
  if (!planItemsList.length) return 0;

  const expectedPerWeek = planItemsList.reduce(
    (sum, item) => sum + Number(item.frequency_per_week || 0),
    0
  );

  if (!expectedPerWeek) return 0;

  const performedThisWeek = entries.filter((entry) => {
    const entryDate = new Date(entry.performed_at);
    const now = new Date();

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    return entryDate >= startOfWeek;
  }).length;

  return Math.min(
    100,
    Math.round((performedThisWeek / expectedPerWeek) * 100)
  );
}, [entries, planItemsList]);

  const weeklyData = useMemo(() => {
    const groups = {};

    for (const entry of entries) {
      const label = getWeekLabel(entry.performed_at, text);

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
          totalTime: `${group.totalTime} ${text.minutes}`,
          progress: Math.min(100, Math.round(group.exercises * 15)),
          comfortAverage: comfortAverage.toFixed(1),
        };
      })
      .sort((a, b) => {
        const aNum = Number(a.week.replace(/\D/g, ""));
        const bNum = Number(b.week.replace(/\D/g, ""));
        return aNum - bNum;
      });
  }, [entries, text]);

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

          <div className="userArea">
            {text.hello}, {text.userFallback}
          </div>
        </div>

        <main className="progressPrimePage">
          <section className="progressPrimeHeader">
            <div>
              <h1>{text.title}</h1>
              <p>{text.subtitle}</p>
            </div>

            <div className="progressPrimeHeaderBadge">
              <strong>{progressPercent}%</strong>
              <span>{text.progressGeneral}</span>
            </div>
          </section>

          <PatientSubnav />

          {loading && (
            <div className="progressPrimeState">
              <h3>{text.loadingTitle}</h3>
              <p>{text.loadingText}</p>
            </div>
          )}

          {error && !loading && (
            <div className="progressPrimeState">
              <h3>{text.errorTitle}</h3>
              <p>{error}</p>
            </div>
          )}

          {saveMessage && (
            <div className="progressPrimeSuccess">{saveMessage}</div>
          )}

          {!loading && (
            <>
              <section className="progressPrimeStats">
                <div className="progressPrimeStat">
                  <div className="progressPrimeStatIcon">↗</div>
                  <span>{text.progressGeneral}</span>
                  <strong>{progressPercent}%</strong>
                  <p>{text.progressGeneralText}</p>
                </div>

                <div className="progressPrimeStat">
                  <div className="progressPrimeStatIcon">◷</div>
                  <span>{text.totalTime}</span>
                  <strong>
                    {totalMinutes} {text.minutes}
                  </strong>
                  <p>{text.totalTimeText}</p>
                </div>

                <div className="progressPrimeStat">
                  <div className="progressPrimeStatIcon">✓</div>
                  <span>{text.registeredExercises}</span>
                  <strong>{totalExercises}</strong>
                  <p>{text.registeredExercisesText}</p>
                </div>
              </section>

              <section className="progressPrimeMainGrid">
                <form className="progressPrimeForm" onSubmit={handleSubmit}>
                  <div className="progressPrimeFormHeader">
                    <div>
                      <h2>{text.registerTitle}</h2>
                      <p>{text.registerSubtitle}</p>
                    </div>
                  </div>

                  <div className="progressPrimeFormGrid">
                    <div className="progressPrimeField progressPrimeFieldWide">
                      <label>{text.exercise}</label>
                      <select
                        name="plan_item"
                        value={form.plan_item}
                        onChange={handleChange}
                        required
                      >
                        <option value="">{text.selectExercise}</option>
                        {planItemsList.map((item) => (
                          <option key={item.id} value={item.id}>
                            {translateBackendText(
                              item.exercise_name,
                              language,
                              `${text.item} ${item.id}`
                            )}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="progressPrimeField">
                      <label>{text.performedAt}</label>
                      <input
                        type="datetime-local"
                        name="performed_at"
                        value={form.performed_at}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="progressPrimeField">
                      <label>{text.duration}</label>
                      <input
                        type="number"
                        name="duration_minutes"
                        value={form.duration_minutes}
                        onChange={handleChange}
                        min="1"
                        placeholder="10"
                        required
                      />
                    </div>

                    <div className="progressPrimeField">
                      <label>{text.painLevel}</label>
                      <input
                        type="number"
                        name="pain_level"
                        value={form.pain_level}
                        onChange={handleChange}
                        min="0"
                        max="10"
                        required
                      />
                    </div>

                    <div className="progressPrimeField">
                      <label>{text.comfortLevel}</label>
                      <input
                        type="number"
                        name="comfort_level"
                        value={form.comfort_level}
                        onChange={handleChange}
                        min="0"
                        max="10"
                        required
                      />
                    </div>

                    <div className="progressPrimeField">
                      <label>{text.perceivedDifficulty}</label>
                      <select
                        name="perceived_difficulty"
                        value={form.perceived_difficulty}
                        onChange={handleChange}
                        required
                      >
                        <option value="">{text.selectDifficulty}</option>

                        {difficultyChoices.map((choice) => (
                          <option key={choice.value} value={choice.value}>
                            {choice.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="progressPrimeField progressPrimeFieldWide">
                      <label>{text.notes}</label>
                      <textarea
                        name="notes"
                        value={form.notes}
                        onChange={handleChange}
                        placeholder={text.notesPlaceholder}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="progressPrimeSubmit"
                    disabled={saving || !form.plan_item || !form.perceived_difficulty}
                  >
                    {saving ? text.saving : text.save}
                  </button>
                </form>

                <aside className="progressPrimeWellbeing">
                  <div className="progressPrimeCardTitle">
                    <div className="progressPrimeStatIcon">◉</div>
                    <h3>{text.wellbeing}</h3>
                  </div>

                  <div className="progressPrimeWellbeingGrid">
                    <div>
                      <strong>{avgComfort ?? "-"}</strong>
                      <span>{text.avgComfort}</span>
                    </div>

                    <div>
                      <strong>{avgPain ?? "-"}</strong>
                      <span>{text.avgPain}</span>
                    </div>
                  </div>

                  <div className="progressPrimeSummaryList">
                    <div>
                      <span>{text.latestRecords}</span>
                      <strong>{latestEntries.length}</strong>
                    </div>

                    <div>
                      <span>{text.totalTime}</span>
                      <strong>
                        {totalMinutes} {text.minutes}
                      </strong>
                    </div>

                    <div>
                      <span>{text.currentStatus}</span>
                      <strong>
                        {entries.length ? text.monitoring : text.noRecords}
                      </strong>
                    </div>
                  </div>
                </aside>
              </section>

              <section className="progressPrimeSectionTitle">
                <div>
                  <h2>{text.weeklyEvolution}</h2>
                  <p>{text.weeklyEvolutionText}</p>
                </div>
              </section>

              <section className="progressPrimeWeeks">
                {weeklyData.length === 0 ? (
                  <div className="progressPrimeState">
                    <h3>{text.noProgressYet}</h3>
                    <p>{text.noProgressText}</p>
                  </div>
                ) : (
                  weeklyData.map((item) => (
                    <article key={item.week} className="progressPrimeWeek">
                      <div className="progressPrimeWeekTop">
                        <h3>{item.week}</h3>
                        <strong>{item.progress}%</strong>
                      </div>

                      <div className="progressPrimeWeekInfo">
                        <div>
                          <span>{text.performedExercises}</span>
                          <strong>{item.exercises}</strong>
                        </div>

                        <div>
                          <span>{text.totalTime}</span>
                          <strong>{item.totalTime}</strong>
                        </div>

                        <div>
                          <span>{text.averageComfort}</span>
                          <strong>{item.comfortAverage}</strong>
                        </div>
                      </div>

                      <div className="progressPrimeWeekBar">
                        <div style={{ width: `${item.progress}%` }} />
                      </div>
                    </article>
                  ))
                )}
              </section>

              <section className="progressPrimeBottom">
                <div className="progressPrimeRecent">
                  <div className="progressPrimeCardTitle">
                    <div className="progressPrimeStatIcon">▤</div>
                    <h3>{text.recentRecords}</h3>
                  </div>

                  <div className="progressPrimeRecentList">
                    {latestEntries.length === 0 ? (
                      <div className="progressPrimeRecentItem">
                        <span>{text.noRecentRecords}</span>
                        <strong>-</strong>
                      </div>
                    ) : (
                      latestEntries.map((entry) => (
                        <div key={entry.id} className="progressPrimeRecentItem">
                          <span>
                            {formatDate(entry.performed_at, language)} ·{" "}
                            {getExerciseNameFromPlanItem(entry.plan_item)}
                          </span>
                          <strong>
                            {entry.duration_minutes || 0} {text.minutes}
                          </strong>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="progressPrimeNext">
                  <h3>{text.nextStep}</h3>
                  <p>{text.nextStepText}</p>

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