import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import TherapistSubnav from "../../components/TherapistSubnav";
import {
  fetchExercises,
  createExercise,
  updateExercise,
  deleteExercise,
} from "../../api/therapist";
import { useAppPreferences } from "../../context/AppPreferencesContext.jsx";

const exerciseText = {
  "pt-PT": {
    hello: "Olá",
    userFallback: "Terapeuta",
    title: "Gestão de Exercícios",
    subtitle:
      "Cria, edita e organiza exercícios terapêuticos para serem usados nos planos de reabilitação.",
    loading: "A carregar exercícios...",
    loadError: "Erro ao carregar exercícios.",
    totalExercises: "Exercícios totais",
    filteredResults: "Resultados filtrados",
    coveredAreas: "Áreas cobertas",
    newExercise: "Novo exercício",
    editExercise: "Editar exercício",
    formHelp:
      "Preenche nome e descrição em português e inglês para a aplicação mostrar o conteúdo no idioma certo.",
    namePt: "Nome PT",
    nameEn: "Nome EN",
    area: "Área",
    descriptionPt: "Descrição PT",
    descriptionEn: "Descrição EN",
    namePtPlaceholder: "Ex: Elevação de braço",
    nameEnPlaceholder: "Example: Arm raise",
    areaPlaceholder: "Ex: Perna ou LEG",
    descriptionPtPlaceholder: "Descrição em português",
    descriptionEnPlaceholder: "Description in English",
    saving: "A guardar...",
    create: "Criar exercício",
    saveChanges: "Guardar alterações",
    cancel: "Cancelar",
    searchPlaceholder: "Pesquisar exercício...",
    all: "Todos",
    listTitle: "Lista de exercícios",
    listSubtitle: "Gere o catálogo disponível para criação de planos.",
    exercise: "Exercício",
    description: "Descrição",
    actions: "Ações",
    edit: "Editar",
    remove: "Remover",
    noResults: "Não foram encontrados exercícios com estes filtros.",
    confirmDelete: "Queres mesmo remover este exercício?",
    createSuccess: "Exercício criado com sucesso.",
    updateSuccess: "Exercício atualizado com sucesso.",
    deleteSuccess: "Exercício removido com sucesso.",
    saveError: "Erro ao guardar exercício.",
    deleteError: "Erro ao remover exercício.",
    quickSummary: "Resumo rápido",
    systemExercises: "Exercícios no sistema",
    differentAreas: "Áreas diferentes",
    visibleResults: "Resultados visíveis",
    quickActions: "Ações rápidas",
    refreshList: "Atualizar lista",
  },

  en: {
    hello: "Hi",
    userFallback: "Therapist",
    title: "Exercise Management",
    subtitle:
      "Create, edit and organize therapeutic exercises to be used in rehabilitation plans.",
    loading: "Loading exercises...",
    loadError: "Error loading exercises.",
    totalExercises: "Total exercises",
    filteredResults: "Filtered results",
    coveredAreas: "Covered areas",
    newExercise: "New exercise",
    editExercise: "Edit exercise",
    formHelp:
      "Fill in the name and description in Portuguese and English so the app shows the right content in each language.",
    namePt: "Name PT",
    nameEn: "Name EN",
    area: "Area",
    descriptionPt: "Description PT",
    descriptionEn: "Description EN",
    namePtPlaceholder: "Ex: Elevação de braço",
    nameEnPlaceholder: "Example: Arm raise",
    areaPlaceholder: "Example: Leg or LEG",
    descriptionPtPlaceholder: "Descrição em português",
    descriptionEnPlaceholder: "Description in English",
    saving: "Saving...",
    create: "Create exercise",
    saveChanges: "Save changes",
    cancel: "Cancel",
    searchPlaceholder: "Search exercise...",
    all: "All",
    listTitle: "Exercise list",
    listSubtitle: "Manage the catalog available for plan creation.",
    exercise: "Exercise",
    description: "Description",
    actions: "Actions",
    edit: "Edit",
    remove: "Remove",
    noResults: "No exercises were found with these filters.",
    confirmDelete: "Do you really want to remove this exercise?",
    createSuccess: "Exercise created successfully.",
    updateSuccess: "Exercise updated successfully.",
    deleteSuccess: "Exercise removed successfully.",
    saveError: "Error saving exercise.",
    deleteError: "Error removing exercise.",
    quickSummary: "Quick summary",
    systemExercises: "Exercises in the system",
    differentAreas: "Different areas",
    visibleResults: "Visible results",
    quickActions: "Quick actions",
    refreshList: "Refresh list",
  },
};

