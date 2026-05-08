import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import TherapistSubnav from "../../components/TherapistSubnav";
import {
  fetchTherapistPatients,
  createTherapistChallenge,
} from "../../api/therapist";
import { useAppPreferences } from "../../context/AppPreferencesContext.jsx";

const textPage = {
  "pt-PT": {
    hello: "Olá",
    userFallback: "Terapeuta",
    title: "Desafios dos Pacientes",
    subtitle:
      "Cria desafios personalizados e atribui-os a todos os pacientes ou apenas a pacientes específicos.",
    create: "Criar desafio",
    challengeInfo: "Define o objetivo, duração, recompensa e quem deve receber o desafio.",
    titleLabel: "Título",
    description: "Descrição",
    goalType: "Tipo de objetivo",
    goalTarget: "Meta",
    rewardPoints: "Pontos de recompensa",
    startsAt: "Início",
    endsAt: "Fim",
    assignMode: "Atribuição",
    allPatients: "Todos os pacientes",
    selectedPatients: "Pacientes específicos",
    choosePatients: "Escolher pacientes",
    noPatients: "Sem pacientes disponíveis",
    submit: "Criar e atribuir desafio",
    saving: "A criar...",
    success: "Desafio criado e atribuído com sucesso.",
    error: "Erro ao criar desafio.",
    progressCount: "Número de registos",
    minutesTotal: "Minutos totais",
    streak: "Sequência",
    patients: "Pacientes",
    assignedTo: "Será atribuído a",
    selected: "selecionado(s)",
  },
  en: {
    hello: "Hi",
    userFallback: "Therapist",
    title: "Patient Challenges",
    subtitle:
      "Create personalized challenges and assign them to all patients or only selected patients.",
    create: "Create challenge",
    challengeInfo: "Define the goal, duration, reward and who should receive the challenge.",
    titleLabel: "Title",
    description: "Description",
    goalType: "Goal type",
    goalTarget: "Target",
    rewardPoints: "Reward points",
    startsAt: "Start",
    endsAt: "End",
    assignMode: "Assignment",
    allPatients: "All patients",
    selectedPatients: "Specific patients",
    choosePatients: "Choose patients",
    noPatients: "No patients available",
    submit: "Create and assign challenge",
    saving: "Creating...",
    success: "Challenge created and assigned successfully.",
    error: "Error creating challenge.",
    progressCount: "Progress records",
    minutesTotal: "Total minutes",
    streak: "Streak",
    patients: "Patients",
    assignedTo: "Will be assigned to",
    selected: "selected",
  },
};

function getDateTimeLocalPlusDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

