import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchFamilyLinks,
  fetchFamilyPatientProgress,
  fetchFamilyPatientThreads,
} from "../../api/family";

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getWeekLabel(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Sem data";

  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const diffDays = Math.floor((date - startOfYear) / 86400000);
  const week = Math.ceil((diffDays + startOfYear.getDay() + 1) / 7);

  return `Semana ${week}`;
}

export default function FamilyDashboardPage() {
  const [links, setLinks] = useState([]);
  const [progressEntries, setProgressEntries] = useState([]);
  const [threads, setThreads] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
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
            const [progressData, threadsData] = await Promise.all([
              fetchFamilyPatientProgress(patientId).catch(() => []),
              fetchFamilyPatientThreads(patientId).catch(() => []),
            ]);

            setProgressEntries(Array.isArray(progressData) ? progressData : []);
            setThreads(Array.isArray(threadsData) ? threadsData : []);
          }
        }
      } catch (err) {
        setError(err.message || "Erro ao carregar dashboard familiar.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const activeLink = links[0] || null;

  const patientName =
    activeLink?.patient_display_name ||
    activeLink?.patient_username ||
    activeLink?.patient_name ||
    "Sem paciente associado";

  const totalEntries = progressEntries.length;

  const totalMinutes = useMemo(() => {
    return progressEntries.reduce(
      (sum, item) => sum + Number(item.duration_minutes || 0),
      0
    );
  }, [progressEntries]);

  const weeklyCount = useMemo(() => {
    const currentWeek = getWeekLabel(new Date().toISOString());

    return progressEntries.filter(
      (entry) => getWeekLabel(entry.performed_at) === currentWeek
    ).length;
  }, [progressEntries]);

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
    activeLink?.can_view_progress === true || activeLink?.can_view_progress === undefined;
  const canViewMessages = activeLink?.can_view_messages === true;

  return (
    <div className="appPage">
      <div className="appShellMockup">
        <div className="topbar">
          <Link to="/dashboard" className="brandLink">
            RehabPlay
          </Link>
          <div className="userArea">Olá, Familiar</div>
        </div>

        <div className="pageHeader">
          <h1 className="pageTitle">Dashboard Familiar</h1>
          <div className="pageSubtitle">
            Acompanhamento do progresso com permissões limitadas
          </div>
        </div>

        <div className="content">
          {loading && (
            <div className="familyCard">
              <h3 className="familyCardTitle">A carregar...</h3>
              <p className="familyNoteText">
                A obter ligações, progresso e mensagens disponíveis.
              </p>
            </div>
          )}

          {error && !loading && (
            <div className="theraNoticeError">{error}</div>
          )}

          {!loading && !error && (
            <>
              <div className="familyHeroGrid">
                <div className="familyHeroCard">
                  <div className="familyHeroLabel">Paciente associado</div>
                  <div className="familyHeroValue">{patientName}</div>
                  <div className="familyHeroText">
                    {activeLink
                      ? "Ligação familiar ativa e acompanhamento autorizado."
                      : "Ainda não existe ligação familiar ativa."}
                  </div>
                </div>

                <div className="familyHeroCard">
                  <div className="familyHeroLabel">Estado geral</div>
                  <div className="familyHeroValue">
                    {totalEntries ? "Em acompanhamento" : "Sem registos"}
                  </div>
                  <div className="familyHeroText">
                    Resumo calculado a partir dos registos disponíveis.
                  </div>
                </div>

                <div className="familyHeroCard">
                  <div className="familyHeroLabel">Última atividade</div>
                  <div className="familyHeroValue">
                    {latestEntry ? formatDateTime(latestEntry.performed_at) : "-"}
                  </div>
                  <div className="familyHeroText">
                    Data do último registo de progresso visível.
                  </div>
                </div>
              </div>

              <div className="familyTopGrid">
                <div className="familyCard familyProgressCard">
                  <div className="familyCardHeader">
                    <h3 className="familyCardTitle">Progresso atual</h3>
                    <span className="familySmallTag">Resumo</span>
                  </div>

                  <div className="familyProgressValue">{progressPercent}%</div>
                  <div className="familyProgressText">Acompanhamento</div>

                  <div className="familyProgressBar">
                    <div
                      className="familyProgressFill"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  <div className="familyMutedLine">
                    {totalEntries} registos disponíveis para consulta
                  </div>
                </div>

                <div className="familyCard">
                  <div className="familyCardHeader">
                    <h3 className="familyCardTitle">Resumo semanal</h3>
                    <span className="familySmallTag">Acompanhamento</span>
                  </div>

                  <div className="familyInfoList">
                    <div className="familyInfoItem">
                      <span>Registos esta semana</span>
                      <strong>{weeklyCount}</strong>
                    </div>
                    <div className="familyInfoItem">
                      <span>Tempo total</span>
                      <strong>{totalMinutes} min</strong>
                    </div>
                    <div className="familyInfoItem">
                      <span>Exercícios diferentes</span>
                      <strong>{uniqueExercises}</strong>
                    </div>
                  </div>
                </div>

                <div className="familyCard">
                  <div className="familyCardHeader">
                    <h3 className="familyCardTitle">Alertas</h3>
                    <span className="familySmallTag">Importante</span>
                  </div>

                  <div className="familyAlertsList">
                    <div className="familyAlertItem">
                      <div className="familyAlertDot" />
                      <span>
                        {canViewProgress
                          ? "Consulta de progresso autorizada"
                          : "Sem acesso ao progresso"}
                      </span>
                    </div>

                    <div className="familyAlertItem">
                      <div className="familyAlertDot" />
                      <span>
                        {canViewMessages
                          ? `${threads.length} thread(s) disponível(is)`
                          : "Sem acesso às mensagens"}
                      </span>
                    </div>

                    <div className="familyAlertItem">
                      <div className="familyAlertDot" />
                      <span>
                        {activeLink ? "Ligação familiar ativa" : "Sem ligação ativa"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="familySectionHeader">
                <h2 className="familySectionTitle">Ações disponíveis</h2>
                <p className="familySectionSub">
                  Acesso limitado a acompanhamento e consulta de informação
                </p>
              </div>

              <div className="familyActionsGrid">
                <Link to="/family/links" className="familyActionCard">
                  <div className="familyActionIcon">🔗</div>
                  <div className="familyActionTitle">Gerir links</div>
                  <div className="familyActionText">
                    Consultar e acompanhar a ligação autorizada ao paciente.
                  </div>
                </Link>

                <Link to="/family/progress" className="familyActionCard">
                  <div className="familyActionIcon">📈</div>
                  <div className="familyActionTitle">Ver progresso</div>
                  <div className="familyActionText">
                    Acompanhar a evolução semanal e o histórico resumido.
                  </div>
                </Link>

                <Link to="/messages" className="familyActionCard">
                  <div className="familyActionIcon">💬</div>
                  <div className="familyActionTitle">Mensagens</div>
                  <div className="familyActionText">
                    Consultar conversas dentro das permissões disponíveis.
                  </div>
                </Link>
              </div>

              <div className="familyBottomGrid">
                <div className="familyCard">
                  <div className="familyCardHeader">
                    <h3 className="familyCardTitle">Observação geral</h3>
                  </div>

                  <div className="familyNoteBox">
                    <div className="familyNoteTitle">
                      {totalEntries
                        ? "Existe atividade registada"
                        : "Ainda não existem registos suficientes"}
                    </div>
                    <div className="familyNoteText">
                      O acompanhamento familiar ajuda a reforçar motivação,
                      rotina e compromisso com o plano definido.
                    </div>
                  </div>
                </div>

                <div className="familyCard">
                  <div className="familyCardHeader">
                    <h3 className="familyCardTitle">Resumo de acesso</h3>
                  </div>

                  <div className="familyInfoList">
                    <div className="familyInfoItem">
                      <span>Permissões</span>
                      <strong>Limitadas</strong>
                    </div>
                    <div className="familyInfoItem">
                      <span>Consulta de progresso</span>
                      <strong>{canViewProgress ? "Sim" : "Não"}</strong>
                    </div>
                    <div className="familyInfoItem">
                      <span>Consulta de mensagens</span>
                      <strong>{canViewMessages ? "Sim" : "Não"}</strong>
                    </div>
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