function getExerciseName(exercise, language) {
  if (language === "en") {
    return exercise.name_en || exercise.name || exercise.name_pt || "-";
  }

  return exercise.name_pt || exercise.name || exercise.name_en || "-";
}

function getExerciseDescription(exercise, language) {
  if (language === "en") {
    return (
      exercise.description_en ||
      exercise.description ||
      exercise.description_pt ||
      "-"
    );
  }

  return (
    exercise.description_pt ||
    exercise.description ||
    exercise.description_en ||
    "-"
  );
}

function getAreaLabel(exercise, language) {
  if (language === "pt-PT") {
    return exercise.area_display || exercise.area || "-";
  }

  const areaMap = {
    HEAD: "Head",
    FACE: "Face",
    NECK: "Neck",
    SHOULDER: "Shoulder",
    ARM: "Arm",
    UPPER_ARM: "Upper arm",
    ELBOW: "Elbow",
    FOREARM: "Forearm",
    WRIST: "Wrist",
    HAND: "Hand",
    FINGERS: "Fingers",
    CHEST: "Chest",
    BACK: "Back",
    UPPER_BACK: "Upper back",
    LOWER_BACK: "Lower back",
    CORE: "Core",
    ABDOMEN: "Abdomen",
    HIP: "Hip",
    GLUTES: "Glutes",
    LEG: "Leg",
    THIGH: "Thigh",
    HAMSTRINGS: "Hamstrings",
    QUADRICEPS: "Quadriceps",
    KNEE: "Knee",
    CALF: "Calf",
    ANKLE: "Ankle",
    FOOT: "Foot",
    TOES: "Toes",
    FULL_BODY: "Full body",
    BALANCE: "Balance",
    MOBILITY: "Mobility",
  };

  return areaMap[exercise.area] || exercise.area || "-";
}