export default function TherapistChallengesPage() {
  const { language } = useAppPreferences();
  const text = textPage[language] || textPage["pt-PT"];

  const [patients, setPatients] = useState([]);
  const [assignToAll, setAssignToAll] = useState(true);
  const [selectedPatients, setSelectedPatients] = useState([]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    goal_type: "PROGRESS_COUNT",
    goal_target: 3,
    reward_points: 20,
    starts_at: getDateTimeLocalPlusDays(0),
    ends_at: getDateTimeLocalPlusDays(7),
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadPatients() {
      try {
        const data = await fetchTherapistPatients();
        setPatients(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || text.error);
      } finally {
        setLoading(false);
      }
    }

    loadPatients();
  }, [text.error]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function getPatientId(patient) {
    return patient.user_id || patient.id;
  }

  function getPatientName(patient) {
    return (
      patient.display_name ||
      patient.username ||
      `${text.patients} ${getPatientId(patient)}`
    );
  }

  function handlePatientToggle(patientId) {
    setSelectedPatients((prev) =>
      prev.includes(patientId)
        ? prev.filter((id) => id !== patientId)
        : [...prev, patientId]
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await createTherapistChallenge({
        title: form.title,
        description: form.description,
        challenge_type: "CUSTOM",
        goal_type: form.goal_type,
        goal_target: Number(form.goal_target),
        reward_points: Number(form.reward_points),
        starts_at: new Date(form.starts_at).toISOString(),
        ends_at: new Date(form.ends_at).toISOString(),
        assign_to_all: assignToAll,
        selected_patients: assignToAll ? [] : selectedPatients,
      });

      setForm({
        title: "",
        description: "",
        goal_type: "PROGRESS_COUNT",
        goal_target: 3,
        reward_points: 20,
        starts_at: getDateTimeLocalPlusDays(0),
        ends_at: getDateTimeLocalPlusDays(7),
      });

      setAssignToAll(true);
      setSelectedPatients([]);
      setSuccess(text.success);
    } catch (err) {
      setError(err.message || text.error);
    } finally {
      setSaving(false);
    }
  }

  const assignedCount = assignToAll ? patients.length : selectedPatients.length;

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

        <main className="theraChallengePage">
          <section className="theraChallengeHeader">
            <div>
              <h1>{text.title}</h1>
              <p>{text.subtitle}</p>
            </div>

            <div className="theraChallengeHeaderCard">
              <span>{text.patients}</span>
              <strong>{patients.length}</strong>
            </div>
          </section>

          <TherapistSubnav />

          {error && <div className="theraPlanPrimeError">{error}</div>}
          {success && <div className="theraPlanPrimeSuccess">{success}</div>}

          <section className="theraChallengeGrid">
            <form className="theraChallengeCard" onSubmit={handleSubmit}>
              <div className="theraChallengeCardHeader">
                <h2>{text.create}</h2>
                <p>{text.challengeInfo}</p>
              </div>

              <div className="theraChallengeFormGrid">
                <div className="theraChallengeField">
                  <label>{text.titleLabel}</label>
                  <input
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder={language === "en" ? "Example: Weekly consistency" : "Ex: Consistência semanal"}
                    required
                  />
                </div>

                <div className="theraChallengeField">
                  <label>{text.goalType}</label>
                  <select
                    name="goal_type"
                    value={form.goal_type}
                    onChange={handleChange}
                    required
                  >
                    <option value="PROGRESS_COUNT">{text.progressCount}</option>
                    <option value="MINUTES_TOTAL">{text.minutesTotal}</option>
                    <option value="STREAK">{text.streak}</option>
                  </select>
                </div>

                <div className="theraChallengeField">
                  <label>{text.goalTarget}</label>
                  <input
                    type="number"
                    min="1"
                    name="goal_target"
                    value={form.goal_target}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="theraChallengeField">
                  <label>{text.rewardPoints}</label>
                  <input
                    type="number"
                    min="0"
                    name="reward_points"
                    value={form.reward_points}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="theraChallengeField">
                  <label>{text.startsAt}</label>
                  <input
                    type="datetime-local"
                    name="starts_at"
                    value={form.starts_at}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="theraChallengeField">
                  <label>{text.endsAt}</label>
                  <input
                    type="datetime-local"
                    name="ends_at"
                    value={form.ends_at}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="theraChallengeField theraChallengeWide">
                  <label>{text.description}</label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder={
                      language === "en"
                        ? "Describe what the patient should complete."
                        : "Descreve o que o paciente deve cumprir."
                    }
                  />
                </div>
              </div>

              <button
                type="submit"
                className="theraChallengePrimary"
                disabled={saving || (!assignToAll && selectedPatients.length === 0)}
              >
                {saving ? text.saving : text.submit}
              </button>
            </form>

            <aside className="theraChallengeCard">
              <div className="theraChallengeCardHeader">
                <h2>{text.assignMode}</h2>
                <p>
                  {text.assignedTo}: <strong>{assignedCount}</strong>{" "}
                  {text.selected}
                </p>
              </div>

              <div className="theraChallengeMode">
                <button
                  type="button"
                  className={assignToAll ? "isActive" : ""}
                  onClick={() => setAssignToAll(true)}
                >
                  {text.allPatients}
                </button>

                <button
                  type="button"
                  className={!assignToAll ? "isActive" : ""}
                  onClick={() => setAssignToAll(false)}
                >
                  {text.selectedPatients}
                </button>
              </div>

              {!assignToAll && (
                <div className="theraChallengePatients">
                  <h3>{text.choosePatients}</h3>

                  {loading ? (
                    <div className="theraPlanPrimeEmpty">...</div>
                  ) : patients.length === 0 ? (
                    <div className="theraPlanPrimeEmpty">{text.noPatients}</div>
                  ) : (
                    patients.map((patient) => {
                      const patientId = getPatientId(patient);
                      const name = getPatientName(patient);

                      return (
                        <label
                          key={patientId}
                          className="theraChallengePatient"
                        >
                          <input
                            type="checkbox"
                            checked={selectedPatients.includes(patientId)}
                            onChange={() => handlePatientToggle(patientId)}
                          />
                          <span>{name}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              )}
            </aside>
          </section>
        </main>
      </div>
    </div>
  );
}