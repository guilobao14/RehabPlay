import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import TherapistSubnav from "../../components/TherapistSubnav";
import {
  fetchMediaResources,
  createMediaResource,
  updateMediaResource,
  deleteMediaResource,
  fetchExercises,
} from "../../api/therapist";
import { useAppPreferences } from "../../context/AppPreferencesContext.jsx";

const mediaText = {
  "pt-PT": {
    hello: "Olá",
    userFallback: "Terapeuta",
    title: "Recursos Multimédia",
    subtitle:
      "Constrói uma biblioteca clínica com vídeos e textos de apoio para melhorar a autonomia dos pacientes.",
    studioLabel: "Media Studio",
    totalResources: "Recursos",
    videos: "Vídeos",
    texts: "Textos",
    newResource: "Novo recurso",
    editResource: "Editar recurso",
    formHelp:
      "Associa cada conteúdo a um exercício para que a área do corpo seja identificada automaticamente.",
    exercise: "Exercício",
    selectExercise: "Selecionar exercício",
    bodyArea: "Área do corpo",
    selectExerciseFirst: "Seleciona primeiro um exercício",
    allBodyAreas: "Todas as áreas",
    type: "Tipo",
    titleLabel: "Título",
    difficulty: "Dificuldade",
    durationMin: "Duração (min)",
    videoUrl: "URL do vídeo",
    description: "Descrição",
    titlePlaceholder: "Ex: Vídeo: Elevação de braço",
    descriptionPlaceholder: "Explica o objetivo, cuidados e instruções principais.",
    all: "Todos",
    video: "Vídeo",
    text: "Texto",
    easy: "Fácil",
    medium: "Média",
    hard: "Difícil",
    allDifficulties: "Todas as dificuldades",
    searchPlaceholder: "Pesquisar recurso...",
    create: "Criar recurso",
    saveChanges: "Guardar alterações",
    saving: "A guardar...",
    cancel: "Cancelar",
    libraryTitle: "Biblioteca criada",
    librarySubtitle:
      "Filtra por tipo, dificuldade e área do corpo para encontrar rapidamente os conteúdos.",
    openVideo: "Abrir vídeo",
    edit: "Editar",
    remove: "Remover",
    loading: "A carregar recursos...",
    noResults: "Não foram encontrados recursos com estes filtros.",
    loadError: "Erro ao carregar recursos multimédia.",
    saveError: "Erro ao guardar recurso.",
    deleteError: "Erro ao remover recurso.",
    createSuccess: "Recurso criado com sucesso.",
    updateSuccess: "Recurso atualizado com sucesso.",
    deleteSuccess: "Recurso removido com sucesso.",
    confirmDelete: "Queres mesmo remover este recurso?",
    minutes: "min",
  },
  en: {
    hello: "Hi",
    userFallback: "Therapist",
    title: "Media Resources",
    subtitle:
      "Build a clinical library with videos and support texts to improve patient autonomy.",
    studioLabel: "Media Studio",
    totalResources: "Resources",
    videos: "Videos",
    texts: "Texts",
    newResource: "New resource",
    editResource: "Edit resource",
    formHelp:
      "Link each resource to an exercise so the body area is identified automatically.",
    exercise: "Exercise",
    selectExercise: "Select exercise",
    bodyArea: "Body area",
    selectExerciseFirst: "Select an exercise first",
    allBodyAreas: "All body areas",
    type: "Type",
    titleLabel: "Title",
    difficulty: "Difficulty",
    durationMin: "Duration (min)",
    videoUrl: "Video URL",
    description: "Description",
    titlePlaceholder: "Example: Video: Arm raise",
    descriptionPlaceholder: "Explain the goal, precautions and main instructions.",
    all: "All",
    video: "Video",
    text: "Text",
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",
    allDifficulties: "All difficulties",
    searchPlaceholder: "Search resource...",
    create: "Create resource",
    saveChanges: "Save changes",
    saving: "Saving...",
    cancel: "Cancel",
    libraryTitle: "Created library",
    librarySubtitle:
      "Filter by type, difficulty and body area to quickly find the right content.",
    openVideo: "Open video",
    edit: "Edit",
    remove: "Remove",
    loading: "Loading resources...",
    noResults: "No resources were found with these filters.",
    loadError: "Error loading media resources.",
    saveError: "Error saving resource.",
    deleteError: "Error removing resource.",
    createSuccess: "Resource created successfully.",
    updateSuccess: "Resource updated successfully.",
    deleteSuccess: "Resource removed successfully.",
    confirmDelete: "Do you really want to remove this resource?",
    minutes: "min",
  },
};

