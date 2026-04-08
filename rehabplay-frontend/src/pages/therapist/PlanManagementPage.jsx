import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import TherapistSubnav from "../../components/TherapistSubnav";
import { 
  fetchTherapistPatients,
  fetchPlans,
  createPlan,
  updatePlan,
  fetchPlanItems,
  addPlanItem,
  deletePlanItem,
  fetchExercises,
} from "../../api/therapist";

export default function PlanManagementPage() {
  const [patients, setPatients] = useState([]);
  const [plans, setPlans] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [selectedPlanItems, setSelectedPlanItems] = useState([]);

  const [loading, setLoading] = useState(true);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [planForm, setPlanForm] = useState({
    patient: "",
    title: "",
    is_active: true,
  });

  const [itemForm, setItemForm] = useState({
    exercise: "",
    duration_minutes: 10,
    sets: 3,
    reps: 10,
    frequency_per_week: 3,
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [patientsData, plansData, exercisesData] = await Promise.all([
          fetchTherapistPatients(),
          fetchPlans(),
          fetchExercises(),
        ]);

        const safePatients = Array.isArray(patientsData) ? patientsData : [];
        const safePlans = Array.isArray(plansData) ? plansData : [];
        const safeExercises = Array.isArray(exercisesData) ? exercisesData : [];

        setPatients(safePatients);
        setPlans(safePlans);
        setExercises(safeExercises);

        if (safePlans.length > 0) {
          setSelectedPlanId(safePlans[0].id);
        }
      } catch (err) {
        setError(err.message || "Erro ao carregar gestão de planos.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  useEffect(() => {
    async function loadPlanItems() {
      if (!selectedPlanId) {
        setSelectedPlanItems([]);
        return;
      }

      try {
        setItemsLoading(true);
        const data = await fetchPlanItems(selectedPlanId);
        setSelectedPlanItems(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || "Erro ao carregar itens do plano.");
      } finally {
        setItemsLoading(false);
      }
    }

    loadPlanItems();
  }, [selectedPlanId]);

  const selectedPlan = useMemo(() => {
    return plans.find((plan) => plan.id === selectedPlanId) || null;
  }, [plans, selectedPlanId]);

  function getPatientNameById(patientId) {
    const found = patients.find((patient) => patient.user_id === patientId);
    return found?.display_name || found?.username || `Paciente ${patientId}`;
  }

  function getExerciseNameById(exerciseId) {
    const found = exercises.find((exercise) => exercise.id === exerciseId);
    return found?.name || `Exercício ${exerciseId}`;
  }

  function handlePlanFormChange(event) {
    const { name, value, type, checked } = event.target;
    setPlanForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function handleItemFormChange(event) {
    const { name, value } = event.target;
    setItemForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleCreatePlan(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    try {
      const created = await createPlan({
        patient: Number(planForm.patient),
        title: planForm.title,
        is_active: !!planForm.is_active,
      });

      const updatedPlans = [created, ...plans];
      setPlans(updatedPlans);
      setSelectedPlanId(created.id);
      setPlanForm({
        patient: "",
        title: "",
        is_active: true,
      });
      setSuccess("Plano criado com sucesso.");
    } catch (err) {
      setError(err.message || "Erro ao criar plano.");
    }
  }

  async function handleToggleActive(plan) {
    setError("");
    setSuccess("");

    try {
      const updated = await updatePlan(plan.id, {
        is_active: !plan.is_active,
      });

      setPlans((prev) =>
        prev.map((item) => {
          if (item.id === updated.id) return updated;
          if (updated.is_active && item.patient === updated.patient) {
            return { ...item, is_active: false };
          }
          return item;
        })
      );

      setSuccess("Estado do plano atualizado.");
    } catch (err) {
      setError(err.message || "Erro ao atualizar plano.");
    }
  }

  async function handleAddPlanItem(event) {
    event.preventDefault();
    if (!selectedPlanId) return;

    setError("");
    setSuccess("");

    try {
      const created = await addPlanItem(selectedPlanId, {
        exercise: Number(itemForm.exercise),
        duration_minutes: Number(itemForm.duration_minutes),
        sets: Number(itemForm.sets),
        reps: Number(itemForm.reps),
        frequency_per_week: Number(itemForm.frequency_per_week),
      });

      setSelectedPlanItems((prev) => [...prev, created]);
      setItemForm({
        exercise: "",
        duration_minutes: 10,
        sets: 3,
        reps: 10,
        frequency_per_week: 3,
      });
      setSuccess("Exercício adicionado ao plano.");
    } catch (err) {
      setError(err.message || "Erro ao adicionar exercício ao plano.");
    }
  }

  async function handleDeleteItem(itemId) {
    setError("");
    setSuccess("");

    try {
      await deletePlanItem(itemId);
      setSelectedPlanItems((prev) => prev.filter((item) => item.id !== itemId));
      setSuccess("Exercício removido do plano.");
    } catch (err) {
      setError(err.message || "Erro ao remover exercício do plano.");
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
          <h1 className="pageTitle">Gestão de Planos</h1>
          <div className="pageSubtitle">
            Criar, ativar e gerir planos de reabilitação dos pacientes
          </div>
        </div>

        <div className="content">
          <TherapistSubnav />
          {loading && (
            <div className="theraCard">
              <h3 className="theraCardTitle">A carregar...</h3>
              <p className="theraMutedText">A obter pacientes, planos e exercícios.</p>
            </div>
          )}

          {!loading && error && <div className="theraNoticeError">{error}</div>}
          {!loading && success && <div className="theraNoticeOk">{success}</div>}

          {!loading && (
            <>
              <div className="theraTopGrid">
                <form className="theraCard" onSubmit={handleCreatePlan}>
                  <div className="theraCardHeader">
                    <h3 className="theraCardTitle">Criar novo plano</h3>
                  </div>

                  <div className="theraFormGrid">
                    <div className="theraField">
                      <label className="theraLabel">Paciente</label>
                      <select
                        className="input"
                        name="patient"
                        value={planForm.patient}
                        onChange={handlePlanFormChange}
                        required
                      >
                        <option value="">Selecionar paciente</option>
                        {patients.map((patient) => (
                          <option key={patient.user_id} value={patient.user_id}>
                            {patient.display_name || patient.username}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="theraField">
                      <label className="theraLabel">Título do plano</label>
                      <input
                        className="input"
                        name="title"
                        value={planForm.title}
                        onChange={handlePlanFormChange}
                        placeholder="Ex: Mobilidade do Ombro"
                        required
                      />
                    </div>

                    <label className="theraCheckboxRow">
                      <input
                        type="checkbox"
                        name="is_active"
                        checked={planForm.is_active}
                        onChange={handlePlanFormChange}
                      />
                      <span>Definir como plano ativo</span>
                    </label>
                  </div>

                  <button type="submit" className="mediumButton theraMainBtn">
                    Criar plano
                  </button>
                </form>

                <div className="theraCard">
                  <div className="theraCardHeader">
                    <h3 className="theraCardTitle">Resumo</h3>
                  </div>

                  <div className="theraInfoList">
                    <div className="theraInfoItem">
                      <span>Pacientes disponíveis</span>
                      <strong>{patients.length}</strong>
                    </div>
                    <div className="theraInfoItem">
                      <span>Planos existentes</span>
                      <strong>{plans.length}</strong>
                    </div>
                    <div className="theraInfoItem">
                      <span>Exercícios disponíveis</span>
                      <strong>{exercises.length}</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="theraMainGrid">
                <div className="theraCard">
                  <div className="theraCardHeader">
                    <h3 className="theraCardTitle">Planos criados</h3>
                  </div>

                  <div className="theraPlanList">
                    {plans.length === 0 ? (
                      <div className="theraEmptyBox">
                        Ainda não existem planos criados.
                      </div>
                    ) : (
                      plans.map((plan) => (
                        <button
                          key={plan.id}
                          className={`theraPlanItem ${
                            selectedPlanId === plan.id ? "theraPlanItemActive" : ""
                          }`}
                          onClick={() => setSelectedPlanId(plan.id)}
                        >
                          <div className="theraPlanTop">
                            <div className="theraPlanName">{plan.title}</div>
                            <span className={`theraStatusTag ${plan.is_active ? "theraStatusActive" : ""}`}>
                              {plan.is_active ? "Ativo" : "Inativo"}
                            </span>
                          </div>

                          <div className="theraPlanMeta">
                            {getPatientNameById(plan.patient)}
                          </div>

                          <div className="theraPlanActions">
                            <span className="theraSmallLink">
                              Ver detalhes
                            </span>
                            <span
                              className="theraSmallLink"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleActive(plan);
                              }}
                            >
                              {plan.is_active ? "Desativar" : "Ativar"}
                            </span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                <div className="theraRightColumn">
                  <div className="theraCard">
                    <div className="theraCardHeader">
                      <h3 className="theraCardTitle">
                        {selectedPlan ? "Detalhe do plano" : "Seleciona um plano"}
                      </h3>
                    </div>

                    {selectedPlan ? (
                      <div className="theraInfoList">
                        <div className="theraInfoItem">
                          <span>Título</span>
                          <strong>{selectedPlan.title}</strong>
                        </div>
                        <div className="theraInfoItem">
                          <span>Paciente</span>
                          <strong>{getPatientNameById(selectedPlan.patient)}</strong>
                        </div>
                        <div className="theraInfoItem">
                          <span>Estado</span>
                          <strong>{selectedPlan.is_active ? "Ativo" : "Inativo"}</strong>
                        </div>
                        <div className="theraInfoItem">
                          <span>Itens no plano</span>
                          <strong>{selectedPlanItems.length}</strong>
                        </div>
                      </div>
                    ) : (
                      <div className="theraEmptyBox">
                        Escolhe um plano para veres os exercícios associados.
                      </div>
                    )}
                  </div>

                  {selectedPlan && (
                    <form className="theraCard" onSubmit={handleAddPlanItem}>
                      <div className="theraCardHeader">
                        <h3 className="theraCardTitle">Adicionar exercício</h3>
                      </div>

                      <div className="theraFormGrid">
                        <div className="theraField">
                          <label className="theraLabel">Exercício</label>
                          <select
                            className="input"
                            name="exercise"
                            value={itemForm.exercise}
                            onChange={handleItemFormChange}
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
                          <label className="theraLabel">Duração (min)</label>
                          <input
                            className="input"
                            type="number"
                            name="duration_minutes"
                            min="1"
                            value={itemForm.duration_minutes}
                            onChange={handleItemFormChange}
                            required
                          />
                        </div>

                        <div className="theraField">
                          <label className="theraLabel">Séries</label>
                          <input
                            className="input"
                            type="number"
                            name="sets"
                            min="1"
                            value={itemForm.sets}
                            onChange={handleItemFormChange}
                            required
                          />
                        </div>

                        <div className="theraField">
                          <label className="theraLabel">Repetições</label>
                          <input
                            className="input"
                            type="number"
                            name="reps"
                            min="1"
                            value={itemForm.reps}
                            onChange={handleItemFormChange}
                            required
                          />
                        </div>

                        <div className="theraField">
                          <label className="theraLabel">Frequência / semana</label>
                          <input
                            className="input"
                            type="number"
                            name="frequency_per_week"
                            min="1"
                            value={itemForm.frequency_per_week}
                            onChange={handleItemFormChange}
                            required
                          />
                        </div>
                      </div>

                      <button type="submit" className="mediumButton theraMainBtn">
                        Adicionar ao plano
                      </button>
                    </form>
                  )}

                  <div className="theraCard">
                    <div className="theraCardHeader">
                      <h3 className="theraCardTitle">Exercícios do plano</h3>
                    </div>

                    {itemsLoading ? (
                      <div className="theraEmptyBox">A carregar itens...</div>
                    ) : selectedPlanItems.length === 0 ? (
                      <div className="theraEmptyBox">
                        Este plano ainda não tem exercícios associados.
                      </div>
                    ) : (
                      <div className="theraItemsList">
                        {selectedPlanItems.map((item) => (
                          <div key={item.id} className="theraItemCard">
                            <div className="theraItemTop">
                              <div className="theraItemName">
                                {item.exercise_name || getExerciseNameById(item.exercise)}
                              </div>

                              <button
                                type="button"
                                className="theraDeleteBtn"
                                onClick={() => handleDeleteItem(item.id)}
                              >
                                Remover
                              </button>
                            </div>

                            <div className="theraItemMeta">
                              {item.duration_minutes} min · {item.sets} séries ·{" "}
                              {item.reps} reps · {item.frequency_per_week}x/semana
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
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