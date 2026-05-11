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
import { useAppPreferences } from "../../context/AppPreferencesContext.jsx";

const planManagerText = {
  "pt-PT": {
    hello: "Olá",
    userFallback: "Terapeuta",

    title: "Gestão de Planos",
    subtitle:
      "Cria, ativa e gere planos de reabilitação personalizados para cada paciente.",

    loadingTitle: "A carregar...",
    loadingText: "A obter pacientes, planos e exercícios.",
    errorFallback: "Erro ao carregar gestão de planos.",

    createPlan: "Criar novo plano",
    createPlanText:
      "Define o paciente, o título e se este deve ficar como plano ativo.",
    patient: "Paciente",
    selectPatient: "Selecionar paciente",
    planTitle: "Título do plano",
    planPlaceholder: "Ex: Mobilidade do Ombro",
    setActive: "Definir como plano ativo",
    createPlanButton: "Criar plano",
    createSuccess: "Plano criado com sucesso.",
    createError: "Erro ao criar plano.",

    summary: "Resumo",
    availablePatients: "Pacientes disponíveis",
    existingPlans: "Planos existentes",
    availableExercises: "Exercícios disponíveis",
    activePlans: "Planos ativos",

    createdPlans: "Planos criados",
    createdPlansText: "Seleciona um plano para consultar e gerir os exercícios.",
    noPlans: "Ainda não existem planos criados.",
    active: "Ativo",
    inactive: "Inativo",
    seeDetails: "Ver detalhes",
    activate: "Ativar",
    deactivate: "Desativar",
    updateSuccess: "Estado do plano atualizado.",
    updateError: "Erro ao atualizar plano.",

    planDetail: "Detalhe do plano",
    selectPlan: "Seleciona um plano",
    selectPlanText: "Escolhe um plano para veres os exercícios associados.",
    planState: "Estado",
    planItems: "Itens no plano",

    addExercise: "Adicionar exercício",
    addExerciseText:
      "Configura duração, séries, repetições e frequência semanal do exercício.",
    exercise: "Exercício",
    selectExercise: "Selecionar exercício",
    duration: "Duração",
    minutesShort: "min",
    sets: "Séries",
    reps: "Repetições",
    frequency: "Frequência / semana",
    addToPlan: "Adicionar ao plano",
    addSuccess: "Exercício adicionado ao plano.",
    addError: "Erro ao adicionar exercício ao plano.",

    planExercises: "Exercícios do plano",
    loadingItems: "A carregar itens...",
    noItems: "Este plano ainda não tem exercícios associados.",
    remove: "Remover",
    removeSuccess: "Exercício removido do plano.",
    removeError: "Erro ao remover exercício do plano.",

    undefinedPatient: "Paciente não definido",
    patientFallback: "Paciente",
    exerciseFallback: "Exercício",
    planFallback: "Plano sem título",

    rightPanelTitle: "Configuração clínica",
    rightPanelText:
      "Os parâmetros definidos aqui aparecem depois no plano do paciente e servem de base para o registo de progresso.",
  },

  en: {
    hello: "Hi",
    userFallback: "Therapist",

    title: "Plan Management",
    subtitle:
      "Create, activate and manage personalized rehabilitation plans for each patient.",

    loadingTitle: "Loading...",
    loadingText: "Fetching patients, plans and exercises.",
    errorFallback: "Error loading plan management.",

    createPlan: "Create new plan",
    createPlanText:
      "Choose the patient, define the title and decide whether this should be the active plan.",
    patient: "Patient",
    selectPatient: "Select patient",
    planTitle: "Plan title",
    planPlaceholder: "Example: Shoulder Mobility",
    setActive: "Set as active plan",
    createPlanButton: "Create plan",
    createSuccess: "Plan created successfully.",
    createError: "Error creating plan.",

    summary: "Summary",
    availablePatients: "Available patients",
    existingPlans: "Existing plans",
    availableExercises: "Available exercises",
    activePlans: "Active plans",

    createdPlans: "Created plans",
    createdPlansText: "Select a plan to review and manage its exercises.",
    noPlans: "No plans have been created yet.",
    active: "Active",
    inactive: "Inactive",
    seeDetails: "View details",
    activate: "Activate",
    deactivate: "Deactivate",
    updateSuccess: "Plan status updated.",
    updateError: "Error updating plan.",

    planDetail: "Plan detail",
    selectPlan: "Select a plan",
    selectPlanText: "Choose a plan to view its assigned exercises.",
    planState: "Status",
    planItems: "Plan items",

    addExercise: "Add exercise",
    addExerciseText:
      "Configure duration, sets, repetitions and weekly frequency for the exercise.",
    exercise: "Exercise",
    selectExercise: "Select exercise",
    duration: "Duration",
    minutesShort: "min",
    sets: "Sets",
    reps: "Reps",
    frequency: "Frequency / week",
    addToPlan: "Add to plan",
    addSuccess: "Exercise added to plan.",
    addError: "Error adding exercise to plan.",

    planExercises: "Plan exercises",
    loadingItems: "Loading items...",
    noItems: "This plan does not have assigned exercises yet.",
    remove: "Remove",
    removeSuccess: "Exercise removed from plan.",
    removeError: "Error removing exercise from plan.",

    undefinedPatient: "Undefined patient",
    patientFallback: "Patient",
    exerciseFallback: "Exercise",
    planFallback: "Untitled plan",

    rightPanelTitle: "Clinical configuration",
    rightPanelText:
      "The parameters defined here appear later in the patient's plan and are used as the basis for progress tracking.",
  },
};