function formatDifficulty(value, text) {
  if (value === "EASY") return text.easy;
  if (value === "MEDIUM") return text.medium;
  if (value === "HARD") return text.hard;
  return value || "-";
}

function formatType(value, text) {
  if (value === "VIDEO") return text.video;
  if (value === "TEXT") return text.text;
  return value || "-";
}

function translateBackendText(value, language, fallback = "") {
  if (!value) return fallback;

  let output = String(value);

  const ptToEn = {
    "Elevação de braço": "Arm raise",
    Alongamento: "Stretching",
    Mobilidade: "Mobility",
    Fortalecimento: "Strengthening",
    Agachamento: "Squat",
    Prancha: "Plank",
    Flexão: "Push-up",
    Caminhada: "Walking",
    Ombro: "Shoulder",
    Braço: "Arm",
    Joelho: "Knee",
    Perna: "Leg",
    Costas: "Back",
    "Demonstração rápida.": "Quick demonstration.",
    "Postura direita.": "Straight posture.",
    "Levantar lentamente até ao limite confortável.":
      "Lift slowly to a comfortable limit.",
    "Parar se houver dor.": "Stop if there is pain.",
    "Texto:": "Text:",
    "Vídeo:": "Video:",
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

export default function MediaCrudPage() {
  const formRef = useRef(null);

  const { language } = useAppPreferences();
  const text = mediaText[language] || mediaText["pt-PT"];

  const [resources, setResources] = useState([]);
  const [exercises, setExercises] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [difficultyFilter, setDifficultyFilter] = useState("ALL");
  const [areaFilter, setAreaFilter] = useState("ALL");

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
      setError("");

      const [resourcesData, exercisesData] = await Promise.all([
        fetchMediaResources(),
        fetchExercises(),
      ]);

      setResources(Array.isArray(resourcesData) ? resourcesData : []);
      setExercises(Array.isArray(exercisesData) ? exercisesData : []);
    } catch (err) {
      setError(err.message || text.loadError);
    } finally {
      setLoading(false);
    }
  }

  const selectedExercise = exercises.find(
    (exercise) => String(exercise.id) === String(form.exercise)
  );

  const typeOptions = [
    { value: "ALL", label: text.all },
    { value: "VIDEO", label: text.video },
    { value: "TEXT", label: text.text },
  ];

  const difficultyOptions = [
    { value: "ALL", label: text.allDifficulties },
    { value: "EASY", label: text.easy },
    { value: "MEDIUM", label: text.medium },
    { value: "HARD", label: text.hard },
  ];

  const areaOptions = useMemo(() => {
    const areas = [
      ...new Set(exercises.map((exercise) => exercise.area).filter(Boolean)),
    ];

    return [
      { value: "ALL", label: text.allBodyAreas },
      ...areas.map((area) => ({
        value: area,
        label: translateBackendText(area, language, area),
      })),
    ];
  }, [exercises, language, text.allBodyAreas]);

  function getResourceArea(resource) {
    const relatedExercise = exercises.find(
      (exercise) => String(exercise.id) === String(resource.exercise)
    );

    return relatedExercise?.area || "";
  }

  const filteredResources = useMemo(() => {
    const q = search.trim().toLowerCase();

    return resources.filter((item) => {
      const title = translateBackendText(
        item.title,
        language,
        item.title
      ).toLowerCase();

      const description = translateBackendText(
        item.description,
        language,
        item.description
      ).toLowerCase();

      const exerciseName = translateBackendText(
        item.exercise_name,
        language,
        item.exercise_name
      ).toLowerCase();

      const bodyArea = translateBackendText(
        getResourceArea(item),
        language,
        getResourceArea(item)
      ).toLowerCase();

      const matchesSearch =
        !q ||
        title.includes(q) ||
        description.includes(q) ||
        exerciseName.includes(q) ||
        bodyArea.includes(q) ||
        item.title?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.exercise_name?.toLowerCase().includes(q);

      const matchesType = typeFilter === "ALL" || item.type === typeFilter;

      const matchesDifficulty =
        difficultyFilter === "ALL" || item.difficulty === difficultyFilter;

      const matchesArea =
        areaFilter === "ALL" || getResourceArea(item) === areaFilter;

      return matchesSearch && matchesType && matchesDifficulty && matchesArea;
    });
  }, [
    resources,
    exercises,
    search,
    typeFilter,
    difficultyFilter,
    areaFilter,
    language,
  ]);

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

    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
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
        setResources((prev) => [created, ...prev]);
        setSuccess(text.createSuccess);
      } else {
        const updated = await updateMediaResource(editingId, payload);

        setResources((prev) =>
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

  async function handleDelete(id) {
    const ok = window.confirm(text.confirmDelete);
    if (!ok) return;

    setError("");
    setSuccess("");

    try {
      await deleteMediaResource(id);

      setResources((prev) => prev.filter((item) => item.id !== id));

      if (editingId === id) resetForm();

      setSuccess(text.deleteSuccess);
    } catch (err) {
      setError(err.message || text.deleteError);
    }
  }

  const videoCount = resources.filter((item) => item.type === "VIDEO").length;
  const textCount = resources.filter((item) => item.type === "TEXT").length;

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

        <main className="mediaStudioPage">
          <section className="mediaStudioHero">
            <div className="mediaStudioHeroContent">
              <div className="mediaStudioEyebrow">{text.studioLabel}</div>
              <h1>{text.title}</h1>
              <p>{text.subtitle}</p>
            </div>

            <div className="mediaStudioHeroPanel">
              <div>
                <span>{text.totalResources}</span>
                <strong>{resources.length}</strong>
              </div>

              <div>
                <span>{text.videos}</span>
                <strong>{videoCount}</strong>
              </div>

              <div>
                <span>{text.texts}</span>
                <strong>{textCount}</strong>
              </div>
            </div>
          </section>

          <TherapistSubnav />

          {error && <div className="theraPlanPrimeError">{error}</div>}
          {success && <div className="theraPlanPrimeSuccess">{success}</div>}

          <section className="mediaStudioEditorOnly">
            <form
              ref={formRef}
              className="mediaStudioEditor"
              onSubmit={handleSubmit}
            >
              <div className="mediaStudioEditorTop">
                <div>
                  <span>
                    {formMode === "create" ? text.newResource : text.editResource}
                  </span>
                  <h2>
                    {formMode === "create" ? text.newResource : text.editResource}
                  </h2>
                  <p>{text.formHelp}</p>
                </div>

                <div className="mediaStudioTypeSwitch">
                  <button
                    type="button"
                    className={form.type === "VIDEO" ? "isActive" : ""}
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        type: "VIDEO",
                      }))
                    }
                  >
                    {text.video}
                  </button>

                  <button
                    type="button"
                    className={form.type === "TEXT" ? "isActive" : ""}
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        type: "TEXT",
                        video_url: "",
                      }))
                    }
                  >
                    {text.text}
                  </button>
                </div>
              </div>

              <div className="mediaStudioFormGrid">
                <div className="mediaStudioField">
                  <label>{text.exercise}</label>
                  <select
                    name="exercise"
                    value={form.exercise}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">{text.selectExercise}</option>

                    {exercises.map((exercise) => (
                      <option key={exercise.id} value={exercise.id}>
                        {translateBackendText(exercise.name, language, exercise.name)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mediaStudioField">
                  <label>{text.bodyArea}</label>
                  <input
                    value={
                      selectedExercise?.area
                        ? translateBackendText(
                            selectedExercise.area,
                            language,
                            selectedExercise.area
                          )
                        : text.selectExerciseFirst
                    }
                    disabled
                  />
                </div>

                <div className="mediaStudioField">
                  <label>{text.difficulty}</label>
                  <select
                    name="difficulty"
                    value={form.difficulty}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="EASY">{text.easy}</option>
                    <option value="MEDIUM">{text.medium}</option>
                    <option value="HARD">{text.hard}</option>
                  </select>
                </div>

                <div className="mediaStudioField">
                  <label>{text.titleLabel}</label>
                  <input
                    name="title"
                    value={form.title}
                    onChange={handleFormChange}
                    placeholder={text.titlePlaceholder}
                    required
                  />
                </div>

                <div className="mediaStudioField">
                  <label>{text.durationMin}</label>
                  <input
                    type="number"
                    min="1"
                    name="duration_minutes"
                    value={form.duration_minutes}
                    onChange={handleFormChange}
                    required
                  />
                </div>

                {form.type === "VIDEO" && (
                  <div className="mediaStudioField">
                    <label>{text.videoUrl}</label>
                    <input
                      name="video_url"
                      value={form.video_url}
                      onChange={handleFormChange}
                      placeholder="https://..."
                    />
                  </div>
                )}

                <div className="mediaStudioField mediaStudioWide">
                  <label>{text.description}</label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleFormChange}
                    placeholder={text.descriptionPlaceholder}
                    required
                  />
                </div>
              </div>

              <div className="mediaStudioActions">
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

          <section className="mediaStudioLibraryHeader">
            <div>
              <h2>{text.libraryTitle}</h2>
              <p>{text.librarySubtitle}</p>
            </div>

            <div className="mediaStudioLibraryFilters">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={text.searchPlaceholder}
              />

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                {typeOptions.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>

              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
              >
                {difficultyOptions.map((difficulty) => (
                  <option key={difficulty.value} value={difficulty.value}>
                    {difficulty.label}
                  </option>
                ))}
              </select>

              <select
                value={areaFilter}
                onChange={(e) => setAreaFilter(e.target.value)}
              >
                {areaOptions.map((area) => (
                  <option key={area.value} value={area.value}>
                    {area.label}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section className="mediaStudioLibrary">
            {loading ? (
              <div className="mediaStudioEmpty">{text.loading}</div>
            ) : filteredResources.length === 0 ? (
              <div className="mediaStudioEmpty">{text.noResults}</div>
            ) : (
              filteredResources.map((resource) => {
                const isVideo = resource.type === "VIDEO";
                const resourceArea = getResourceArea(resource);

                return (
                  <article key={resource.id} className="mediaStudioResource">
                    <div
                      className={`mediaStudioResourceIcon ${
                        isVideo ? "isVideo" : "isText"
                      }`}
                    >
                      {isVideo ? "▶" : "≡"}
                    </div>

                    <div className="mediaStudioResourceBody">
                      <div className="mediaStudioResourceTop">
                        <div>
                          <h3>
                            {translateBackendText(
                              resource.title,
                              language,
                              resource.title || "-"
                            )}
                          </h3>

                          <p>
                            {translateBackendText(
                              resource.exercise_name,
                              language,
                              resource.exercise_name || "-"
                            )}
                          </p>
                        </div>

                        <div className="mediaStudioBadges">
                          <span>{formatType(resource.type, text)}</span>
                          <span>{formatDifficulty(resource.difficulty, text)}</span>
                          <span>
                            {translateBackendText(
                              resourceArea,
                              language,
                              resourceArea || "-"
                            )}
                          </span>
                          <span>
                            {resource.duration_minutes || 0} {text.minutes}
                          </span>
                        </div>
                      </div>

                      <div className="mediaStudioDescription">
                        {translateBackendText(
                          resource.description,
                          language,
                          resource.description || "-"
                        )}
                      </div>

                      <div className="mediaStudioResourceActions">
                        {isVideo && resource.video_url && (
                          <a
                            href={resource.video_url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {text.openVideo}
                          </a>
                        )}

                        <button type="button" onClick={() => handleEdit(resource)}>
                          {text.edit}
                        </button>

                        <button
                          type="button"
                          className="isDanger"
                          onClick={() => handleDelete(resource.id)}
                        >
                          {text.remove}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </section>
        </main>
      </div>
    </div>
  );
}