export default function ExerciseCrudPage() {
  const formRef = useRef(null);

  const { language } = useAppPreferences();
  const text = exerciseText[language] || exerciseText["pt-PT"];

  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [activeArea, setActiveArea] = useState("ALL");

  const [formMode, setFormMode] = useState("create");
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    name_pt: "",
    name_en: "",
    area: "",
    description: "",
    description_pt: "",
    description_en: "",
  });

  useEffect(() => {
    loadExercises();
  }, []);

  async function loadExercises() {
    try {
      setLoading(true);
      setError("");

      const data = await fetchExercises();
      setExercises(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || text.loadError);
    } finally {
      setLoading(false);
    }
  }

  const areaOptions = useMemo(() => {
    const areas = [...new Set(exercises.map((item) => item.area).filter(Boolean))];

    return [
      {
        value: "ALL",
        label: text.all,
      },
      ...areas.map((area) => {
        const example = exercises.find((item) => item.area === area);

        return {
          value: area,
          label: getAreaLabel(example || { area }, language),
        };
      }),
    ];
  }, [exercises, language, text.all]);

  const filteredExercises = useMemo(() => {
    const q = search.trim().toLowerCase();

    return exercises.filter((exercise) => {
      const nameToShow = getExerciseName(exercise, language).toLowerCase();
      const descriptionToShow = getExerciseDescription(
        exercise,
        language
      ).toLowerCase();
      const areaToShow = getAreaLabel(exercise, language).toLowerCase();

      const matchesSearch =
        !q ||
        nameToShow.includes(q) ||
        descriptionToShow.includes(q) ||
        areaToShow.includes(q) ||
        exercise.name?.toLowerCase().includes(q) ||
        exercise.name_pt?.toLowerCase().includes(q) ||
        exercise.name_en?.toLowerCase().includes(q) ||
        exercise.description?.toLowerCase().includes(q) ||
        exercise.description_pt?.toLowerCase().includes(q) ||
        exercise.description_en?.toLowerCase().includes(q);

      const matchesArea = activeArea === "ALL" || exercise.area === activeArea;

      return matchesSearch && matchesArea;
    });
  }, [exercises, search, activeArea, language]);

  function handleFormChange(event) {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function resetForm() {
    setForm({
      name_pt: "",
      name_en: "",
      area: "",
      description: "",
      description_pt: "",
      description_en: "",
    });

    setFormMode("create");
    setEditingId(null);
  }

  function handleEdit(exercise) {
    setFormMode("edit");
    setEditingId(exercise.id);

    setForm({
      name_pt: exercise.name_pt || exercise.name || "",
      name_en: exercise.name_en || "",
      area: exercise.area || "",
      description: exercise.description || "",
      description_pt: exercise.description_pt || "",
      description_en: exercise.description_en || "",
    });

    setSuccess("");
    setError("");

    formRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const payload = {
      name: form.name_pt || form.name_en,
      name_pt: form.name_pt,
      name_en: form.name_en,
      area: form.area,
      description: form.description_pt || form.description_en,
      description_pt: form.description_pt,
      description_en: form.description_en,
    };

    try {
      setSaving(true);

      if (formMode === "create") {
        const created = await createExercise(payload);
        setExercises((prev) => [created, ...prev]);
        setSuccess(text.createSuccess);
      } else {
        const updated = await updateExercise(editingId, payload);

        setExercises((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item))
        );

        setSuccess(text.updateSuccess);
      }

      resetForm();
    } catch (err) {
      setError(err.message || text.saveError);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(exerciseId) {
  setError("");
  setSuccess("");

  try {
    await deleteExercise(exerciseId);

    setExercises((prev) => prev.filter((item) => item.id !== exerciseId));

    if (editingId === exerciseId) resetForm();

    setSuccess(text.deleteSuccess);

    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  } catch (err) {
  const backendMessage = err.message || "";

  const protectedDeleteError =
    backendMessage.includes("já está associado") ||
    backendMessage.includes("associated with existing plans");

  setError(
    protectedDeleteError
      ? language === "en"
        ? "This exercise cannot be removed because it is already associated with existing plans."
        : "Não é possível remover este exercício porque já está associado a planos existentes."
      : backendMessage || text.deleteError
  );

  setTimeout(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth",
    });
  }, 80);
}
}

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

        <main className="exercisePrimePage">
          <section className="exercisePrimeHeader">
            <div>
              <h1>{text.title}</h1>
              <p>{text.subtitle}</p>
            </div>

            <div className="exercisePrimeHeaderCard">
              <span>{text.totalExercises}</span>
              <strong>{exercises.length}</strong>
            </div>
          </section>

          <TherapistSubnav />

          {error && <div className="theraPlanPrimeError">{error}</div>}
          {success && <div className="theraPlanPrimeSuccess">{success}</div>}

          <section className="exercisePrimeStats">
            <div className="exercisePrimeStat">
              <div className="exercisePrimeIcon">↗</div>
              <span>{text.totalExercises}</span>
              <strong>{exercises.length}</strong>
            </div>

            <div className="exercisePrimeStat">
              <div className="exercisePrimeIcon">⌕</div>
              <span>{text.filteredResults}</span>
              <strong>{filteredExercises.length}</strong>
            </div>

            <div className="exercisePrimeStat">
              <div className="exercisePrimeIcon">◎</div>
              <span>{text.coveredAreas}</span>
              <strong>{Math.max(areaOptions.length - 1, 0)}</strong>
            </div>
          </section>

          <section className="exercisePrimeTopGrid exercisePrimeTopGridSingle">
            <form
              ref={formRef}
              className="exercisePrimeCard"
              onSubmit={handleSubmit}
            >
              <div className="exercisePrimeCardHeader">
                <div>
                  <h2>
                    {formMode === "create" ? text.newExercise : text.editExercise}
                  </h2>
                  <p>{text.formHelp}</p>
                </div>
              </div>

              <div className="exercisePrimeFormGrid">
                <div className="exercisePrimeField">
                  <label>{text.namePt}</label>
                  <input
                    name="name_pt"
                    value={form.name_pt}
                    onChange={handleFormChange}
                    placeholder={text.namePtPlaceholder}
                    required
                  />
                </div>

                <div className="exercisePrimeField">
                  <label>{text.nameEn}</label>
                  <input
                    name="name_en"
                    value={form.name_en}
                    onChange={handleFormChange}
                    placeholder={text.nameEnPlaceholder}
                    required
                  />
                </div>

                <div className="exercisePrimeField exercisePrimeWide">
                  <label>{text.area}</label>
                  <input
                    name="area"
                    value={form.area}
                    onChange={handleFormChange}
                    placeholder={text.areaPlaceholder}
                    required
                  />
                </div>

                <div className="exercisePrimeField">
                  <label>{text.descriptionPt}</label>
                  <textarea
                    name="description_pt"
                    value={form.description_pt}
                    onChange={handleFormChange}
                    placeholder={text.descriptionPtPlaceholder}
                  />
                </div>

                <div className="exercisePrimeField">
                  <label>{text.descriptionEn}</label>
                  <textarea
                    name="description_en"
                    value={form.description_en}
                    onChange={handleFormChange}
                    placeholder={text.descriptionEnPlaceholder}
                  />
                </div>
              </div>

              <div className="exercisePrimeActions">
                <button type="submit" disabled={saving}>
                  {saving
                    ? text.saving
                    : formMode === "create"
                    ? text.create
                    : text.saveChanges}
                </button>

                {formMode === "edit" && (
                  <button type="button" className="isGhost" onClick={resetForm}>
                    {text.cancel}
                  </button>
                )}
              </div>
            </form>
          </section>

          <section className="exercisePrimeListHeader">
            <div>
              <h2>{text.listTitle}</h2>
              <p>{text.listSubtitle}</p>
            </div>

            <div className="exercisePrimeListControls">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={text.searchPlaceholder}
              />

              <select
                value={activeArea}
                onChange={(e) => setActiveArea(e.target.value)}
              >
                {areaOptions.map((area) => (
                  <option key={area.value} value={area.value}>
                    {area.label}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <div className="exercisePrimeFilters">
            {areaOptions.map((area) => (
              <button
                key={area.value}
                type="button"
                className={activeArea === area.value ? "isActive" : ""}
                onClick={() => setActiveArea(area.value)}
              >
                {area.label}
              </button>
            ))}
          </div>

          <section className="exercisePrimeListCard">
            {loading ? (
              <div className="exercisePrimeEmpty">{text.loading}</div>
            ) : filteredExercises.length === 0 ? (
              <div className="exercisePrimeEmpty">{text.noResults}</div>
            ) : (
              <div className="exercisePrimeTableWrap">
                <table className="exercisePrimeTable">
                  <thead>
                    <tr>
                      <th>{text.exercise}</th>
                      <th>{text.area}</th>
                      <th>{text.description}</th>
                      <th>{text.actions}</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredExercises.map((exercise) => (
                      <tr key={exercise.id}>
                        <td>
                          <div className="exercisePrimeNameCell">
                            <div className="exercisePrimeMiniIcon">↗</div>
                            <span>{getExerciseName(exercise, language)}</span>
                          </div>
                        </td>

                        <td>{getAreaLabel(exercise, language)}</td>

                        <td className="exercisePrimeDescription">
                          {getExerciseDescription(exercise, language)}
                        </td>

                        <td>
                          <div className="exercisePrimeActionRow">
                            <button
                              type="button"
                              onClick={() => handleEdit(exercise)}
                            >
                              {text.edit}
                            </button>

                            <button
                              type="button"
                              className="isDanger"
                              onClick={() => handleDelete(exercise.id)}
                            >
                              {text.remove}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="exercisePrimeBottom">
            <div className="exercisePrimeCard">
              <div className="exercisePrimeCardHeader">
                <h2>{text.quickSummary}</h2>
              </div>

              <div className="exercisePrimeSummaryList">
                <div>
                  <span>{text.systemExercises}</span>
                  <strong>{exercises.length}</strong>
                </div>

                <div>
                  <span>{text.differentAreas}</span>
                  <strong>{Math.max(areaOptions.length - 1, 0)}</strong>
                </div>

                <div>
                  <span>{text.visibleResults}</span>
                  <strong>{filteredExercises.length}</strong>
                </div>
              </div>
            </div>

            <div className="exercisePrimeActionCard">
              <span>{text.quickActions}</span>
              <h3>{text.create}</h3>
              <p>{text.formHelp}</p>

              <div>
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    formRef.current?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }}
                >
                  {text.create}
                </button>

                <button type="button" onClick={loadExercises}>
                  {text.refreshList}
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}