function translateBackendText(value, language, fallback = "") {
  if (!value) return fallback;
  if (language !== "en") return value;

  let text = String(value);

  const dictionary = {
    "Plano - Teste Notificações": "Plan - Notification Test",
    "Plano Semana": "Week Plan",
    "Plano de reabilitação": "Rehabilitation plan",
    "Mobilidade do Ombro": "Shoulder Mobility",
    "Elevação de braço": "Arm raise",
    Alongamento: "Stretching",
    Mobilidade: "Mobility",
    Fortalecimento: "Strengthening",
    Agachamento: "Squat",
    Prancha: "Plank",
    Flexão: "Push-up",
    Caminhada: "Walking",
    "Paciente undefined": "Undefined patient",
  };

  Object.entries(dictionary).forEach(([pt, en]) => {
    text = text.replaceAll(pt, en);
  });

  return text;
}

export default function PlanManagementPage() {
  const { language } = useAppPreferences();
  const text = planManagerText[language] || planManagerText["pt-PT"];

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
        setLoading(true);
        setError("");

        const [patientsData, plansData, exercisesData] = await Promise.all([
          fetchTherapistPatients(),
          fetchPlans(),
          fetchExercises(),
        ]);

        const safePatients = Array.isArray(patientsData) ? patientsData : [];
        const safeExercises = Array.isArray(exercisesData) ? exercisesData : [];
        const safePlans = (Array.isArray(plansData) ? plansData : []).map((plan) => {
  let patientId =
    plan.patient ??
    plan.patient_id ??
    plan.user_id ??
    plan.patient_user_id ??
    null;

  if (!patientId && Array.isArray(plan.items) && plan.items.length > 0) {
    patientId =
      plan.items[0]?.patient ??
      plan.items[0]?.patient_id ??
      plan.items[0]?.user_id ??
      null;
  }

  return {
    ...plan,
    patient: patientId,
  };
});
        
        setPatients(safePatients);
        setPlans(safePlans);
        setExercises(safeExercises);

        if (safePlans.length > 0) {
          setSelectedPlanId(safePlans[0].id);
        }
      } catch (err) {
        setError(err.message || text.errorFallback);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [text.errorFallback]);

  useEffect(() => {
    async function loadPlanItems() {
      if (!selectedPlanId) {
        setSelectedPlanItems([]);
        return;
      }

      try {
        setItemsLoading(true);
        setError("");

        const data = await fetchPlanItems(selectedPlanId);
        setSelectedPlanItems(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || text.errorFallback);
      } finally {
        setItemsLoading(false);
      }
    }

    loadPlanItems();
  }, [selectedPlanId, text.errorFallback]);

  const selectedPlan = useMemo(() => {
    return plans.find((plan) => plan.id === selectedPlanId) || null;
  }, [plans, selectedPlanId]);

  const activePlanCount = useMemo(() => {
    return plans.filter((plan) => plan.is_active).length;
  }, [plans]);

 function getPatientNameById(patientId) {
  if (!patientId && patientId !== 0) return text.undefinedPatient;

  const found = patients.find(
    (patient) =>
      String(patient.user_id) === String(patientId) ||
      String(patient.id) === String(patientId)
  );

  return (
    found?.display_name ||
    found?.username ||
    `${text.patientFallback} ${patientId}`
  );
}

  function getExerciseNameById(exerciseId) {
    const found = exercises.find(
      (exercise) => String(exercise.id) === String(exerciseId)
    );

    return found?.name || `${text.exerciseFallback} ${exerciseId}`;
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

      setPlans((prev) => {
        const updatedList = [created, ...prev];

        if (!created.is_active) return updatedList;

        return updatedList.map((plan) => {
          if (plan.id === created.id) return plan;
          if (String(plan.patient) === String(created.patient)) {
            return { ...plan, is_active: false };
          }
          return plan;
        });
      });

      setSelectedPlanId(created.id);

      setPlanForm({
        patient: "",
        title: "",
        is_active: true,
      });

      setSuccess(text.createSuccess);
    } catch (err) {
      setError(err.message || text.createError);
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

      setSuccess(text.updateSuccess);
    } catch (err) {
      setError(err.message || text.updateError);
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

      setSuccess(text.addSuccess);
    } catch (err) {
      setError(err.message || text.addError);
    }
  }

  async function handleDeleteItem(itemId) {
    setError("");
    setSuccess("");

    try {
      await deletePlanItem(itemId);
      setSelectedPlanItems((prev) => prev.filter((item) => item.id !== itemId));
      setSuccess(text.removeSuccess);
    } catch (err) {
      setError(err.message || text.removeError);
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

        <main className="theraPlanPrimePage">
          <section className="theraPlanPrimeHeader">
            <div>
              <h1>{text.title}</h1>
              <p>{text.subtitle}</p>
            </div>

            <div className="theraPlanPrimeHeaderCard">
              <span>{text.activePlans}</span>
              <strong>{activePlanCount}</strong>
            </div>
          </section>

          <TherapistSubnav />

          {loading && (
            <div className="theraPlanPrimeState">
              <h3>{text.loadingTitle}</h3>
              <p>{text.loadingText}</p>
            </div>
          )}

          {!loading && error && (
            <div className="theraPlanPrimeError">{error}</div>
          )}

          {!loading && success && (
            <div className="theraPlanPrimeSuccess">{success}</div>
          )}

          {!loading && (
            <>
              <section className="theraPlanPrimeTopGrid">
                <form
                  className="theraPlanPrimeCard theraPlanPrimeCreate"
                  onSubmit={handleCreatePlan}
                >
                  <div className="theraPlanPrimeCardHeader">
                    <div>
                      <h2>{text.createPlan}</h2>
                      <p>{text.createPlanText}</p>
                    </div>
                  </div>

                  <div className="theraPlanPrimeFormGrid">
                    <div className="theraPlanPrimeField">
                      <label>{text.patient}</label>
                      <select
                        name="patient"
                        value={planForm.patient}
                        onChange={handlePlanFormChange}
                        required
                      >
                        <option value="">{text.selectPatient}</option>
                        {patients.map((patient) => (
                          <option key={patient.user_id} value={patient.user_id}>
                            {patient.display_name || patient.username}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="theraPlanPrimeField">
                      <label>{text.planTitle}</label>
                      <input
                        name="title"
                        value={planForm.title}
                        onChange={handlePlanFormChange}
                        placeholder={text.planPlaceholder}
                        required
                      />
                    </div>

                    <label className="theraPlanPrimeCheckbox">
                      <input
                        type="checkbox"
                        name="is_active"
                        checked={planForm.is_active}
                        onChange={handlePlanFormChange}
                      />
                      <span>{text.setActive}</span>
                    </label>
                  </div>

                  <button type="submit" className="theraPlanPrimePrimaryBtn">
                    {text.createPlanButton}
                  </button>
                </form>

                <aside className="theraPlanPrimeCard theraPlanPrimeSummary">
                  <div className="theraPlanPrimeCardHeader">
                    <div>
                      <h2>{text.summary}</h2>
                    </div>
                  </div>

                  <div className="theraPlanPrimeSummaryGrid">
                    <div>
                      <span>{text.availablePatients}</span>
                      <strong>{patients.length}</strong>
                    </div>

                    <div>
                      <span>{text.existingPlans}</span>
                      <strong>{plans.length}</strong>
                    </div>

                    <div>
                      <span>{text.availableExercises}</span>
                      <strong>{exercises.length}</strong>
                    </div>

                    <div>
                      <span>{text.activePlans}</span>
                      <strong>{activePlanCount}</strong>
                    </div>
                  </div>
                </aside>
              </section>

              <section className="theraPlanPrimeWorkspace">
                <aside className="theraPlanPrimeCard theraPlanPrimePlans">
                  <div className="theraPlanPrimeCardHeader">
                    <div>
                      <h2>{text.createdPlans}</h2>
                      <p>{text.createdPlansText}</p>
                    </div>
                  </div>

                  <div className="theraPlanPrimePlanList">
                    {plans.length === 0 ? (
                      <div className="theraPlanPrimeEmpty">{text.noPlans}</div>
                    ) : (
                      plans.map((plan) => {
                        const translatedTitle = translateBackendText(
                          plan.title,
                          language,
                          text.planFallback
                        );

                        return (
                          <button
                            key={plan.id}
                            type="button"
                            className={`theraPlanPrimePlanItem ${
                              selectedPlanId === plan.id ? "isSelected" : ""
                            }`}
                            onClick={() => setSelectedPlanId(plan.id)}
                          >
                            <div className="theraPlanPrimePlanTop">
                              <div>
                                <h3>{translatedTitle}</h3>
                                <p>{getPatientNameById(plan.patient)}</p>
                              </div>

                              <span
                                className={`theraPlanPrimeStatus ${
                                  plan.is_active ? "isActive" : ""
                                }`}
                              >
                                {plan.is_active ? text.active : text.inactive}
                              </span>
                            </div>

                            <div className="theraPlanPrimePlanActions">
                              
                              <span
                                role="button"
                                tabIndex={0}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleToggleActive(plan);
                                }}
                                onKeyDown={(event) => {
                                  if (event.key === "Enter") {
                                    event.stopPropagation();
                                    handleToggleActive(plan);
                                  }
                                }}
                              >
                                {plan.is_active ? text.deactivate : text.activate}
                              </span>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </aside>

                <section className="theraPlanPrimeRightColumn">
                  <div className="theraPlanPrimeCard">
                    <div className="theraPlanPrimeCardHeader">
                      <div>
                        <h2>
                          {selectedPlan ? text.planDetail : text.selectPlan}
                        </h2>
                      </div>
                    </div>

                    {selectedPlan ? (
                      <div className="theraPlanPrimeDetailGrid">
                        <div>
                          <span>{text.planTitle}</span>
                          <strong>
                            {translateBackendText(
                              selectedPlan.title,
                              language,
                              text.planFallback
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>{text.patient}</span>
                          <strong>
                            {getPatientNameById(selectedPlan.patient)}
                          </strong>
                        </div>

                        <div>
                          <span>{text.planState}</span>
                          <strong>
                            {selectedPlan.is_active
                              ? text.active
                              : text.inactive}
                          </strong>
                        </div>

                        <div>
                          <span>{text.planItems}</span>
                          <strong>{selectedPlanItems.length}</strong>
                        </div>
                      </div>
                    ) : (
                      <div className="theraPlanPrimeEmpty">
                        {text.selectPlanText}
                      </div>
                    )}
                  </div>

                  {selectedPlan && (
                    <form
                      className="theraPlanPrimeCard"
                      onSubmit={handleAddPlanItem}
                    >
                      <div className="theraPlanPrimeCardHeader">
                        <div>
                          <h2>{text.addExercise}</h2>
                          <p>{text.addExerciseText}</p>
                        </div>
                      </div>

                      <div className="theraPlanPrimeFormGrid isCompact">
                        <div className="theraPlanPrimeField isWide">
                          <label>{text.exercise}</label>
                          <select
                            name="exercise"
                            value={itemForm.exercise}
                            onChange={handleItemFormChange}
                            required
                          >
                            <option value="">{text.selectExercise}</option>
                            {exercises.map((exercise) => (
                              <option key={exercise.id} value={exercise.id}>
                                {translateBackendText(
                                  exercise.name,
                                  language,
                                  exercise.name
                                )}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="theraPlanPrimeField">
                          <label>
                            {text.duration} ({text.minutesShort})
                          </label>
                          <input
                            type="number"
                            name="duration_minutes"
                            min="1"
                            value={itemForm.duration_minutes}
                            onChange={handleItemFormChange}
                            required
                          />
                        </div>

                        <div className="theraPlanPrimeField">
                          <label>{text.sets}</label>
                          <input
                            type="number"
                            name="sets"
                            min="1"
                            value={itemForm.sets}
                            onChange={handleItemFormChange}
                            required
                          />
                        </div>

                        <div className="theraPlanPrimeField">
                          <label>{text.reps}</label>
                          <input
                            type="number"
                            name="reps"
                            min="1"
                            value={itemForm.reps}
                            onChange={handleItemFormChange}
                            required
                          />
                        </div>

                        <div className="theraPlanPrimeField">
                          <label>{text.frequency}</label>
                          <input
                            type="number"
                            name="frequency_per_week"
                            min="1"
                            value={itemForm.frequency_per_week}
                            onChange={handleItemFormChange}
                            required
                          />
                        </div>
                      </div>

                      <button type="submit" className="theraPlanPrimePrimaryBtn">
                        {text.addToPlan}
                      </button>
                    </form>
                  )}

                  <div className="theraPlanPrimeCard">
                    <div className="theraPlanPrimeCardHeader">
                      <div>
                        <h2>{text.planExercises}</h2>
                      </div>
                    </div>

                    {itemsLoading ? (
                      <div className="theraPlanPrimeEmpty">
                        {text.loadingItems}
                      </div>
                    ) : selectedPlanItems.length === 0 ? (
                      <div className="theraPlanPrimeEmpty">{text.noItems}</div>
                    ) : (
                      <div className="theraPlanPrimeItemList">
                        {selectedPlanItems.map((item) => {
                          const itemName = translateBackendText(
                            item.exercise_name ||
                              getExerciseNameById(item.exercise),
                            language,
                            text.exerciseFallback
                          );

                          return (
                            <div
                              key={item.id}
                              className="theraPlanPrimeExerciseItem"
                            >
                              <div>
                                <h3>{itemName}</h3>
                                <p>
                                  {item.duration_minutes} {text.minutesShort} ·{" "}
                                  {item.sets} {text.sets.toLowerCase()} ·{" "}
                                  {item.reps} {text.reps.toLowerCase()} ·{" "}
                                  {item.frequency_per_week}x/
                                  {language === "en" ? "week" : "semana"}
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleDeleteItem(item.id)}
                              >
                                {text.remove}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="theraPlanPrimeClinicalNote">
                    <span>{text.rightPanelTitle}</span>
                    <p>{text.rightPanelText}</p>
                  </div>
                </section>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}