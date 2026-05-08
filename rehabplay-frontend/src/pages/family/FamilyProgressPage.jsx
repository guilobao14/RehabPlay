import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchFamilyLinks,
  fetchFamilyPatientProgress,
} from "../../api/family";
import { useAppPreferences } from "../../context/AppPreferencesContext.jsx";

const familyProgressText = {
  "pt-PT": {
    hello: "Olá",
    family: "Familiar",
    title: "Progresso do Paciente",
    subtitle:
      "Consulta resumida da evolução clínica dentro das permissões autorizadas.",
    loadingPatients: "A carregar pacientes...",
    loadingProgress: "A carregar progresso...",
    linksError: "Erro ao carregar ligações familiares.",
    progressError: "Erro ao carregar progresso do paciente.",

    selectPatient: "Selecionar paciente",
    noPatients: "Não existem pacientes com acesso ao progresso.",
    patientSummary: "Resumo do paciente",
    patient: "Paciente",
    totalRecords: "Registos totais",
    accumulatedTime: "Tempo acumulado",
    currentProgress: "Progresso atual",
    progressText: "Estimativa baseada no número de registos disponíveis.",
    weekRecords: "Registos esta semana",
    weekRecordsText: "Entradas associadas à semana atual.",
    differentExercises: "Exercícios diferentes",
    differentExercisesText: "Exercícios com registos dentro do histórico visível.",
    indicators: "Indicadores",
    clinical: "Clínico",
    avgPain: "Dor média",
    avgComfort: "Conforto médio",
    totalTime: "Tempo total",
    generalReading: "Leitura geral",
    summary: "Resumo",
    hasProgress: "Existe progresso registado",
    noEnoughData: "Sem dados suficientes",
    generalText:
      "Esta vista mostra apenas informação autorizada para acompanhamento familiar, sem acesso a mensagens privadas.",
    latestRecords: "Últimos registos",
    latestRecordsText: "Histórico recente das sessões e exercícios realizados",
    noRecords: "Sem registos",
    noRecordsText:
      "Ainda não existem entradas de progresso para este paciente.",
    exercise: "Exercício",
    date: "Data",
    pain: "Dor",
    comfort: "Conforto",
    difficulty: "Dificuldade",
    notes: "Notas",
    quickActions: "Ações rápidas",
    backDashboard: "Voltar ao dashboard",
    viewLinks: "Ver ligações",
    privacyNote: "Nota de privacidade",
    limitedTracking: "Acompanhamento limitado",
    limitedText:
      "Esta página serve apenas para apoio familiar autorizado. As conversas clínicas entre paciente e terapeuta não são apresentadas.",
    minutes: "min",
  },

  en: {
    hello: "Hi",
    family: "Family",
    title: "Patient Progress",
    subtitle:
      "View a summarized clinical evolution within authorized permissions.",
    loadingPatients: "Loading patients...",
    loadingProgress: "Loading progress...",
    linksError: "Error loading family links.",
    progressError: "Error loading patient progress.",

    selectPatient: "Select patient",
    noPatients: "There are no patients with progress access.",
    patientSummary: "Patient summary",
    patient: "Patient",
    totalRecords: "Total records",
    accumulatedTime: "Accumulated time",
    currentProgress: "Current progress",
    progressText: "Estimate based on the number of available records.",
    weekRecords: "Records this week",
    weekRecordsText: "Entries associated with the current week.",
    differentExercises: "Different exercises",
    differentExercisesText: "Exercises with records in the visible history.",
    indicators: "Indicators",
    clinical: "Clinical",
    avgPain: "Average pain",
    avgComfort: "Average comfort",
    totalTime: "Total time",
    generalReading: "General reading",
    summary: "Summary",
    hasProgress: "Progress has been recorded",
    noEnoughData: "Not enough data",
    generalText:
      "This view only shows authorized family monitoring information, with no access to private messages.",
    latestRecords: "Latest records",
    latestRecordsText: "Recent history of sessions and completed exercises",
    noRecords: "No records",
    noRecordsText:
      "There are no progress entries for this patient yet.",
    exercise: "Exercise",
    date: "Date",
    pain: "Pain",
    comfort: "Comfort",
    difficulty: "Difficulty",
    notes: "Notes",
    quickActions: "Quick actions",
    backDashboard: "Back to dashboard",
    viewLinks: "View links",
    privacyNote: "Privacy note",
    limitedTracking: "Limited monitoring",
    limitedText:
      "This page is only for authorized family support. Clinical conversations between patient and therapist are not shown.",
    minutes: "min",
  },
};

