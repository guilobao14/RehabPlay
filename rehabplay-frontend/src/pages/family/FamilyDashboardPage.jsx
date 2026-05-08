import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchFamilyLinks,
  fetchFamilyPatientProgress,
} from "../../api/family";
import { useAppPreferences } from "../../context/AppPreferencesContext.jsx";

const familyDashText = {
  "pt-PT": {
    hello: "Olá",
    family: "Familiar",
    title: "Dashboard Familiar",
    subtitle:
      "Acompanha o progresso autorizado do paciente, mantendo a privacidade clínica protegida.",
    loadingTitle: "A carregar...",
    loadingText: "A obter ligações familiares e progresso disponível.",
    errorText: "Erro ao carregar dashboard familiar.",

    linkedPatient: "Paciente associado",
    activeLink: "Ligação familiar ativa e acompanhamento autorizado.",
    noActiveLink: "Ainda não existe ligação familiar ativa.",
    generalStatus: "Estado geral",
    monitoring: "Em acompanhamento",
    noRecords: "Sem registos",
    generalStatusText: "Resumo calculado a partir dos registos disponíveis.",
    lastActivity: "Última atividade",
    lastActivityText: "Data do último registo de progresso visível.",

    currentProgress: "Progresso atual",
    summary: "Resumo",
    monitoringLabel: "Acompanhamento",
    availableRecords: "registos disponíveis para consulta",
    weeklySummary: "Resumo semanal",
    thisWeekRecords: "Registos esta semana",
    totalTime: "Tempo total",
    differentExercises: "Exercícios diferentes",
    privacyStatus: "Privacidade",
    important: "Importante",
    progressAllowed: "Consulta de progresso autorizada",
    progressDenied: "Sem acesso ao progresso",
    messagesPrivate:
      "Mensagens entre paciente e terapeuta não disponíveis para familiares",
    familyLinkActive: "Ligação familiar ativa",
    noFamilyLink: "Sem ligação ativa",

    availableActions: "Ações disponíveis",
    actionsSub: "Acesso limitado ao acompanhamento autorizado",
    manageLinks: "Gerir ligações",
    manageLinksText: "Consultar autorizações associadas ao paciente.",
    viewProgress: "Ver progresso",
    viewProgressText: "Acompanhar evolução semanal e histórico resumido.",

    privacyNotice: "Privacidade clínica",
    privacyTitle: "Mensagens protegidas",
    privacyText:
      "Por motivos de privacidade e confidencialidade, familiares não têm acesso às conversas entre paciente e terapeuta.",
    accessSummary: "Resumo de acesso",
    permissions: "Permissões",
    limited: "Limitadas",
    progressConsultation: "Consulta de progresso",
    messageConsultation: "Consulta de mensagens",
    notAllowed: "Não permitido",
    yes: "Sim",
    no: "Não",
    minutes: "min",
  },

  en: {
    hello: "Hi",
    family: "Family",
    title: "Family Dashboard",
    subtitle:
      "Monitor the patient’s authorized progress while keeping clinical privacy protected.",
    loadingTitle: "Loading...",
    loadingText: "Fetching family links and available progress.",
    errorText: "Error loading family dashboard.",

    linkedPatient: "Linked patient",
    activeLink: "Active family link and authorized monitoring.",
    noActiveLink: "There is no active family link yet.",
    generalStatus: "General status",
    monitoring: "Being monitored",
    noRecords: "No records",
    generalStatusText: "Summary calculated from available records.",
    lastActivity: "Last activity",
    lastActivityText: "Date of the latest visible progress record.",

    currentProgress: "Current progress",
    summary: "Summary",
    monitoringLabel: "Monitoring",
    availableRecords: "records available for review",
    weeklySummary: "Weekly summary",
    thisWeekRecords: "Records this week",
    totalTime: "Total time",
    differentExercises: "Different exercises",
    privacyStatus: "Privacy",
    important: "Important",
    progressAllowed: "Progress review authorized",
    progressDenied: "No access to progress",
    messagesPrivate:
      "Messages between patient and therapist are not available to family members",
    familyLinkActive: "Active family link",
    noFamilyLink: "No active link",

    availableActions: "Available actions",
    actionsSub: "Limited access to authorized monitoring",
    manageLinks: "Manage links",
    manageLinksText: "Review authorizations associated with the patient.",
    viewProgress: "View progress",
    viewProgressText: "Track weekly evolution and summarized history.",

    privacyNotice: "Clinical privacy",
    privacyTitle: "Protected messages",
    privacyText:
      "For privacy and confidentiality reasons, family members cannot access conversations between patient and therapist.",
    accessSummary: "Access summary",
    permissions: "Permissions",
    limited: "Limited",
    progressConsultation: "Progress review",
    messageConsultation: "Message review",
    notAllowed: "Not allowed",
    yes: "Yes",
    no: "No",
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
  if (Number.isNaN(date.getTime())) return language === "en" ? "No date" : "Sem data";

  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const diffDays = Math.floor((date - startOfYear) / 86400000);
  const week = Math.ceil((diffDays + startOfYear.getDay() + 1) / 7);

  return `${language === "en" ? "Week" : "Semana"} ${week}`;
}

export default function FamilyDashboardPage() {
  const { language } = useAppPreferences();
  const text = familyDashText[language] || familyDashText["pt-PT"];

  const [links, setLinks] = useState([]);
  const [progressEntries, setProgressEntries] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        setError("");

        const linksData = await fetchFamilyLinks();
        const safeLinks = Array.isArray(linksData) ? linksData : [];
        setLinks(safeLinks);

        if (safeLinks.length > 0) {
          const firstLink = safeLinks[0];
          const patientId =
            firstLink.patient ||
            firstLink.patient_id ||
            firstLink.patient_user_id;

          if (patientId) {
            const progressData = await fetchFamilyPatientProgress(patientId).catch(
              () => []
            );

            setProgressEntries(Array.isArray(progressData) ? progressData : []);
          }
        }
      } catch (err) {
        setError(err.message || text.errorText);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [text.errorText]);

  const activeLink = links[0] || null;

  const patientName =
    activeLink?.patient_display_name ||
    activeLink?.patient_username ||
    activeLink?.patient_name ||
    (language === "en" ? "No linked patient" : "Sem paciente associado");

  const totalEntries = progressEntries.length;

  const totalMinutes = useMemo(() => {
    return progressEntries.reduce(
      (sum, item) => sum + Number(item.duration_minutes || 0),
      0
    );
  }, [progressEntries]);

  const weeklyCount = useMemo(() => {
    const currentWeek = getWeekLabel(new Date().toISOString(), language);

    return progressEntries.filter(
      (entry) => getWeekLabel(entry.performed_at, language) === currentWeek
    ).length;
  }, [progressEntries, language]);

  const uniqueExercises = useMemo(() => {
    return new Set(
      progressEntries.map((item) => item.exercise_name).filter(Boolean)
    ).size;
  }, [progressEntries]);

  const progressPercent = useMemo(() => {
    if (!progressEntries.length) return 0;
    return Math.min(100, Math.round(progressEntries.length * 10));
  }, [progressEntries]);

  const latestEntry = progressEntries[0] || null;

  const canViewProgress =
    activeLink?.can_view_progress === true ||
    activeLink?.can_view_progress === undefined;

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
              <span>{text.privacyNotice}</span>
              <h1>{text.title}</h1>
              <p>{text.subtitle}</p>
            </div>

            <div className="familyDashHeroPanel">
              <span>{text.linkedPatient}</span>
              <strong>{patientName}</strong>
              <p>
                {latestEntry
                  ? formatDateTime(latestEntry.performed_at, language)
                  : "-"}
              </p>
            </div>
          </section>

          {loading && (
            <div className="familyDashState">
              <h3>{text.loadingTitle}</h3>
              <p>{text.loadingText}</p>
            </div>
          )}

          {error && !loading && <div className="theraNoticeError">{error}</div>}

          {!loading && !error && (
            <>
              <section className="familyDashStats">
                <div>
                  <span>{text.linkedPatient}</span>
                  <strong>{patientName}</strong>
                  <p>{activeLink ? text.activeLink : text.noActiveLink}</p>
                </div>

                <div>
                  <span>{text.generalStatus}</span>
                  <strong>{totalEntries ? text.monitoring : text.noRecords}</strong>
                  <p>{text.generalStatusText}</p>
                </div>

                <div>
                  <span>{text.lastActivity}</span>
                  <strong>
                    {latestEntry
                      ? formatDateTime(latestEntry.performed_at, language)
                      : "-"}
                  </strong>
                  <p>{text.lastActivityText}</p>
                </div>
              </section>

              <section className="familyDashMainGrid">
                <div className="familyDashProgressCard">
                  <div className="familyDashCardHeader">
                    <div>
                      <h2>{text.currentProgress}</h2>
                      <span>{text.summary}</span>
                    </div>
                  </div>

                  <div className="familyDashProgressValue">
                    {progressPercent}%
                  </div>

                  <div className="familyDashProgressText">
                    {text.monitoringLabel}
                  </div>

                  <div className="familyDashProgressBar">
                    <div style={{ width: `${progressPercent}%` }} />
                  </div>

                  <p>
                    {totalEntries} {text.availableRecords}
                  </p>
                </div>

                <div className="familyDashCard">
                  <div className="familyDashCardHeader">
                    <div>
                      <h2>{text.weeklySummary}</h2>
                      <span>{text.monitoringLabel}</span>
                    </div>
                  </div>

                  <div className="familyDashInfoList">
                    <div>
                      <span>{text.thisWeekRecords}</span>
                      <strong>{weeklyCount}</strong>
                    </div>

                    <div>
                      <span>{text.totalTime}</span>
                      <strong>
                        {totalMinutes} {text.minutes}
                      </strong>
                    </div>

                    <div>
                      <span>{text.differentExercises}</span>
                      <strong>{uniqueExercises}</strong>
                    </div>
                  </div>
                </div>

                <div className="familyDashPrivacyCard">
                  <div className="familyDashCardHeader">
                    <div>
                      <h2>{text.privacyStatus}</h2>
                      <span>{text.important}</span>
                    </div>
                  </div>

                  <div className="familyDashAlertList">
                    <div>
                      <span />
                      <p>
                        {canViewProgress
                          ? text.progressAllowed
                          : text.progressDenied}
                      </p>
                    </div>

                    <div>
                      <span />
                      <p>{text.messagesPrivate}</p>
                    </div>

                    <div>
                      <span />
                      <p>{activeLink ? text.familyLinkActive : text.noFamilyLink}</p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="familyDashSectionTitle">
                <div>
                  <h2>{text.availableActions}</h2>
                  <p>{text.actionsSub}</p>
                </div>
              </section>

              <section className="familyDashActions">
                <Link to="/family/links" className="familyDashActionCard">
                  <div>🔗</div>
                  <h3>{text.manageLinks}</h3>
                  <p>{text.manageLinksText}</p>
                </Link>

                <Link to="/family/progress" className="familyDashActionCard">
                  <div>📈</div>
                  <h3>{text.viewProgress}</h3>
                  <p>{text.viewProgressText}</p>
                </Link>
              </section>

              <section className="familyDashBottom">
                <div className="familyDashCard">
                  <div className="familyDashCardHeader">
                    <div>
                      <h2>{text.privacyTitle}</h2>
                    </div>
                  </div>

                  <div className="familyDashNote">
                    <strong>{text.privacyTitle}</strong>
                    <p>{text.privacyText}</p>
                  </div>
                </div>

                <div className="familyDashCard">
                  <div className="familyDashCardHeader">
                    <div>
                      <h2>{text.accessSummary}</h2>
                    </div>
                  </div>

                  <div className="familyDashInfoList">
                    <div>
                      <span>{text.permissions}</span>
                      <strong>{text.limited}</strong>
                    </div>

                    <div>
                      <span>{text.progressConsultation}</span>
                      <strong>{canViewProgress ? text.yes : text.no}</strong>
                    </div>

                    <div>
                      <span>{text.messageConsultation}</span>
                      <strong>{text.notAllowed}</strong>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}