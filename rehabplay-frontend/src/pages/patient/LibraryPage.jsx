import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PatientSubnav from "../../components/PatientSubnav";
import { fetchLibraryResources } from "../../api/patient";
import { useAppPreferences } from "../../context/AppPreferencesContext.jsx";

const libraryText = {
  "pt-PT": {
    hello: "Olá",
    userFallback: "Guilherme",

    title: "Biblioteca Multimédia",
    subtitle:
      "Recursos educativos e conteúdos de apoio para melhorares a execução dos exercícios e acompanhares a tua reabilitação com mais confiança.",

    loadingTitle: "A carregar...",
    loadingText: "A obter recursos da biblioteca.",
    errorTitle: "Erro",
    loadError: "Erro ao carregar biblioteca.",

    availableResources: "Recursos disponíveis",
    availableResourcesText:
      "Conteúdos selecionados para apoiar o teu progresso.",
    mainArea: "Área principal",
    mainAreaText: "Área mais frequente dentro da tua biblioteca atual.",
    recommendedLevel: "Nível recomendado",
    recommendedLevelText:
      "Dificuldades disponíveis com base nos conteúdos carregados.",

    filtersTitle: "Explorar biblioteca",
    filtersText:
      "Filtra por tipo, exercício ou dificuldade para encontrares rapidamente o recurso certo.",

    allTypes: "Todos",
    allAreas: "Todas",
    allDifficulties: "Todas",

    type: "Tipo",
    area: "Área",
    difficulty: "Dificuldade",

    video: "Vídeo",
    article: "Artigo",
    general: "Geral",

    easy: "Fácil",
    medium: "Média",
    hard: "Difícil",

    noResultsTitle: "Sem resultados",
    noResultsText: "Não existem recursos para os filtros selecionados.",

    untitled: "Sem título",
    exercise: "Exercício",
    duration: "Duração",
    reading: "Leitura",
    minutes: "min",
    seeContent: "Ver conteúdo",
    readArticle: "Ler artigo",
    openResource: "Abrir recurso",

    suggestionTitle: "Sugestão",
    suggestionText:
      "Consulta os vídeos antes da sessão para rever a execução correta dos movimentos.",
    objectiveTitle: "Objetivo",
    objectiveText:
      "A biblioteca ajuda-te a compreender melhor o plano e a manter a regularidade dos exercícios.",

    highlighted: "Em destaque",
    resourcesFound: "recursos encontrados",
    searchPlaceholder: "Pesquisar por título ou exercício...",
    noArea: "Sem área",
  },

  en: {
    hello: "Hi",
    userFallback: "Guilherme",

    title: "Media Library",
    subtitle:
      "Educational resources and support content to help you improve exercise execution and follow your rehabilitation with more confidence.",

    loadingTitle: "Loading...",
    loadingText: "Fetching library resources.",
    errorTitle: "Error",
    loadError: "Error loading library.",

    availableResources: "Available resources",
    availableResourcesText: "Selected content to support your progress.",
    mainArea: "Main area",
    mainAreaText: "Most frequent area in your current library.",
    recommendedLevel: "Recommended level",
    recommendedLevelText:
      "Available difficulty levels based on the uploaded content.",

    filtersTitle: "Explore library",
    filtersText:
      "Filter by type, exercise or difficulty to quickly find the right resource.",

    allTypes: "All",
    allAreas: "All",
    allDifficulties: "All",

    type: "Type",
    area: "Area",
    difficulty: "Difficulty",

    video: "Video",
    article: "Article",
    general: "General",

    easy: "Easy",
    medium: "Medium",
    hard: "Hard",

    noResultsTitle: "No results",
    noResultsText: "There are no resources for the selected filters.",

    untitled: "Untitled",
    exercise: "Exercise",
    duration: "Duration",
    reading: "Reading",
    minutes: "min",
    seeContent: "View content",
    readArticle: "Read article",
    openResource: "Open resource",

    suggestionTitle: "Suggestion",
    suggestionText:
      "Watch the videos before the session to review the correct execution of each movement.",
    objectiveTitle: "Goal",
    objectiveText:
      "The library helps you better understand your plan and maintain exercise consistency.",

    highlighted: "Highlighted",
    resourcesFound: "resources found",
    searchPlaceholder: "Search by title or exercise...",
    noArea: "No area",
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
  if (value === "TEXT") return text.article;
  return value || "-";
}

function translateBackendText(value, language, fallback = "") {
  if (!value) return fallback;

  let text = String(value);

  const ptToEn = {
    "Texto:": "Text:",
    "Vídeo:": "Video:",
    "Demonstração rápida.": "Quick demonstration.",
    "Postura direita.": "Straight posture.",
    "Levantar lentamente até ao limite confortável.":
      "Raise slowly up to the comfortable limit.",
    "Parar se houver dor.": "Stop if there is pain.",
    "Elevação de braço": "Arm raise",
  };

  const enToPt = Object.fromEntries(
    Object.entries(ptToEn).map(([pt, en]) => [en, pt])
  );

  const dictionary = language === "en" ? ptToEn : enToPt;

  Object.entries(dictionary).forEach(([from, to]) => {
    text = text.replaceAll(from, to);
  });

  return text;
}

export default function LibraryPage() {
  const { language } = useAppPreferences();
  const text = libraryText[language] || libraryText["pt-PT"];
  const [searchParams] = useSearchParams();

  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [typeFilter, setTypeFilter] = useState("ALL");
  const [areaFilter, setAreaFilter] = useState("ALL");
  const [difficultyFilter, setDifficultyFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadResources() {
      try {
        const data = await fetchLibraryResources();
        const safeResources = Array.isArray(data) ? data : [];

        setResources(safeResources);

        const exerciseFromUrl = searchParams.get("exercise");
        if (exerciseFromUrl) {
          const match = safeResources.find(
            (item) => String(item.exercise) === String(exerciseFromUrl)
          );

          if (match?.exercise_name) {
            setAreaFilter(match.exercise_name);
          }
        }
      } catch (err) {
        setError(err.message || text.loadError);
      } finally {
        setLoading(false);
      }
    }

    loadResources();
  }, [text.loadError, searchParams]);

  const typeOptions = useMemo(() => {
    const values = resources.map((item) => item.type).filter(Boolean);
    return ["ALL", ...new Set(values)];
  }, [resources]);

  const areaOptions = useMemo(() => {
    const values = resources.map((item) => item.exercise_name).filter(Boolean);
    return ["ALL", ...new Set(values)];
  }, [resources]);

  const difficultyOptions = useMemo(() => {
    const values = resources.map((item) => item.difficulty).filter(Boolean);
    return ["ALL", ...new Set(values)];
  }, [resources]);

  const filteredResources = useMemo(() => {
    const q = search.trim().toLowerCase();

    return resources.filter((item) => {
      const title = String(item.title || "").toLowerCase();
      const exerciseName = String(item.exercise_name || "").toLowerCase();

      const matchesSearch =
        !q || title.includes(q) || exerciseName.includes(q);

      const matchesType = typeFilter === "ALL" || item.type === typeFilter;
      const matchesArea =
        areaFilter === "ALL" || item.exercise_name === areaFilter;
      const matchesDifficulty =
        difficultyFilter === "ALL" || item.difficulty === difficultyFilter;

      return matchesSearch && matchesType && matchesArea && matchesDifficulty;
    });
  }, [resources, search, typeFilter, areaFilter, difficultyFilter]);

  const totalResources = resources.length;

  const mainArea = useMemo(() => {
    if (!resources.length) return "-";

    const count = {};
    for (const item of resources) {
      const key = item.exercise_name || text.noArea;
      count[key] = (count[key] || 0) + 1;
    }

    return Object.entries(count).sort((a, b) => b[1] - a[1])[0][0];
  }, [resources, text.noArea]);

  const recommendedLevel = useMemo(() => {
    if (!resources.length) return "-";

    const levels = [
      ...new Set(resources.map((item) => item.difficulty).filter(Boolean)),
    ];

    return levels.map((level) => formatDifficulty(level, text)).join(" / ");
  }, [resources, text]);

  const videoCount = useMemo(() => {
    return resources.filter((item) => item.type === "VIDEO").length;
  }, [resources]);

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

        <main className="libraryPrimePage">
          <section className="libraryPrimeHeader">
            <div>
              <h1>{text.title}</h1>
              <p>{text.subtitle}</p>
            </div>

            <div className="libraryPrimeHeaderCard">
              <span>{text.highlighted}</span>
              <strong>{videoCount}</strong>
              <p>{text.video}</p>
            </div>
          </section>

          <PatientSubnav />

          {loading && (
            <div className="libraryPrimeState">
              <h3>{text.loadingTitle}</h3>
              <p>{text.loadingText}</p>
            </div>
          )}

          {error && !loading && (
            <div className="libraryPrimeState">
              <h3>{text.errorTitle}</h3>
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && (
            <>
              <section className="libraryPrimeStats">
                <div className="libraryPrimeStat">
                  <div className="libraryPrimeIcon">▤</div>
                  <span>{text.availableResources}</span>
                  <strong>{totalResources}</strong>
                  <p>{text.availableResourcesText}</p>
                </div>

                <div className="libraryPrimeStat">
                  <div className="libraryPrimeIcon">◎</div>
                  <span>{text.mainArea}</span>
                  <strong>
                    {translateBackendText(mainArea, language, mainArea)}
                  </strong>
                  <p>{text.mainAreaText}</p>
                </div>

                <div className="libraryPrimeStat">
                  <div className="libraryPrimeIcon">↗</div>
                  <span>{text.recommendedLevel}</span>
                  <strong>{recommendedLevel}</strong>
                  <p>{text.recommendedLevelText}</p>
                </div>
              </section>

              <section className="libraryPrimeExplorer">
                <div className="libraryPrimeExplorerHeader">
                  <div>
                    <h2>{text.filtersTitle}</h2>
                    <p>{text.filtersText}</p>
                  </div>

                  <div className="libraryPrimeFound">
                    <strong>{filteredResources.length}</strong>
                    <span>{text.resourcesFound}</span>
                  </div>
                </div>

                <div className="libraryPrimeSearch">
                  <input
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder={text.searchPlaceholder}
                  />
                </div>

                <div className="libraryPrimeFilters">
                  <label>
                    <span>{text.type}</span>
                    <select
                      value={typeFilter}
                      onChange={(event) => setTypeFilter(event.target.value)}
                    >
                      {typeOptions.map((option) => (
                        <option key={option} value={option}>
                          {option === "ALL"
                            ? text.allTypes
                            : formatType(option, text)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span>{text.area}</span>
                    <select
                      value={areaFilter}
                      onChange={(event) => setAreaFilter(event.target.value)}
                    >
                      {areaOptions.map((option) => (
                        <option key={option} value={option}>
                          {option === "ALL"
                            ? text.allAreas
                            : translateBackendText(option, language, option)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span>{text.difficulty}</span>
                    <select
                      value={difficultyFilter}
                      onChange={(event) =>
                        setDifficultyFilter(event.target.value)
                      }
                    >
                      {difficultyOptions.map((option) => (
                        <option key={option} value={option}>
                          {option === "ALL"
                            ? text.allDifficulties
                            : formatDifficulty(option, text)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </section>

              <section className="libraryPrimeGrid">
                {filteredResources.length === 0 ? (
                  <div className="libraryPrimeState">
                    <h3>{text.noResultsTitle}</h3>
                    <p>{text.noResultsText}</p>
                  </div>
                ) : (
                  filteredResources.map((resource) => {
                    const isVideo = resource.type === "VIDEO";
                    const buttonLabel = isVideo
                      ? text.seeContent
                      : text.readArticle;

                    const title = translateBackendText(
                      resource.title,
                      language,
                      text.untitled
                    );

                    const exerciseName = translateBackendText(
                      resource.exercise_name,
                      language,
                      "-"
                    );

                    const description = translateBackendText(
                      resource.description,
                      language,
                      ""
                    );

                    return (
                      <article
                        key={resource.id}
                        className="libraryPrimeResource"
                      >
                        <div className="libraryPrimeResourceTop">
                          <div
                            className={`libraryPrimeResourceIcon ${
                              isVideo ? "isVideo" : "isText"
                            }`}
                          >
                            {isVideo ? "▶" : "≡"}
                          </div>

                          <div className="libraryPrimeResourceTags">
                            <span>{formatType(resource.type, text)}</span>
                            <span>
                              {formatDifficulty(resource.difficulty, text)}
                            </span>
                          </div>
                        </div>

                        <h3>{title}</h3>

                        <div className="libraryPrimeMeta">
                          <div>
                            <span>{text.exercise}</span>
                            <strong>{exerciseName}</strong>
                          </div>

                          <div>
                            <span>{text.duration}</span>
                            <strong>
                              {resource.duration_minutes
                                ? `${resource.duration_minutes} ${text.minutes}`
                                : text.reading}
                            </strong>
                          </div>
                        </div>

                        {description && (
                          <p className="libraryPrimeDescription">
                            {description}
                          </p>
                        )}

                        <div className="libraryPrimeResourceFooter">
                          {resource.video_url ? (
                            <a
                              href={resource.video_url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {buttonLabel}
                              <span>→</span>
                            </a>
                          ) : (
                            <button type="button">
                              {text.openResource}
                              <span>→</span>
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })
                )}
              </section>

              <section className="libraryPrimeBottom">
                <div className="libraryPrimeNote">
                  <div className="libraryPrimeIcon">✓</div>
                  <div>
                    <h3>{text.suggestionTitle}</h3>
                    <p>{text.suggestionText}</p>
                  </div>
                </div>

                <div className="libraryPrimeNote isDark">
                  <div className="libraryPrimeIcon">◎</div>
                  <div>
                    <h3>{text.objectiveTitle}</h3>
                    <p>{text.objectiveText}</p>
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