function formatDateTime(value, language) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString(language === "en" ? "en-GB" : "pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getWeekLabel(dateString, language) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return language === "en" ? "No date" : "Sem data";
  }

  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const diffDays = Math.floor((date - startOfYear) / 86400000);
  const week = Math.ceil((diffDays + startOfYear.getDay() + 1) / 7);

  return `${language === "en" ? "Week" : "Semana"} ${week}`;
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function normalizeLink(raw, text) {
  return {
    id: raw.id,
    patientId: raw.patient ?? raw.patient_id ?? raw.patient_user_id ?? null,
    patientName:
      raw.patient_display_name ||
      raw.patient_name ||
      raw.patient_username ||
      `${text.patient} ${raw.patient ?? raw.patient_id ?? ""}`,
    canViewProgress:
      raw.can_view_progress === true || raw.can_view_progress === false
        ? raw.can_view_progress
        : false,
  };
}

function translateDifficulty(value, text) {
  const normalized = String(value || "").toUpperCase();

  if (normalized === "EASY") return text.easy || "Easy";
  if (normalized === "MEDIUM") return text.medium || "Medium";
  if (normalized === "HARD") return text.hard || "Hard";

  return value || "-";
}

export default function FamilyProgressPage() {
  const { language } = useAppPreferences();
  const text = familyProgressText[language] || familyProgressText["pt-PT"];

  const [links, setLinks] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [entries, setEntries] = useState([]);

  const [loadingLinks, setLoadingLinks] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadLinks() {
      try {
        setError("");

        const data = await fetchFamilyLinks();
        const safeLinks = Array.isArray(data)
          ? data.map((item) => normalizeLink(item, text)).filter((item) => item.canViewProgress)
          : [];

        setLinks(safeLinks);

        if (safeLinks.length > 0) {
          setSelectedPatientId(String(safeLinks[0].patientId));
        }
      } catch (err) {
        setError(err.message || text.linksError);
      } finally {
        setLoadingLinks(false);
      }
    }

    loadLinks();
  }, [text]);

  useEffect(() => {
    async function loadProgress() {
      if (!selectedPatientId) {
        setEntries([]);
        return;
      }

      try {
        setLoadingProgress(true);
        setError("");

        const data = await fetchFamilyPatientProgress(selectedPatientId);
        setEntries(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || text.progressError);
      } finally {
        setLoadingProgress(false);
      }
    }

    loadProgress();
  }, [selectedPatientId, text.progressError]);

  const selectedLink = useMemo(() => {
    return (
      links.find((item) => String(item.patientId) === String(selectedPatientId)) ||
      null
    );
  }, [links, selectedPatientId]);

  const totalEntries = entries.length;

  const totalMinutes = useMemo(() => {
    return entries.reduce(
      (sum, item) => sum + Number(item.duration_minutes || 0),
      0
    );
  }, [entries]);

  const avgPain = useMemo(() => {
    const values = entries
      .map((item) => Number(item.pain_level))
      .filter((value) => !Number.isNaN(value) && value >= 0);

    return values.length ? average(values).toFixed(1) : "-";
  }, [entries]);

  const avgComfort = useMemo(() => {
    const values = entries
      .map((item) => Number(item.comfort_level))
      .filter((value) => !Number.isNaN(value) && value >= 0);

    return values.length ? average(values).toFixed(1) : "-";
  }, [entries]);

  const weeklyCount = useMemo(() => {
    const currentWeek = getWeekLabel(new Date().toISOString(), language);

    return entries.filter(
      (entry) => getWeekLabel(entry.performed_at, language) === currentWeek
    ).length;
  }, [entries, language]);

  const uniqueExercises = useMemo(() => {
    return new Set(entries.map((item) => item.exercise_name).filter(Boolean))
      .size;
  }, [entries]);

  const latestEntries = useMemo(() => {
    return [...entries]
      .sort((a, b) => new Date(b.performed_at) - new Date(a.performed_at))
      .slice(0, 6);
  }, [entries]);

  const progressPercent = useMemo(() => {
    if (!entries.length) return 0;
    return Math.min(100, Math.round(entries.length * 10));
  }, [entries]);

  return (
    <div className="appPage">
      <div className="appShellMockup">
        <div className="topbar">
          <Link to="/dashboard" className="brandLink">
            RehabPlay
          </Link>

          <div className="userArea">
            {text.hello}, {text.family}
          </div>
        </div>

        <main className="familyDashPrimePage">
          <section className="familyDashHero">
            <div className="familyDashHeroContent">
              <span>{text.limitedTracking}</span>
              <h1>{text.title}</h1>
              <p>{text.subtitle}</p>
            </div>

            <div className="familyDashHeroPanel">
              <span>{text.patient}</span>
              <strong>{selectedLink?.patientName || "-"}</strong>
              <p>
                {latestEntries[0]
                  ? formatDateTime(latestEntries[0].performed_at, language)
                  : "-"}
              </p>
            </div>
          </section>

          {error && <div className="theraNoticeError">{error}</div>}

          <section className="familyDashMainGrid">
            <div className="familyDashCard">
              <div className="familyDashCardHeader">
                <div>
                  <h2>{text.selectPatient}</h2>
                  <span>{text.patientSummary}</span>
                </div>
              </div>

              {loadingLinks ? (
                <div className="familyDashNote">
                  <p>{text.loadingPatients}</p>
                </div>
              ) : links.length === 0 ? (
                <div className="familyDashNote">
                  <p>{text.noPatients}</p>
                </div>
              ) : (
                <div className="familyDashInfoList">
                  <div>
                    <span>{text.patient}</span>
                    <strong>{selectedLink?.patientName || "-"}</strong>
                  </div>

                  <select
                    className="input"
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                  >
                    {links.map((link) => (
                      <option key={link.id} value={link.patientId}>
                        {link.patientName}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="familyDashProgressCard">
              <div className="familyDashCardHeader">
                <div>
                  <h2>{text.currentProgress}</h2>
                  <span>{text.summary}</span>
                </div>
              </div>

              <div className="familyDashProgressValue">{progressPercent}%</div>
              <div className="familyDashProgressText">{text.currentProgress}</div>

              <div className="familyDashProgressBar">
                <div style={{ width: `${progressPercent}%` }} />
              </div>

              <p>{text.progressText}</p>
            </div>

            <div className="familyDashCard">
              <div className="familyDashCardHeader">
                <div>
                  <h2>{text.patientSummary}</h2>
                  <span>{text.summary}</span>
                </div>
              </div>

              <div className="familyDashInfoList">
                <div>
                  <span>{text.totalRecords}</span>
                  <strong>{totalEntries}</strong>
                </div>

                <div>
                  <span>{text.accumulatedTime}</span>
                  <strong>
                    {totalMinutes} {text.minutes}
                  </strong>
                </div>
              </div>
            </div>
          </section>

          <section className="familyDashStats" style={{ marginTop: 22 }}>
            <div>
              <span>{text.weekRecords}</span>
              <strong>{weeklyCount}</strong>
              <p>{text.weekRecordsText}</p>
            </div>

            <div>
              <span>{text.differentExercises}</span>
              <strong>{uniqueExercises}</strong>
              <p>{text.differentExercisesText}</p>
            </div>

            <div>
              <span>{text.totalTime}</span>
              <strong>
                {totalMinutes} {text.minutes}
              </strong>
              <p>{text.generalText}</p>
            </div>
          </section>

          <section className="familyDashMainGrid">
            <div className="familyDashCard">
              <div className="familyDashCardHeader">
                <div>
                  <h2>{text.indicators}</h2>
                  <span>{text.clinical}</span>
                </div>
              </div>

              <div className="familyDashInfoList">
                <div>
                  <span>{text.avgPain}</span>
                  <strong>{avgPain}</strong>
                </div>

                <div>
                  <span>{text.avgComfort}</span>
                  <strong>{avgComfort}</strong>
                </div>

                <div>
                  <span>{text.totalTime}</span>
                  <strong>
                    {totalMinutes} {text.minutes}
                  </strong>
                </div>
              </div>
            </div>

            <div className="familyDashCard">
              <div className="familyDashCardHeader">
                <div>
                  <h2>{text.generalReading}</h2>
                  <span>{text.summary}</span>
                </div>
              </div>

              <div className="familyDashNote">
                <strong>
                  {entries.length ? text.hasProgress : text.noEnoughData}
                </strong>
                <p>{text.generalText}</p>
              </div>
            </div>
          </section>

          <section className="familyDashSectionTitle">
            <div>
              <h2>{text.latestRecords}</h2>
              <p>{text.latestRecordsText}</p>
            </div>
          </section>

          <section className="familyLinksGridReal">
            {loadingProgress ? (
              <div className="familyDashCard">
                <div className="familyDashNote">
                  <p>{text.loadingProgress}</p>
                </div>
              </div>
            ) : latestEntries.length === 0 ? (
              <div className="familyDashCard">
                <div className="familyDashNote">
                  <strong>{text.noRecords}</strong>
                  <p>{text.noRecordsText}</p>
                </div>
              </div>
            ) : (
              latestEntries.map((entry) => (
                <article key={entry.id} className="familyDashCard">
                  <div className="familyDashCardHeader">
                    <div>
                      <h2>
                        {entry.exercise_name ||
                          `${text.exercise} ${entry.plan_item}`}
                      </h2>
                      <span>
                        {entry.duration_minutes || 0} {text.minutes}
                      </span>
                    </div>
                  </div>

                  <div className="familyDashInfoList">
                    <div>
                      <span>{text.date}</span>
                      <strong>
                        {formatDateTime(entry.performed_at, language)}
                      </strong>
                    </div>

                    <div>
                      <span>{text.pain}</span>
                      <strong>{entry.pain_level ?? "-"}</strong>
                    </div>

                    <div>
                      <span>{text.comfort}</span>
                      <strong>{entry.comfort_level ?? "-"}</strong>
                    </div>

                    <div>
                      <span>{text.difficulty}</span>
                      <strong>{translateDifficulty(entry.perceived_difficulty, text)}</strong>
                    </div>
                  </div>

                  {entry.notes && (
                    <div className="familyDashNote">
                      <strong>{text.notes}</strong>
                      <p>{entry.notes}</p>
                    </div>
                  )}
                </article>
              ))
            )}
          </section>

          <section className="familyDashBottom">
            <div className="familyDashCard">
              <div className="familyDashCardHeader">
                <div>
                  <h2>{text.quickActions}</h2>
                </div>
              </div>

              <div className="familyQuickActions" style={{ marginTop: 18 }}>
                <Link to="/family" className="familyGhostLinkBtn">
                  {text.backDashboard}
                </Link>

                <Link to="/family/links" className="familyGhostLinkBtn">
                  {text.viewLinks}
                </Link>
              </div>
            </div>

            <div className="familyDashCard">
              <div className="familyDashCardHeader">
                <div>
                  <h2>{text.privacyNote}</h2>
                </div>
              </div>

              <div className="familyDashNote">
                <strong>{text.limitedTracking}</strong>
                <p>{text.limitedText}</p>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}