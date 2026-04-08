import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import TherapistSubnav from "../../components/TherapistSubnav";
import {
  fetchTherapistPatients,
  fetchTherapistPatientProgress,
} from "../../api/therapist";

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

function average(values) {
  if (!values.length) return 0;
  const total = values.reduce((sum, value) => sum + value, 0);
  return total / values.length;
}

export default function TherapistPatientProgressPage() {
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [progressEntries, setProgressEntries] = useState([]);

  const [loadingPatients, setLoadingPatients] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPatients() {
      try {
        const data = await fetchTherapistPatients();
        const safePatients = Array.isArray(data) ? data : [];
        setPatients(safePatients);

        if (safePatients.length > 0) {
          setSelectedPatientId(String(safePatients[0].user_id));
        }
      } catch (err) {
        setError(err.message || "Erro ao carregar pacientes.");
      } finally {
        setLoadingPatients(false);
      }
    }

    loadPatients();
  }, []);

  useEffect(() => {
    async function loadProgress() {
      if (!selectedPatientId) {
        setProgressEntries([]);
        return;
      }

      try {
        setLoadingProgress(true);
        const data = await fetchTherapistPatientProgress(selectedPatientId);
        setProgressEntries(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || "Erro ao carregar progresso do paciente.");
      } finally {
        setLoadingProgress(false);
      }
    }

    loadProgress();
  }, [selectedPatientId]);

  const selectedPatient = useMemo(() => {
    return patients.find(
      (patient) => String(patient.user_id) === String(selectedPatientId)
    );
  }, [patients, selectedPatientId]);

  const totalEntries = progressEntries.length;

  const totalMinutes = useMemo(() => {
    return progressEntries.reduce(
      (sum, item) => sum + Number(item.duration_minutes || 0),
      0
    );
  }, [progressEntries]);

  const avgPain = useMemo(() => {
    const values = progressEntries
      .map((item) => Number(item.pain_level))
      .filter((value) => !Number.isNaN(value) && value >= 0);

    return values.length ? average(values).toFixed(1) : "-";
  }, [progressEntries]);

  const avgComfort = useMemo(() => {
    const values = progressEntries
      .map((item) => Number(item.comfort_level))
      .filter((value) => !Number.isNaN(value) && value >= 0);

    return values.length ? average(values).toFixed(1) : "-";
  }, [progressEntries]);

  const avgDifficulty = useMemo(() => {
    const values = progressEntries
      .map((item) => Number(item.perceived_difficulty))
      .filter((value) => !Number.isNaN(value) && value >= 0);

    return values.length ? average(values).toFixed(1) : "-";
  }, [progressEntries]);

  const exerciseSummary = useMemo(() => {
    const map = {};

    for (const entry of progressEntries) {
      const key = entry.exercise_name || "Exercício";
      if (!map[key]) {
        map[key] = {
          name: key,
          count: 0,
          minutes: 0,
        };
      }

      map[key].count += 1;
      map[key].minutes += Number(entry.duration_minutes || 0);
    }

    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [progressEntries]);

  return (
    <div className="appPage">
      <div className="appShellMockup">
        <div className="topbar">
          <Link to="/dashboard" className="brandLink">
            RehabPlay
          </Link>
          <div className="userArea">Olá, Terapeuta</div>
        </div>

        <div className="pageHeader">
          <h1 className="pageTitle">Progresso dos Pacientes</h1>
          <div className="pageSubtitle">
            Acompanha a evolução e os registos clínicos dos teus pacientes
          </div>
        </div>

        <div className="content">
          <TherapistSubnav />

          {error && <div className="theraNoticeError">{error}</div>}

          <div className="theraTopGrid">
            <div className="theraCard">
              <div className="theraCardHeader">
                <h3 className="theraCardTitle">Selecionar paciente</h3>
              </div>

              {loadingPatients ? (
                <div className="theraEmptyBox">A carregar pacientes...</div>
              ) : (
                <div className="theraFormGrid">
                  <div className="theraField">
                    <label className="theraLabel">Paciente</label>
                    <select
                      className="input"
                      value={selectedPatientId}
                      onChange={(e) => setSelectedPatientId(e.target.value)}
                    >
                      {patients.map((patient) => (
                        <option key={patient.user_id} value={patient.user_id}>
                          {patient.display_name || patient.username}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div className="theraCard">
              <div className="theraCardHeader">
                <h3 className="theraCardTitle">Resumo do paciente</h3>
              </div>

              <div className="theraInfoList">
                <div className="theraInfoItem">
                  <span>Nome</span>
                  <strong>
                    {selectedPatient?.display_name ||
                      selectedPatient?.username ||
                      "-"}
                  </strong>
                </div>
                <div className="theraInfoItem">
                  <span>Username</span>
                  <strong>{selectedPatient?.username || "-"}</strong>
                </div>
                <div className="theraInfoItem">
                  <span>Telefone</span>
                  <strong>{selectedPatient?.phone || "-"}</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="exerciseCrudTopGrid">
            <div className="exerciseCrudMetricCard">
              <div className="exerciseCrudMetricLabel">Registos totais</div>
              <div className="exerciseCrudMetricValue">{totalEntries}</div>
            </div>

            <div className="exerciseCrudMetricCard">
              <div className="exerciseCrudMetricLabel">Tempo acumulado</div>
              <div className="exerciseCrudMetricValue exerciseCrudMetricAccent">
                {totalMinutes} min
              </div>
            </div>

            <div className="exerciseCrudMetricCard">
              <div className="exerciseCrudMetricLabel">Exercícios diferentes</div>
              <div className="exerciseCrudMetricValue">
                {exerciseSummary.length}
              </div>
            </div>
          </div>

          <div className="theraMainGrid">
            <div className="theraCard">
              <div className="theraCardHeader">
                <h3 className="theraCardTitle">Indicadores clínicos</h3>
              </div>

              <div className="theraInfoList">
                <div className="theraInfoItem">
                  <span>Dor média</span>
                  <strong>{avgPain}</strong>
                </div>
                <div className="theraInfoItem">
                  <span>Conforto médio</span>
                  <strong>{avgComfort}</strong>
                </div>
                <div className="theraInfoItem">
                  <span>Dificuldade média</span>
                  <strong>{avgDifficulty}</strong>
                </div>
              </div>
            </div>

            <div className="theraRightColumn">
              <div className="theraCard">
                <div className="theraCardHeader">
                  <h3 className="theraCardTitle">Resumo por exercício</h3>
                </div>

                {loadingProgress ? (
                  <div className="theraEmptyBox">A carregar progresso...</div>
                ) : exerciseSummary.length === 0 ? (
                  <div className="theraEmptyBox">
                    Este paciente ainda não tem registos de progresso.
                  </div>
                ) : (
                  <div className="theraItemsList">
                    {exerciseSummary.map((item) => (
                      <div key={item.name} className="theraItemCard">
                        <div className="theraItemTop">
                          <div className="theraItemName">{item.name}</div>
                        </div>
                        <div className="theraItemMeta">
                          {item.count} registos · {item.minutes} min acumulados
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="theraCard">
                <div className="theraCardHeader">
                  <h3 className="theraCardTitle">Registos detalhados</h3>
                </div>

                {loadingProgress ? (
                  <div className="theraEmptyBox">A carregar registos...</div>
                ) : progressEntries.length === 0 ? (
                  <div className="theraEmptyBox">
                    Sem registos de progresso para este paciente.
                  </div>
                ) : (
                  <div className="theraItemsList">
                    {progressEntries.map((entry) => (
                      <div key={entry.id} className="theraItemCard">
                        <div className="theraItemTop">
                          <div className="theraItemName">
                            {entry.exercise_name || `Exercício ${entry.plan_item}`}
                          </div>
                        </div>

                        <div className="theraItemMeta">
                          {formatDateTime(entry.performed_at)}
                        </div>

                        <div className="theraProgressMetaGrid">
                          <div className="theraProgressMetaItem">
                            <span>Duração</span>
                            <strong>{entry.duration_minutes || 0} min</strong>
                          </div>
                          <div className="theraProgressMetaItem">
                            <span>Dor</span>
                            <strong>{entry.pain_level ?? "-"}</strong>
                          </div>
                          <div className="theraProgressMetaItem">
                            <span>Conforto</span>
                            <strong>{entry.comfort_level ?? "-"}</strong>
                          </div>
                          <div className="theraProgressMetaItem">
                            <span>Dificuldade</span>
                            <strong>{entry.perceived_difficulty ?? "-"}</strong>
                          </div>
                        </div>

                        {entry.notes && (
                          <div className="theraProgressNotes">
                            {entry.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}