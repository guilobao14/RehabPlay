import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PatientSubnav from "../../components/PatientSubnav";
import { fetchActivePlan } from "../../api/patient";

export default function MyPlanPage() {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPlan() {
      try {
        const data = await fetchActivePlan();
        console.log("ACTIVE PLAN:", data);
        setPlan(data);
      } catch (err) {
        setError(err.message || "Erro ao carregar plano.");
      } finally {
        setLoading(false);
      }
    }

    loadPlan();
  }, []);

  const items = plan?.items || [];
  const completedCount = 0; // ainda não temos estado por item neste endpoint
  const pendingCount = items.length;

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
          <h1 className="pageTitle">Plano de Exercícios</h1>
          <div className="pageSubtitle">
            Consulta o teu plano atual e acompanha o estado de cada exercício
          </div>
        </div>

        <div className="content">
          <PatientSubnav />

          {loading && (
            <div className="planSummaryCard">
              <h3 className="planSummaryTitle">A carregar...</h3>
              <p>A obter o teu plano ativo.</p>
            </div>
          )}

          {error && !loading && (
            <div className="planSummaryCard">
              <h3 className="planSummaryTitle">Erro</h3>
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && !plan && (
            <div className="planSummaryCard">
              <h3 className="planSummaryTitle">Sem plano ativo</h3>
              <p>Neste momento não tens nenhum plano ativo associado.</p>
            </div>
          )}

          {!loading && !error && plan && (
            <>
              <div className="planHeroGrid">
                <div className="planHeroCard">
                  <div className="planHeroLabel">Plano atual</div>
                  <div className="planHeroValue">{plan.title || "Sem título"}</div>
                  <div className="planHeroText">
                    Plano ativo associado à tua reabilitação.
                  </div>
                </div>

                <div className="planHeroCard">
                  <div className="planHeroLabel">Estado</div>
                  <div className="planHeroValue">
                    {plan.is_active ? "Ativo" : "Inativo"}
                  </div>
                  <div className="planHeroText">
                    Estado atual do plano atribuído pelo terapeuta.
                  </div>
                </div>

                <div className="planHeroCard">
                  <div className="planHeroLabel">Exercícios no plano</div>
                  <div className="planHeroValue">{items.length}</div>
                  <div className="planHeroText">
                    Total de itens atualmente presentes no plano.
                  </div>
                </div>
              </div>

              <div className="planSectionHeader">
                <h2 className="planSectionTitle">Exercícios do plano</h2>
                <p className="planSectionSub">
                  Vê os detalhes de cada exercício definido pelo terapeuta
                </p>
              </div>

              <div className="planExercisesGrid">
                {items.length === 0 ? (
                  <div className="planSummaryCard">
                    <h3 className="planSummaryTitle">Sem exercícios</h3>
                    <p>Este plano ainda não tem exercícios associados.</p>
                  </div>
                ) : (
                  items.map((item) => (
                    <div key={item.id} className="planExerciseCard">
                      <div className="planExerciseTop">
                        <div>
                          <h3 className="planExerciseTitle">
                            {item.exercise_name || "Exercício"}
                          </h3>
                          <div className="planDifficultyTag">
                            Frequência: {item.frequency_per_week || 0}/semana
                          </div>
                        </div>

                        <div className="planStatusBadge planStatusPending">
                          Planeado
                        </div>
                      </div>

                      <div className="planExerciseInfo">
                        <div className="planInfoBox">
                          <div className="planInfoLabel">Duração</div>
                          <div className="planInfoValue">
                            {item.duration_minutes ?? 0} min
                          </div>
                        </div>

                        <div className="planInfoBox">
                          <div className="planInfoLabel">Séries</div>
                          <div className="planInfoValue">
                            {item.sets ?? 0}
                          </div>
                        </div>

                        <div className="planInfoBox">
                          <div className="planInfoLabel">Repetições</div>
                          <div className="planInfoValue">
                            {item.reps ?? 0}
                          </div>
                        </div>

                        <div className="planInfoBox">
                          <div className="planInfoLabel">ID exercício</div>
                          <div className="planInfoValue">
                            {item.exercise ?? "-"}
                          </div>
                        </div>
                      </div>

                      <div className="planExerciseFooter">
                        <button className="planGhostBtn">Ver detalhes</button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="planBottomArea">
                <div className="planSummaryCard">
                  <h3 className="planSummaryTitle">Resumo rápido</h3>

                  <div className="planSummaryList">
                    <div className="planSummaryItem">
                      <span>Total de exercícios</span>
                      <strong>{items.length}</strong>
                    </div>
                    <div className="planSummaryItem">
                      <span>Concluídos</span>
                      <strong>{completedCount}</strong>
                    </div>
                    <div className="planSummaryItem">
                      <span>Por fazer</span>
                      <strong>{pendingCount}</strong>
                    </div>
                  </div>
                </div>

                <div className="planCTABox">
                  <div>
                    <h3 className="planSummaryTitle">Atualizar progresso</h3>
                    <p className="planCTAHelp">
                      Regista os exercícios realizados e mantém o teu histórico
                      atualizado.
                    </p>
                  </div>

                  <Link
                    to="/patient/gamification"
                    className="mediumButton planCTAButton"
                  >
                    Registar exercício
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}