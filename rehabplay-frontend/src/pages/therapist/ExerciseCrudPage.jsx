import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import TherapistSubnav from "../../components/TherapistSubnav";
import {
  fetchExercises,
  createExercise,
  updateExercise,
  deleteExercise,
} from "../../api/therapist";

export default function ExerciseCrudPage() {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [activeArea, setActiveArea] = useState("Todos");

  const [formMode, setFormMode] = useState("create");
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    area: "",
    description: "",
  });

  useEffect(() => {
    loadExercises();
  }, []);

  async function loadExercises() {
    try {
      setLoading(true);
      const data = await fetchExercises();
      setExercises(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Erro ao carregar exercícios.");
    } finally {
      setLoading(false);
    }
  }

  const areaOptions = useMemo(() => {
    const areas = [...new Set(exercises.map((item) => item.area).filter(Boolean))];
    return ["Todos", ...areas];
  }, [exercises]);

  const filteredExercises = useMemo(() => {
    return exercises.filter((exercise) => {
      const matchesSearch =
        !search.trim() ||
        exercise.name?.toLowerCase().includes(search.toLowerCase()) ||
        exercise.description?.toLowerCase().includes(search.toLowerCase());

      const matchesArea =
        activeArea === "Todos" || exercise.area === activeArea;

      return matchesSearch && matchesArea;
    });
  }, [exercises, search, activeArea]);

  function handleFormChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function resetForm() {
    setForm({
      name: "",
      area: "",
      description: "",
    });
    setFormMode("create");
    setEditingId(null);
  }

  function handleEdit(exercise) {
    setFormMode("edit");
    setEditingId(exercise.id);
    setForm({
      name: exercise.name || "",
      area: exercise.area || "",
      description: exercise.description || "",
    });
    setSuccess("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    try {
      setSaving(true);

      if (formMode === "create") {
        const created = await createExercise(form);
        setExercises((prev) => [...prev, created]);
        setSuccess("Exercício criado com sucesso.");
      } else {
        const updated = await updateExercise(editingId, form);
        setExercises((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item))
        );
        setSuccess("Exercício atualizado com sucesso.");
      }

      resetForm();
    } catch (err) {
      setError(err.message || "Erro ao guardar exercício.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(exerciseId) {
    const ok = window.confirm("Queres mesmo remover este exercício?");
    if (!ok) return;

    setError("");
    setSuccess("");

    try {
      await deleteExercise(exerciseId);
      setExercises((prev) => prev.filter((item) => item.id !== exerciseId));
      if (editingId === exerciseId) resetForm();
      setSuccess("Exercício removido com sucesso.");
    } catch (err) {
      setError(err.message || "Erro ao remover exercício.");
    }
  }

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
          <h1 className="pageTitle">Gestão de Exercícios</h1>
          <div className="pageSubtitle">
            Criar, editar e organizar exercícios terapêuticos
          </div>
        </div>

        <div className="content">
          <TherapistSubnav />

          {error && <div className="theraNoticeError">{error}</div>}
          {success && <div className="theraNoticeOk">{success}</div>}

          <div className="exerciseCrudTopGrid">
            <div className="exerciseCrudMetricCard">
              <div className="exerciseCrudMetricLabel">Exercícios totais</div>
              <div className="exerciseCrudMetricValue">{exercises.length}</div>
            </div>

            <div className="exerciseCrudMetricCard">
              <div className="exerciseCrudMetricLabel">Resultados filtrados</div>
              <div className="exerciseCrudMetricValue exerciseCrudMetricAccent">
                {filteredExercises.length}
              </div>
            </div>

            <div className="exerciseCrudMetricCard">
              <div className="exerciseCrudMetricLabel">Áreas cobertas</div>
              <div className="exerciseCrudMetricValue">
                {Math.max(areaOptions.length - 1, 0)}
              </div>
            </div>
          </div>

          <div className="theraTopGrid">
            <form className="theraCard" onSubmit={handleSubmit}>
              <div className="theraCardHeader">
                <h3 className="theraCardTitle">
                  {formMode === "create" ? "Novo exercício" : "Editar exercício"}
                </h3>
              </div>

              <div className="theraFormGrid">
                <div className="theraField">
                  <label className="theraLabel">Nome</label>
                  <input
                    className="input"
                    name="name"
                    value={form.name}
                    onChange={handleFormChange}
                    placeholder="Ex: Elevação de braço"
                    required
                  />
                </div>

                <div className="theraField">
                  <label className="theraLabel">Área</label>
                  <input
                    className="input"
                    name="area"
                    value={form.area}
                    onChange={handleFormChange}
                    placeholder="Ex: OMBRO"
                    required
                  />
                </div>

                <div className="theraField">
                  <label className="theraLabel">Descrição</label>
                  <textarea
                    className="input"
                    name="description"
                    value={form.description}
                    onChange={handleFormChange}
                    placeholder="Descrição do exercício"
                    required
                  />
                </div>
              </div>

              <div className="exerciseCrudFormActions">
                <button
                  type="submit"
                  className="mediumButton theraMainBtn"
                  disabled={saving}
                >
                  {saving
                    ? "A guardar..."
                    : formMode === "create"
                    ? "Criar exercício"
                    : "Guardar alterações"}
                </button>

                {formMode === "edit" && (
                  <button
                    type="button"
                    className="exerciseCrudGhostBtn"
                    onClick={resetForm}
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>

            <div className="theraCard">
              <div className="theraCardHeader">
                <h3 className="theraCardTitle">Filtros</h3>
              </div>

              <div className="theraFormGrid">
                <div className="theraField">
                  <label className="theraLabel">Pesquisar</label>
                  <input
                    className="input"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Pesquisar exercício..."
                  />
                </div>

                <div className="theraField">
                  <label className="theraLabel">Área</label>
                  <select
                    className="input"
                    value={activeArea}
                    onChange={(e) => setActiveArea(e.target.value)}
                  >
                    {areaOptions.map((area) => (
                      <option key={area} value={area}>
                        {area}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="exerciseCrudToolbar">
            <div>
              <h2 className="exerciseCrudSectionTitle">Lista de exercícios</h2>
              <p className="exerciseCrudSectionSub">
                Gere o catálogo disponível para criação de planos
              </p>
            </div>
          </div>

          <div className="exerciseCrudFilters">
            {areaOptions.map((area) => (
              <button
                key={area}
                className={`exerciseCrudFilterBtn ${
                  activeArea === area ? "exerciseCrudFilterBtnActive" : ""
                }`}
                onClick={() => setActiveArea(area)}
              >
                {area}
              </button>
            ))}
          </div>

          <div className="exerciseCrudTableCard">
            {loading ? (
              <div className="theraEmptyBox">A carregar exercícios...</div>
            ) : filteredExercises.length === 0 ? (
              <div className="theraEmptyBox">
                Não foram encontrados exercícios com estes filtros.
              </div>
            ) : (
              <div className="exerciseCrudTableWrap">
                <table className="exerciseCrudTable">
                  <thead>
                    <tr>
                      <th>Exercício</th>
                      <th>Área</th>
                      <th>Descrição</th>
                      <th>Ações</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredExercises.map((exercise) => (
                      <tr key={exercise.id}>
                        <td>
                          <div className="exerciseCrudNameCell">
                            <div className="exerciseCrudExerciseIcon">🏃</div>
                            <span>{exercise.name}</span>
                          </div>
                        </td>
                        <td>{exercise.area}</td>
                        <td className="exerciseCrudDescriptionCell">
                          {exercise.description}
                        </td>
                        <td>
                          <div className="exerciseCrudActionRow">
                            <button
                              className="exerciseCrudGhostBtn"
                              onClick={() => handleEdit(exercise)}
                            >
                              Editar
                            </button>
                            <button
                              className="exerciseCrudDangerBtn"
                              onClick={() => handleDelete(exercise.id)}
                            >
                              Remover
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="exerciseCrudBottomGrid">
            <div className="exerciseCrudSummaryCard">
              <h3 className="exerciseCrudSummaryTitle">Resumo rápido</h3>

              <div className="exerciseCrudSummaryList">
                <div className="exerciseCrudSummaryItem">
                  <span>Exercícios no sistema</span>
                  <strong>{exercises.length}</strong>
                </div>
                <div className="exerciseCrudSummaryItem">
                  <span>Áreas diferentes</span>
                  <strong>{Math.max(areaOptions.length - 1, 0)}</strong>
                </div>
                <div className="exerciseCrudSummaryItem">
                  <span>Resultados visíveis</span>
                  <strong>{filteredExercises.length}</strong>
                </div>
              </div>
            </div>

            <div className="exerciseCrudSummaryCard">
              <h3 className="exerciseCrudSummaryTitle">Ações rápidas</h3>

              <div className="exerciseCrudQuickActions">
                <button
                  className="exerciseCrudQuickBtn"
                  onClick={() => {
                    resetForm();
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  Criar exercício
                </button>
                <button
                  className="exerciseCrudQuickBtn"
                  onClick={loadExercises}
                >
                  Atualizar lista
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}