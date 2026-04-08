import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PatientSubnav from "../../components/PatientSubnav";
import { fetchLibraryResources } from "../../api/patient";

function formatDifficulty(value) {
  if (value === "EASY") return "Fácil";
  if (value === "MEDIUM") return "Média";
  if (value === "HARD") return "Difícil";
  return value || "-";
}

function formatType(value) {
  if (value === "VIDEO") return "Vídeo";
  if (value === "TEXT") return "Artigo";
  return value || "-";
}

export default function LibraryPage() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [typeFilter, setTypeFilter] = useState("Todos");
  const [areaFilter, setAreaFilter] = useState("Todas");
  const [difficultyFilter, setDifficultyFilter] = useState("Todas");

  useEffect(() => {
    async function loadResources() {
      try {
        const data = await fetchLibraryResources();
        setResources(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || "Erro ao carregar biblioteca.");
      } finally {
        setLoading(false);
      }
    }

    loadResources();
  }, []);

  const typeOptions = useMemo(() => {
    const values = resources.map((item) => item.type).filter(Boolean);
    return ["Todos", ...new Set(values)];
  }, [resources]);

  const areaOptions = useMemo(() => {
    const values = resources.map((item) => item.exercise_name).filter(Boolean);
    return ["Todas", ...new Set(values)];
  }, [resources]);

  const difficultyOptions = useMemo(() => {
    const values = resources.map((item) => item.difficulty).filter(Boolean);
    return ["Todas", ...new Set(values)];
  }, [resources]);

  const filteredResources = useMemo(() => {
    return resources.filter((item) => {
      const matchesType = typeFilter === "Todos" || item.type === typeFilter;
      const matchesArea =
        areaFilter === "Todas" || item.exercise_name === areaFilter;
      const matchesDifficulty =
        difficultyFilter === "Todas" || item.difficulty === difficultyFilter;

      return matchesType && matchesArea && matchesDifficulty;
    });
  }, [resources, typeFilter, areaFilter, difficultyFilter]);

  const totalResources = resources.length;

  const mainArea = useMemo(() => {
    if (!resources.length) return "-";

    const count = {};
    for (const item of resources) {
      const key = item.exercise_name || "Sem área";
      count[key] = (count[key] || 0) + 1;
    }

    return Object.entries(count).sort((a, b) => b[1] - a[1])[0][0];
  }, [resources]);

  const recommendedLevel = useMemo(() => {
    if (!resources.length) return "-";

    const levels = [
      ...new Set(resources.map((item) => item.difficulty).filter(Boolean)),
    ];
    return levels.map(formatDifficulty).join(" / ");
  }, [resources]);

  return (
    <div className="appPage">
      <div className="appShellMockup">
        <div className="topbar">
          <Link to="/dashboard" className="brandLink">
            RehabPlay
          </Link>
          <div className="userArea">Olá, Guilherme</div>
        </div>

        <div className="pageHeader">
          <h1 className="pageTitle">Biblioteca Multimédia</h1>
          <div className="pageSubtitle">
            Recursos de apoio à reabilitação e aprendizagem
          </div>
        </div>

        <div className="content">
          <PatientSubnav />

          {loading && (
            <div className="libraryInfoCard">
              <h3 className="libraryInfoTitle">A carregar...</h3>
              <p className="libraryInfoText">A obter recursos da biblioteca.</p>
            </div>
          )}

          {error && !loading && (
            <div className="libraryInfoCard">
              <h3 className="libraryInfoTitle">Erro</h3>
              <p className="libraryInfoText">{error}</p>
            </div>
          )}

          {!loading && !error && (
            <>
              <div className="libraryHeroGrid">
                <div className="libraryHeroCard">
                  <div className="libraryHeroLabel">Recursos disponíveis</div>
                  <div className="libraryHeroValue">{totalResources}</div>
                  <div className="libraryHeroText">
                    Conteúdos selecionados para apoiar o teu progresso.
                  </div>
                </div>

                <div className="libraryHeroCard">
                  <div className="libraryHeroLabel">Área principal</div>
                  <div className="libraryHeroValue">{mainArea}</div>
                  <div className="libraryHeroText">
                    Recurso mais frequente dentro da tua biblioteca atual.
                  </div>
                </div>

                <div className="libraryHeroCard">
                  <div className="libraryHeroLabel">Nível recomendado</div>
                  <div className="libraryHeroValue">{recommendedLevel}</div>
                  <div className="libraryHeroText">
                    Dificuldades disponíveis com base nos conteúdos carregados.
                  </div>
                </div>
              </div>

              <div className="librarySectionHeader">
                <h2 className="librarySectionTitle">Filtrar recursos</h2>
                <p className="librarySectionSub">
                  Encontra rapidamente o conteúdo mais útil para ti
                </p>
              </div>

              <div className="libraryFiltersRow">
                <select
                  className="select"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  {typeOptions.map((option) => (
                    <option key={option} value={option}>
                      Tipo: {option === "Todos" ? "Todos" : formatType(option)}
                    </option>
                  ))}
                </select>

                <select
                  className="select"
                  value={areaFilter}
                  onChange={(e) => setAreaFilter(e.target.value)}
                >
                  {areaOptions.map((option) => (
                    <option key={option} value={option}>
                      Área: {option}
                    </option>
                  ))}
                </select>

                <select
                  className="select"
                  value={difficultyFilter}
                  onChange={(e) => setDifficultyFilter(e.target.value)}
                >
                  {difficultyOptions.map((option) => (
                    <option key={option} value={option}>
                      Dificuldade:{" "}
                      {option === "Todas" ? "Todas" : formatDifficulty(option)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="libraryResourcesGrid">
                {filteredResources.length === 0 ? (
                  <div className="libraryInfoCard">
                    <h3 className="libraryInfoTitle">Sem resultados</h3>
                    <p className="libraryInfoText">
                      Não existem recursos para os filtros selecionados.
                    </p>
                  </div>
                ) : (
                  filteredResources.map((resource) => {
                    const isVideo =
                      resource.type === "VIDEO" || resource.type === "Vídeo";
                    const buttonLabel = isVideo ? "Ver conteúdo" : "Ler artigo";

                    return (
                      <div key={resource.id} className="libraryResourceCard">
                        <div className="libraryResourceIcon">
                          {isVideo ? "🎥" : "📄"}
                        </div>

                        <h3 className="libraryResourceTitle">
                          {resource.title || "Sem título"}
                        </h3>

                        <div className="libraryMetaRow">
                          <span className="libraryMetaTag">
                            {formatType(resource.type)}
                          </span>
                          <span className="libraryMetaTag">
                            {formatDifficulty(resource.difficulty)}
                          </span>
                        </div>

                        <div className="libraryResourceText">
                          Exercício: <strong>{resource.exercise_name || "-"}</strong>
                        </div>

                        <div className="libraryResourceText">
                          Duração:{" "}
                          <strong>
                            {resource.duration_minutes
                              ? `${resource.duration_minutes} min`
                              : "Leitura"}
                          </strong>
                        </div>

                        {resource.description && (
                          <div className="libraryResourceText">
                            {resource.description}
                          </div>
                        )}

                        {resource.video_url ? (
                          <a
                            className="smallButton"
                            href={resource.video_url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {buttonLabel}
                          </a>
                        ) : (
                          <button className="smallButton" type="button">
                            {buttonLabel}
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              <div className="libraryBottomGrid">
                <div className="libraryInfoCard">
                  <h3 className="libraryInfoTitle">Sugestão</h3>
                  <p className="libraryInfoText">
                    Consulta os vídeos antes da sessão para rever a execução correta
                    dos movimentos.
                  </p>
                </div>

                <div className="libraryInfoCard">
                  <h3 className="libraryInfoTitle">Objetivo</h3>
                  <p className="libraryInfoText">
                    A biblioteca ajuda-te a compreender melhor o plano e a manter a
                    regularidade dos exercícios.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}