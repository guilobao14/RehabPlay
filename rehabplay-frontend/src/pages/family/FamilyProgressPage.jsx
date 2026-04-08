import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchFamilyLinks,
  fetchFamilyPatientProgress,
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

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function normalizeLink(raw) {
  return {
    id: raw.id,
    patientId: raw.patient ?? raw.patient_id ?? raw.patient_user_id ?? null,
    patientName:
      raw.patient_display_name ||
      raw.patient_name ||
      raw.patient_username ||
      `Paciente ${raw.patient ?? raw.patient_id ?? ""}`,
    canViewProgress:
      raw.can_view_progress === true ||
      raw.can_view_progress === false
        ? raw.can_view_progress
        : false,
  };
}

export default function FamilyProgressPage() {
  const [links, setLinks] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [entries, setEntries] = useState([]);

  const [loadingLinks, setLoadingLinks] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadLinks() {
      try {
        const data = await fetchFamilyLinks();
        const safeLinks = Array.isArray(data)
          ? data.map(normalizeLink).filter((item) => item.canViewProgress)
          : [];

        setLinks(safeLinks);

        if (safeLinks.length > 0) {
          setSelectedPatientId(String(safeLinks[0].patientId));
        }
      } catch (err) {
        setError(err.message || "Erro ao carregar ligações familiares.");
      } finally {
        setLoadingLinks(false);
      }
    }

    loadLinks();
  }, []);

  useEffect(() => {
    async function loadProgress() {
      if (!selectedPatientId) {
        setEntries([]);
        return;
      }

      try {
        setLoadingProgress(true);
        const data = await fetchFamilyPatientProgress(selectedPatientId);
        setEntries(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || "Erro ao carregar progresso do paciente.");
      } finally {
        setLoadingProgress(false);
      }
    }

    loadProgress();
  }, [selectedPatientId]);

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
    const currentWeek = getWeekLabel(new Date().toISOString());

    return entries.filter(
      (entry) => getWeekLabel(entry.performed_at) === currentWeek
    ).length;
  }, [entries]);

  const uniqueExercises = useMemo(() => {
    return new Set(entries.map((item) => item.exercise_name).filter(Boolean)).size;
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
          <div className="userArea">Olá, Familiar</div>
        </div>

        <div className="pageHeader">
          <h1 className="pageTitle">Progresso do Paciente</h1>
          <div className="pageSubtitle">
            Consulta resumida da evolução clínica dentro das permissões disponíveis
          </div>
        </div>

        <div className="content">
          {error && <div className="theraNoticeError">{error}</div>}

          <div className="familyTopGrid">
            <div className="familyCard">
              <div className="familyCardHeader">
                <h3 className="familyCardTitle">Selecionar paciente</h3>
              </div>

              {loadingLinks ? (
                <div className="familyNoteText">A carregar pacientes...</div>
              ) : links.length === 0 ? (
                <div className="familyNoteText">
                  Não existem pacientes com acesso ao progresso.
                </div>
              ) : (
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
              )}
            </div>

            <div className="familyCard">
              <div className="familyCardHeader">
                <h3 className="familyCardTitle">Resumo do paciente</h3>
              </div>

              <div className="familyInfoList">
                <div className="familyInfoItem">
                  <span>Paciente</span>
                  <strong>{selectedLink?.patientName || "-"}</strong>
                </div>
                <div className="familyInfoItem">
                  <span>Registos totais</span>
                  <strong>{totalEntries}</strong>
                </div>
                <div className="familyInfoItem">
                  <span>Tempo acumulado</span>
                  <strong>{totalMinutes} min</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="familyHeroGrid">
            <div className="familyHeroCard">
              <div className="familyHeroLabel">Progresso atual</div>
              <div className="familyHeroValue">{progressPercent}%</div>
              <div className="familyHeroText">
                Estimativa baseada no número de registos disponíveis.
              </div>
            </div>

            <div className="familyHeroCard">
              <div className="familyHeroLabel">Registos esta semana</div>
              <div className="familyHeroValue">{weeklyCount}</div>
              <div className="familyHeroText">
                Entradas associadas à semana atual.
              </div>
            </div>

            <div className="familyHeroCard">
              <div className="familyHeroLabel">Exercícios diferentes</div>
              <div className="familyHeroValue">{uniqueExercises}</div>
              <div className="familyHeroText">
                Exercícios com registos dentro do histórico visível.
              </div>
            </div>
          </div>

          <div className="familyTopGrid">
            <div className="familyCard familyProgressCard">
              <div className="familyCardHeader">
                <h3 className="familyCardTitle">Indicadores</h3>
                <span className="familySmallTag">Clínico</span>
              </div>

              <div className="familyInfoList">
                <div className="familyInfoItem">
                  <span>Dor média</span>
                  <strong>{avgPain}</strong>
                </div>
                <div className="familyInfoItem">
                  <span>Conforto médio</span>
                  <strong>{avgComfort}</strong>
                </div>
                <div className="familyInfoItem">
                  <span>Tempo total</span>
                  <strong>{totalMinutes} min</strong>
                </div>
              </div>
            </div>

            <div className="familyCard">
              <div className="familyCardHeader">
                <h3 className="familyCardTitle">Leitura geral</h3>
                <span className="familySmallTag">Resumo</span>
              </div>

              <div className="familyNoteBox">
                <div className="familyNoteTitle">
                  {entries.length ? "Existe progresso registado" : "Sem dados suficientes"}
                </div>
                <div className="familyNoteText">
                  Esta vista mostra apenas informação autorizada para
                  acompanhamento familiar, sem capacidade de edição.
                </div>
              </div>
            </div>
          </div>

          <div className="familySectionHeader">
            <h2 className="familySectionTitle">Últimos registos</h2>
            <p className="familySectionSub">
              Histórico recente das sessões e exercícios realizados
            </p>
          </div>

          <div className="familyLinksGridReal">
            {loadingProgress ? (
              <div className="familyCard">
                <div className="familyNoteText">A carregar progresso...</div>
              </div>
            ) : latestEntries.length === 0 ? (
              <div className="familyCard">
                <div className="familyNoteBox">
                  <div className="familyNoteTitle">Sem registos</div>
                  <div className="familyNoteText">
                    Ainda não existem entradas de progresso para este paciente.
                  </div>
                </div>
              </div>
            ) : (
              latestEntries.map((entry) => (
                <div key={entry.id} className="familyCard">
                  <div className="familyCardHeader">
                    <h3 className="familyCardTitle">
                      {entry.exercise_name || `Exercício ${entry.plan_item}`}
                    </h3>
                    <span className="familySmallTag">
                      {entry.duration_minutes || 0} min
                    </span>
                  </div>

                  <div className="familyInfoList">
                    <div className="familyInfoItem">
                      <span>Data</span>
                      <strong>{formatDateTime(entry.performed_at)}</strong>
                    </div>
                    <div className="familyInfoItem">
                      <span>Dor</span>
                      <strong>{entry.pain_level ?? "-"}</strong>
                    </div>
                    <div className="familyInfoItem">
                      <span>Conforto</span>
                      <strong>{entry.comfort_level ?? "-"}</strong>
                    </div>
                    <div className="familyInfoItem">
                      <span>Dificuldade</span>
                      <strong>{entry.perceived_difficulty ?? "-"}</strong>
                    </div>
                  </div>

                  {entry.notes && (
                    <div className="familyNoteBox" style={{ marginTop: 16 }}>
                      <div className="familyNoteText">{entry.notes}</div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="familyBottomGrid">
            <div className="familyCard">
              <div className="familyCardHeader">
                <h3 className="familyCardTitle">Ações rápidas</h3>
              </div>

              <div className="familyQuickActions">
                <Link to="/family" className="familyGhostLinkBtn">
                  Voltar ao dashboard
                </Link>
                <Link to="/family/links" className="familyGhostLinkBtn">
                  Ver ligações
                </Link>
              </div>
            </div>

            <div className="familyCard">
              <div className="familyCardHeader">
                <h3 className="familyCardTitle">Nota</h3>
              </div>

              <div className="familyNoteBox">
                <div className="familyNoteTitle">Acompanhamento limitado</div>
                <div className="familyNoteText">
                  Esta página serve apenas para apoio e acompanhamento, respeitando
                  as permissões atribuídas ao familiar.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}