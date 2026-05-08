import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import TherapistSubnav from "../../components/TherapistSubnav";
import {
  fetchTherapistPatients,
  fetchTherapistPatientProgress,
} from "../../api/therapist";
import { useAppPreferences } from "../../context/AppPreferencesContext.jsx";

const progressText = {
  "pt-PT": {
    hello: "Olá",
    userFallback: "Terapeuta",
    title: "Progresso dos Pacientes",
    subtitle:
      "Acompanha adesão, dor, conforto, tempo de exercício e notas clínicas registadas pelos pacientes.",
    selectPatient: "Selecionar paciente",
    patient: "Paciente",
    loadingPatients: "A carregar pacientes...",
    loadingProgress: "A carregar progresso...",
    noPatients: "Sem pacientes disponíveis",
    patientSummary: "Resumo do paciente",
    name: "Nome",
    username: "Username",
    phone: "Telefone",
    totalRecords: "Registos totais",
    totalTime: "Tempo acumulado",
    differentExercises: "Exercícios diferentes",
    clinicalIndicators: "Indicadores clínicos",
    averagePain: "Dor média",
    averageComfort: "Conforto médio",
    averageDifficulty: "Dificuldade média",
    exerciseSummary: "Resumo por exercício",
    detailedRecords: "Registos detalhados",
    noProgress: "Este paciente ainda não tem registos de progresso.",
    noDetailedRecords: "Sem registos de progresso para este paciente.",
    records: "registos",
    accumulated: "acumulados",
    duration: "Duração",
    pain: "Dor",
    comfort: "Conforto",
    difficulty: "Dificuldade",
    notes: "Notas",
    minutes: "min",
    searchPlaceholder: "Pesquisar exercício ou nota...",
    allDifficulties: "Todas as dificuldades",
    filterTitle: "Filtros de análise",
    all: "Todos",
    easy: "Fácil",
    medium: "Média",
    hard: "Difícil",
    loadPatientsError: "Erro ao carregar pacientes.",
    loadProgressError: "Erro ao carregar progresso do paciente.",
  },
  en: {
    hello: "Hi",
    userFallback: "Therapist",
    title: "Patient Progress",
    subtitle:
      "Track adherence, pain, comfort, exercise time and clinical notes logged by patients.",
    selectPatient: "Select patient",
    patient: "Patient",
    loadingPatients: "Loading patients...",
    loadingProgress: "Loading progress...",
    noPatients: "No patients available",
    patientSummary: "Patient summary",
    name: "Name",
    username: "Username",
    phone: "Phone",
    totalRecords: "Total records",
    totalTime: "Total time",
    differentExercises: "Different exercises",
    clinicalIndicators: "Clinical indicators",
    averagePain: "Average pain",
    averageComfort: "Average comfort",
    averageDifficulty: "Average difficulty",
    exerciseSummary: "Exercise summary",
    detailedRecords: "Detailed records",
    noProgress: "This patient does not have progress records yet.",
    noDetailedRecords: "No progress records for this patient.",
    records: "records",
    accumulated: "accumulated",
    duration: "Duration",
    pain: "Pain",
    comfort: "Comfort",
    difficulty: "Difficulty",
    notes: "Notes",
    minutes: "min",
    searchPlaceholder: "Search exercise or note...",
    allDifficulties: "All difficulties",
    filterTitle: "Analysis filters",
    all: "All",
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",
    loadPatientsError: "Error loading patients.",
    loadProgressError: "Error loading patient progress.",
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

function average(values) {
  if (!values.length) return 0;
  const total = values.reduce((sum, value) => sum + value, 0);
  return total / values.length;
}

function translateDifficulty(value, text) {
  if (!value) return "-";

  const normalized = String(value).toUpperCase();

  if (normalized === "EASY") return text.easy;
  if (normalized === "MEDIUM") return text.medium;
  if (normalized === "HARD") return text.hard;

  return value;
}

function translateExerciseName(value, language) {
  if (!value) return "-";

  let output = String(value);

  const ptToEn = {
    "Elevação de braço": "Arm raise",
    "Elevação de perna": "Leg raise",
    Alongamento: "Stretching",
    Mobilidade: "Mobility",
    Fortalecimento: "Strengthening",
    Agachamento: "Squat",
    Prancha: "Plank",
    Flexão: "Push-up",
    Caminhada: "Walking",
  };

  const enToPt = Object.fromEntries(
    Object.entries(ptToEn).map(([pt, en]) => [en, pt])
  );

  const dictionary = language === "en" ? ptToEn : enToPt;

  Object.entries(dictionary).forEach(([from, to]) => {
    output = output.replaceAll(from, to);
  });

  return output;
}

export default function TherapistPatientProgressPage() {
  const { language } = useAppPreferences();
  const text = progressText[language] || progressText["pt-PT"];

  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [progressEntries, setProgressEntries] = useState([]);

  const [loadingPatients, setLoadingPatients] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("ALL");

  useEffect(() => {
    async function loadPatients() {
      try {
        setError("");
        const data = await fetchTherapistPatients();
        const safePatients = Array.isArray(data) ? data : [];

        setPatients(safePatients);

        if (safePatients.length > 0) {
          setSelectedPatientId(String(safePatients[0].user_id));
        }
      } catch (err) {
        setError(err.message || text.loadPatientsError);
      } finally {
        setLoadingPatients(false);
      }
    }

    loadPatients();
  }, [text.loadPatientsError]);

  useEffect(() => {
    async function loadProgress() {
      if (!selectedPatientId) {
        setProgressEntries([]);
        return;
      }

      try {
        setLoadingProgress(true);
        setError("");

        const data = await fetchTherapistPatientProgress(selectedPatientId);
        setProgressEntries(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || text.loadProgressError);
      } finally {
        setLoadingProgress(false);
      }
    }

    loadProgress();
  }, [selectedPatientId, text.loadProgressError]);

  const selectedPatient = useMemo(() => {
    return patients.find(
      (patient) => String(patient.user_id) === String(selectedPatientId)
    );
  }, [patients, selectedPatientId]);

  const filteredEntries = useMemo(() => {
    const q = search.trim().toLowerCase();

    return progressEntries.filter((entry) => {
      const exerciseName = translateExerciseName(
        entry.exercise_name || "",
        language
      ).toLowerCase();

      const notes = String(entry.notes || "").toLowerCase();

      const matchesSearch =
        !q || exerciseName.includes(q) || notes.includes(q);

      const matchesDifficulty =
        difficultyFilter === "ALL" ||
        String(entry.perceived_difficulty || "").toUpperCase() ===
          difficultyFilter;

      return matchesSearch && matchesDifficulty;
    });
  }, [progressEntries, search, difficultyFilter, language]);

  const totalEntries = filteredEntries.length;

  const totalMinutes = useMemo(() => {
    return filteredEntries.reduce(
      (sum, item) => sum + Number(item.duration_minutes || 0),
      0
    );
  }, [filteredEntries]);

  const avgPain = useMemo(() => {
    const values = filteredEntries
      .map((item) => Number(item.pain_level))
      .filter((value) => !Number.isNaN(value) && value >= 0);

    return values.length ? average(values).toFixed(1) : "-";
  }, [filteredEntries]);

  const avgComfort = useMemo(() => {
    const values = filteredEntries
      .map((item) => Number(item.comfort_level))
      .filter((value) => !Number.isNaN(value) && value >= 0);

    return values.length ? average(values).toFixed(1) : "-";
  }, [filteredEntries]);

  const avgDifficulty = useMemo(() => {
    const numericValues = filteredEntries
      .map((item) => Number(item.perceived_difficulty))
      .filter((value) => !Number.isNaN(value) && value >= 0);

    if (numericValues.length) return average(numericValues).toFixed(1);

    const difficulties = filteredEntries
      .map((item) => String(item.perceived_difficulty || "").toUpperCase())
      .filter(Boolean);

    if (!difficulties.length) return "-";

    const scoreMap = {
      EASY: 1,
      MEDIUM: 2,
      HARD: 3,
    };

    const scores = difficulties
      .map((value) => scoreMap[value])
      .filter((value) => value);

    return scores.length ? average(scores).toFixed(1) : "-";
  }, [filteredEntries]);

  const exerciseSummary = useMemo(() => {
    const map = {};

    for (const entry of filteredEntries) {
      const key = translateExerciseName(
        entry.exercise_name || `${text.exercise} ${entry.plan_item}`,
        language
      );

      if (!map[key]) {
        map[key] = {
          name: key,
          count: 0,
          minutes: 0,
          painValues: [],
          comfortValues: [],
        };
      }

      map[key].count += 1;
      map[key].minutes += Number(entry.duration_minutes || 0);

      const pain = Number(entry.pain_level);
      const comfort = Number(entry.comfort_level);

      if (!Number.isNaN(pain)) map[key].painValues.push(pain);
      if (!Number.isNaN(comfort)) map[key].comfortValues.push(comfort);
    }

    return Object.values(map)
      .map((item) => ({
        ...item,
        avgPain: item.painValues.length
          ? average(item.painValues).toFixed(1)
          : "-",
        avgComfort: item.comfortValues.length
          ? average(item.comfortValues).toFixed(1)
          : "-",
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredEntries, language, text.exercise]);

  const latestEntry = useMemo(() => {
    return [...progressEntries].sort(
      (a, b) => new Date(b.performed_at) - new Date(a.performed_at)
    )[0];
  }, [progressEntries]);

  const patientName =
    selectedPatient?.display_name || selectedPatient?.username || "-";

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

        <main className="patientProgressProPage">
          <section className="patientProgressHero">
            <div>
              <span>{text.patientSummary}</span>
              <h1>{text.title}</h1>
              <p>{text.subtitle}</p>
            </div>

            <div className="patientProgressHeroCard">
              <span>{text.patient}</span>
              <strong>{patientName}</strong>
              <p>
                {latestEntry
                  ? formatDateTime(latestEntry.performed_at, language)
                  : "-"}
              </p>
            </div>
          </section>

          <TherapistSubnav />

          {error && <div className="theraPlanPrimeError">{error}</div>}

          <section className="patientProgressControlGrid">
            <div className="patientProgressControlCard">
              <h2>{text.selectPatient}</h2>

              {loadingPatients ? (
                <div className="patientProgressEmpty">
                  {text.loadingPatients}
                </div>
              ) : patients.length === 0 ? (
                <div className="patientProgressEmpty">{text.noPatients}</div>
              ) : (
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                >
                  {patients.map((patient) => (
                    <option key={patient.user_id} value={patient.user_id}>
                      {patient.display_name || patient.username}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="patientProgressControlCard">
              <h2>{text.filterTitle}</h2>

              <div className="patientProgressFilters">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={text.searchPlaceholder}
                />

                <select
                  value={difficultyFilter}
                  onChange={(e) => setDifficultyFilter(e.target.value)}
                >
                  <option value="ALL">{text.allDifficulties}</option>
                  <option value="EASY">{text.easy}</option>
                  <option value="MEDIUM">{text.medium}</option>
                  <option value="HARD">{text.hard}</option>
                </select>
              </div>
            </div>

            <div className="patientProgressControlCard">
              <h2>{text.patientSummary}</h2>

              <div className="patientProgressInfoList">
                <div>
                  <span>{text.name}</span>
                  <strong>{patientName}</strong>
                </div>

                <div>
                  <span>{text.username}</span>
                  <strong>{selectedPatient?.username || "-"}</strong>
                </div>

                <div>
                  <span>{text.phone}</span>
                  <strong>{selectedPatient?.phone || "-"}</strong>
                </div>
              </div>
            </div>
          </section>

          <section className="patientProgressMetrics">
            <div>
              <span>{text.totalRecords}</span>
              <strong>{totalEntries}</strong>
            </div>

            <div>
              <span>{text.totalTime}</span>
              <strong>
                {totalMinutes} {text.minutes}
              </strong>
            </div>

            <div>
              <span>{text.differentExercises}</span>
              <strong>{exerciseSummary.length}</strong>
            </div>
          </section>

          <section className="patientProgressMainGrid">
            <aside className="patientProgressClinicalCard">
              <div className="patientProgressCardTitle">
                <span>●</span>
                <h2>{text.clinicalIndicators}</h2>
              </div>

              <div className="patientProgressClinicalValues">
                <div>
                  <span>{text.averagePain}</span>
                  <strong>{avgPain}</strong>
                </div>

                <div>
                  <span>{text.averageComfort}</span>
                  <strong>{avgComfort}</strong>
                </div>

                <div>
                  <span>{text.averageDifficulty}</span>
                  <strong>{avgDifficulty}</strong>
                </div>
              </div>
            </aside>

            <section className="patientProgressPanel">
              <div className="patientProgressPanelHeader">
                <h2>{text.exerciseSummary}</h2>
              </div>

              {loadingProgress ? (
                <div className="patientProgressEmpty">
                  {text.loadingProgress}
                </div>
              ) : exerciseSummary.length === 0 ? (
                <div className="patientProgressEmpty">{text.noProgress}</div>
              ) : (
                <div className="patientProgressExerciseList">
                  {exerciseSummary.map((item) => (
                    <article key={item.name} className="patientProgressExercise">
                      <div>
                        <h3>{item.name}</h3>
                        <p>
                          {item.count} {text.records} · {item.minutes}{" "}
                          {text.minutes} {text.accumulated}
                        </p>
                      </div>

                      <div className="patientProgressExerciseStats">
                        <span>
                          {text.pain}: <strong>{item.avgPain}</strong>
                        </span>
                        <span>
                          {text.comfort}: <strong>{item.avgComfort}</strong>
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </section>

          <section className="patientProgressRecords">
            <div className="patientProgressPanelHeader">
              <h2>{text.detailedRecords}</h2>
            </div>

            {loadingProgress ? (
              <div className="patientProgressEmpty">{text.loadingProgress}</div>
            ) : filteredEntries.length === 0 ? (
              <div className="patientProgressEmpty">
                {text.noDetailedRecords}
              </div>
            ) : (
              <div className="patientProgressTimeline">
                {[...filteredEntries]
                  .sort(
                    (a, b) =>
                      new Date(b.performed_at) - new Date(a.performed_at)
                  )
                  .map((entry) => (
                    <article key={entry.id} className="patientProgressRecord">
                      <div className="patientProgressRecordDot" />

                      <div className="patientProgressRecordBody">
                        <div className="patientProgressRecordTop">
                          <div>
                            <h3>
                              {translateExerciseName(
                                entry.exercise_name ||
                                  `${text.exercise} ${entry.plan_item}`,
                                language
                              )}
                            </h3>

                            <p>{formatDateTime(entry.performed_at, language)}</p>
                          </div>

                          <span>
                            {translateDifficulty(
                              entry.perceived_difficulty,
                              text
                            )}
                          </span>
                        </div>

                        <div className="patientProgressRecordStats">
                          <div>
                            <span>{text.duration}</span>
                            <strong>
                              {entry.duration_minutes || 0} {text.minutes}
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
                        </div>

                        {entry.notes && (
                          <div className="patientProgressNotes">
                            <span>{text.notes}</span>
                            <p>{entry.notes}</p>
                          </div>
                        )}
                      </div>
                    </article>
                  ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}