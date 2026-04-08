import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import TherapistSubnav from "../../components/TherapistSubnav";
import {
  fetchMediaResources,
  createMediaResource,
  updateMediaResource,
  deleteMediaResource,
  fetchExercises,
} from "../../api/therapist";

function formatDifficulty(value) {
  if (value === "EASY") return "Fácil";
  if (value === "MEDIUM") return "Média";
  if (value === "HARD") return "Difícil";
  return value || "-";
}

function formatType(value) {
  if (value === "VIDEO") return "Vídeo";
  if (value === "TEXT") return "Texto";
  return value || "-";
}

export default function MediaCrudPage() {
  const [resources, setResources] = useState([]);
  const [exercises, setExercises] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("Todos");

  const [formMode, setFormMode] = useState("create");
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    exercise: "",
    type: "VIDEO",
    title: "",
    description: "",
    video_url: "",
    difficulty: "EASY",
    duration_minutes: 5,
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [resourcesData, exercisesData] = await Promise.all([
        fetchMediaResources(),
        fetchExercises(),
      ]);

      setResources(Array.isArray(resourcesData) ? resourcesData : []);
      setExercises(Array.isArray(exercisesData) ? exercisesData : []);
    } catch (err) {
      setError(err.message || "Erro ao carregar recursos multimédia.");
    } finally {
      setLoading(false);
    }
  }

  const filteredResources = useMemo(() => {
    return resources.filter((item) => {
      const matchesSearch =
        !search.trim() ||
        item.title?.toLowerCase().includes(search.toLowerCase()) ||
        item.description?.toLowerCase().includes(search.toLowerCase()) ||
        item.exercise_name?.toLowerCase().includes(search.toLowerCase());

      const matchesType =
        typeFilter === "Todos" || item.type === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [resources, search, typeFilter]);

  const typeOptions = ["Todos", "VIDEO", "TEXT"];

  function handleFormChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function resetForm() {
    setForm({
      exercise: "",
      type: "VIDEO",
      title: "",
      description: "",
      video_url: "",
      difficulty: "EASY",
      duration_minutes: 5,
    });
    setFormMode("create");
    setEditingId(null);
  }

  function handleEdit(resource) {
    setFormMode("edit");
    setEditingId(resource.id);
    setForm({
      exercise: resource.exercise || "",
      type: resource.type || "VIDEO",
      title: resource.title || "",
      description: resource.description || "",
      video_url: resource.video_url || "",
      difficulty: resource.difficulty || "EASY",
      duration_minutes: resource.duration_minutes || 5,
    });
    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const payload = {
      exercise: Number(form.exercise),
      type: form.type,
      title: form.title,
      description: form.description,
      video_url: form.video_url || null,
      difficulty: form.difficulty,
      duration_minutes: Number(form.duration_minutes),
    };

    try {
      setSaving(true);

      if (formMode === "create") {
        const created = await createMediaResource(payload);
        setResources((prev) => [...prev, created]);
        setSuccess("Recurso criado com sucesso.");
      } else {
        const updated = await updateMediaResource(editingId, payload);
        setResources((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item))
        );
        setSuccess("Recurso atualizado com sucesso.");
      }

      resetForm();
    } catch (err) {
      setError(err.message || "Erro ao guardar recurso.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    const ok = window.confirm("Queres mesmo remover este recurso?");
    if (!ok) return;

    setError("");
    setSuccess("");

    try {
      await deleteMediaResource(id);
      setResources((prev) => prev.filter((item) => item.id !== id));
      if (editingId === id) resetForm();
      setSuccess("Recurso removido com sucesso.");
    } catch (err) {
      setError(err.message || "Erro ao remover recurso.");
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
          <h1 className="pageTitle">Gestão de Recursos Multimédia</h1>
          <div className="pageSubtitle">
            Criar, editar e organizar vídeos e conteúdos de apoio
          </div>
        </div>

        <div className="content">
          <TherapistSubnav />

          {error && <div className="theraNoticeError">{error}</div>}
          {success && <div className="theraNoticeOk">{success}</div>}

          <div className="exerciseCrudTopGrid">
            <div className="exerciseCrudMetricCard">
              <div className="exerciseCrudMetricLabel">Recursos totais</div>
              <div className="exerciseCrudMetricValue">{resources.length}</div>
            </div>

            <div className="exerciseCrudMetricCard">
              <div className="exerciseCrudMetricLabel">Resultados filtrados</div>
              <div className="exerciseCrudMetricValue exerciseCrudMetricAccent">
                {filteredResources.length}
              </div>
            </div>

            <div className="exerciseCrudMetricCard">
              <div className="exerciseCrudMetricLabel">Exercícios associados</div>
              <div className="exerciseCrudMetricValue">{exercises.length}</div>
            </div>
          </div>

          <div className="theraTopGrid">
            <form className="theraCard" onSubmit={handleSubmit}>
              <div className="theraCardHeader">
                <h3 className="theraCardTitle">
                  {formMode === "create" ? "Novo recurso" : "Editar recurso"}
                </h3>
              </div>

              <div className="theraFormGrid">
                <div className="theraField">
                  <label className="theraLabel">Exercício</label>
                  <select
                    className="input"
                    name="exercise"
                    value={form.exercise}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">Selecionar exercício</option>
                    {exercises.map((exercise) => (
                      <option key={exercise.id} value={exercise.id}>
                        {exercise.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="theraField">
                  <label className="theraLabel">Tipo</label>
                  <select
                    className="input"
                    name="type"
                    value={form.type}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="VIDEO">Vídeo</option>
                    <option value="TEXT">Texto</option>
                  </select>
                </div>

                <div className="theraField">
                  <label className="theraLabel">Título</label>
                  <input
                    className="input"
                    name="title"
                    value={form.title}
                    onChange={handleFormChange}
                    placeholder="Título do recurso"
                    required
                  />
                </div>

                <div className="theraField">
                  <label className="theraLabel">Dificuldade</label>
                  <select
                    className="input"
                    name="difficulty"
                    value={form.difficulty}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="EASY">Fácil</option>
                    <option value="MEDIUM">Média</option>
                    <option value="HARD">Difícil</option>
                  </select>
                </div>

                <div className="theraField">
                  <label className="theraLabel">Duração (min)</label>
                  <input
                    className="input"
                    type="number"
                    min="1"
                    name="duration_minutes"
                    value={form.duration_minutes}
                    onChange={handleFormChange}
                    required
                  />
                </div>

                <div className="theraField">
                  <label className="theraLabel">URL do vídeo</label>
                  <input
                    className="input"
                    name="video_url"
                    value={form.video_url}
                    onChange={handleFormChange}
                    placeholder="https://..."
                  />
                </div>

                <div className="theraField">
                  <label className="theraLabel">Descrição</label>
                  <textarea
                    className="input"
                    name="description"
                    value={form.description}
                    onChange={handleFormChange}
                    placeholder="Descrição do recurso"
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
                    ? "Criar recurso"
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
                    placeholder="Pesquisar recurso..."
                  />
                </div>

                <div className="theraField">
                  <label className="theraLabel">Tipo</label>
                  <select
                    className="input"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                  >
                    {typeOptions.map((type) => (
                      <option key={type} value={type}>
                        {type === "Todos" ? "Todos" : formatType(type)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="exerciseCrudToolbar">
            <div>
              <h2 className="exerciseCrudSectionTitle">Lista de recursos</h2>
              <p className="exerciseCrudSectionSub">
                Gere conteúdos associados aos exercícios
              </p>
            </div>
          </div>

          <div className="exerciseCrudFilters">
            {typeOptions.map((type) => (
              <button
                key={type}
                className={`exerciseCrudFilterBtn ${
                  typeFilter === type ? "exerciseCrudFilterBtnActive" : ""
                }`}
                onClick={() => setTypeFilter(type)}
              >
                {type === "Todos" ? "Todos" : formatType(type)}
              </button>
            ))}
          </div>

          <div className="exerciseCrudTableCard">
            {loading ? (
              <div className="theraEmptyBox">A carregar recursos...</div>
            ) : filteredResources.length === 0 ? (
              <div className="theraEmptyBox">
                Não foram encontrados recursos com estes filtros.
              </div>
            ) : (
              <div className="exerciseCrudTableWrap">
                <table className="exerciseCrudTable">
                  <thead>
                    <tr>
                      <th>Título</th>
                      <th>Tipo</th>
                      <th>Exercício</th>
                      <th>Dificuldade</th>
                      <th>Duração</th>
                      <th>Ações</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredResources.map((resource) => (
                      <tr key={resource.id}>
                        <td>{resource.title}</td>
                        <td>{formatType(resource.type)}</td>
                        <td>{resource.exercise_name || "-"}</td>
                        <td>{formatDifficulty(resource.difficulty)}</td>
                        <td>{resource.duration_minutes || 0} min</td>
                        <td>
                          <div className="exerciseCrudActionRow">
                            <button
                              className="exerciseCrudGhostBtn"
                              onClick={() => handleEdit(resource)}
                            >
                              Editar
                            </button>
                            <button
                              className="exerciseCrudDangerBtn"
                              onClick={() => handleDelete(resource.id)}
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
                  <span>Recursos no sistema</span>
                  <strong>{resources.length}</strong>
                </div>
                <div className="exerciseCrudSummaryItem">
                  <span>Vídeos</span>
                  <strong>
                    {resources.filter((item) => item.type === "VIDEO").length}
                  </strong>
                </div>
                <div className="exerciseCrudSummaryItem">
                  <span>Textos</span>
                  <strong>
                    {resources.filter((item) => item.type === "TEXT").length}
                  </strong>
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
                  Criar recurso
                </button>
                <button
                  className="exerciseCrudQuickBtn"
                  onClick={loadData}
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