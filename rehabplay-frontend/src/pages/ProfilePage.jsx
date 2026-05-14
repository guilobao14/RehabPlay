import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { fetchMyProfile, updateMyProfile } from "../api/auth";
import { fetchFamilyLinks, respondFamilyLink } from "../api/family";
import { useAppPreferences } from "../context/AppPreferencesContext.jsx";

const profileText = {
  "pt-PT": {
    hello: "Olá",
    userFallback: "Utilizador",
    error: "Erro",

    patient: "Paciente",
    therapist: "Terapeuta",
    family: "Familiar",

    patientDescription:
      "Conta orientada para acompanhamento do plano, progresso e comunicação com o terapeuta.",
    therapistDescription:
      "Conta orientada para gestão de pacientes, planos, exercícios e acompanhamento clínico.",
    familyDescription:
      "Conta orientada para acompanhamento familiar com permissões limitadas.",
    defaultDescription: "Conta da plataforma RehabPlay.",

    loadError: "Erro ao carregar perfil.",
    updateError: "Erro ao atualizar perfil.",
    success: "Perfil atualizado com sucesso.",

    loadingTitle: "A carregar perfil...",
    loadingText: "A obter os dados reais da tua conta.",

    eyebrow: "Perfil da conta",
    subtitle:
      "Gere os teus dados principais, mantém o perfil atualizado e personaliza a forma como és identificado na plataforma.",

    closeEdit: "Fechar edição",
    editProfile: "Editar perfil",
    settings: "Definições",

    profilePhotoAlt: "Foto de perfil",
    completeness: "Perfil preenchido",

    editTitle: "Editar perfil",
    editText: "Atualiza os dados visíveis na tua conta.",
    displayName: "Nome apresentado",
    phone: "Telefone",
    profilePhoto: "Foto de perfil",
    cancel: "Cancelar",
    saving: "A guardar...",
    saveChanges: "Guardar alterações",

    personalInfo: "Informação pessoal",
    mainData: "Dados principais",
    role: "Função",

    accountStatus: "Estado da conta",
    summary: "Resumo",
    activeProfile: "Perfil ativo",
    uploadedPhoto: "Foto carregada",
    availability: "Disponibilidade",
    accessType: "Tipo de acesso",
    yes: "Sim",
    no: "Não",
    active: "Ativa",

    familyRequests: "Pedidos familiares",
    familyRequestsSub:
      "Pedidos de familiares que querem acompanhar o teu progresso.",
    noFamilyRequests: "Sem pedidos familiares pendentes.",
    requestFrom: "Pedido de",
    approve: "Aceitar",
    reject: "Rejeitar",
    approvedRequest: "Pedido familiar aceite.",
    rejectedRequest: "Pedido familiar rejeitado.",
    pending: "Pendente",

    presentation: "Apresentação",
    context: "Contexto",
    miniNote:
      "Estes dados são usados para identificação, comunicação e personalização da experiência dentro da RehabPlay.",

    quickActions: "Ações rápidas",
    shortcuts: "Atalhos",
    goSettings: "Ir para definições",
    backDashboard: "Voltar ao dashboard",
    updateInfo: "Atualizar informação",

    noData: "Sem dados",
    noDataText: "Não foi possível encontrar informações de perfil.",
  },

  en: {
    hello: "Hi",
    userFallback: "User",
    error: "Error",

    patient: "Patient",
    therapist: "Therapist",
    family: "Family member",

    patientDescription:
      "Account focused on following the plan, progress and communication with the therapist.",
    therapistDescription:
      "Account focused on managing patients, plans, exercises and clinical follow-up.",
    familyDescription:
      "Account focused on family monitoring with limited permissions.",
    defaultDescription: "RehabPlay platform account.",

    loadError: "Error loading profile.",
    updateError: "Error updating profile.",
    success: "Profile updated successfully.",

    loadingTitle: "Loading profile...",
    loadingText: "Fetching your real account data.",

    eyebrow: "Account profile",
    subtitle:
      "Manage your main details, keep your profile updated and personalize how you are identified on the platform.",

    closeEdit: "Close editing",
    editProfile: "Edit profile",
    settings: "Settings",

    profilePhotoAlt: "Profile photo",
    completeness: "Profile completion",

    editTitle: "Edit profile",
    editText: "Update the visible details in your account.",
    displayName: "Display name",
    phone: "Phone",
    profilePhoto: "Profile photo",
    cancel: "Cancel",
    saving: "Saving...",
    saveChanges: "Save changes",

    personalInfo: "Personal information",
    mainData: "Main details",
    role: "Role",

    accountStatus: "Account status",
    summary: "Summary",
    activeProfile: "Active profile",
    uploadedPhoto: "Uploaded photo",
    availability: "Availability",
    accessType: "Access type",
    yes: "Yes",
    no: "No",
    active: "Active",

    familyRequests: "Family requests",
    familyRequestsSub:
      "Requests from family members who want to follow your progress.",
    noFamilyRequests: "No pending family requests.",
    requestFrom: "Request from",
    approve: "Approve",
    reject: "Reject",
    approvedRequest: "Family request approved.",
    rejectedRequest: "Family request rejected.",
    pending: "Pending",

    presentation: "Overview",
    context: "Context",
    miniNote:
      "These details are used for identification, communication and personalization of the experience inside RehabPlay.",

    quickActions: "Quick actions",
    shortcuts: "Shortcuts",
    goSettings: "Go to settings",
    backDashboard: "Back to dashboard",
    updateInfo: "Update information",

    noData: "No data",
    noDataText: "No profile information could be found.",
  },
};

function formatRole(role, text) {
  if (role === "PATIENT") return text.patient;
  if (role === "THERAPIST") return text.therapist;
  if (role === "FAMILY") return text.family;
  return role || "-";
}

function getInitials(name) {
  if (!name) return "U";
  const parts = String(name).trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() || "").join("") || "U";
}

function getRoleDescription(role, text) {
  if (role === "PATIENT") return text.patientDescription;
  if (role === "THERAPIST") return text.therapistDescription;
  if (role === "FAMILY") return text.familyDescription;
  return text.defaultDescription;
}

function getHomePathByRole(role) {
  if (role === "THERAPIST") return "/therapist/plans";
  if (role === "FAMILY") return "/family";
  return "/dashboard";
}

function getProfileCompleteness(profile) {
  const fields = [
    profile?.display_name,
    profile?.phone,
    profile?.photo_url,
    profile?.role,
  ];

  const completed = fields.filter(Boolean).length;
  return Math.round((completed / fields.length) * 100);
}

function getFamilyRequestName(request) {
  return (
    request.family_display_name ||
    request.family_username ||
    request.family ||
    "-"
  );
}

export default function ProfilePage() {
  const pageTopRef = useRef(null);
  const { language } = useAppPreferences();
  const text = profileText[language] || profileText["pt-PT"];

  const [profile, setProfile] = useState(null);
  const [familyRequests, setFamilyRequests] = useState([]);

  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState(null);
  const [error, setError] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const [form, setForm] = useState({
    display_name: "",
    phone: "",
    photo: null,
  });

  function goToPageTop() {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function handleUpdateInfo() {
    setIsEditing(true);
    setSaveMessage("");

    setTimeout(() => {
      const editCard = document.querySelector(".profileProEditCard");

      if (editCard) {
        editCard.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 80);
  }

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await fetchMyProfile();

        setProfile(data);
        setForm({
          display_name: data?.display_name || "",
          phone: data?.phone || "",
          photo: null,
        });

        if (data?.role === "PATIENT") {
          const linksData = await fetchFamilyLinks().catch(() => []);
          const safeLinks = Array.isArray(linksData) ? linksData : [];

          setFamilyRequests(
            safeLinks.filter(
              (item) => String(item.status || "").toUpperCase() === "PENDING"
            )
          );
        }
      } catch (err) {
        setError(err.message || text.loadError);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [text.loadError]);

  const displayName = profile?.display_name || text.userFallback;
  const firstName = String(displayName).split(" ")[0] || text.userFallback;
  const homePath = getHomePathByRole(profile?.role);

  const initials = useMemo(() => getInitials(displayName), [displayName]);

  const completeness = useMemo(() => {
    if (!profile) return 0;
    return getProfileCompleteness(profile);
  }, [profile]);

  function handleChange(event) {
    const { name, value, files } = event.target;

    if (name === "photo") {
      setForm((prev) => ({
        ...prev,
        photo: files?.[0] || null,
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSave(event) {
    event.preventDefault();

    setSaving(true);
    setSaveMessage("");
    setError("");

    try {
      let payload;

      if (form.photo) {
        payload = new FormData();
        payload.append("display_name", form.display_name);
        payload.append("phone", form.phone);
        payload.append("photo", form.photo);
      } else {
        payload = {
          display_name: form.display_name,
          phone: form.phone,
        };
      }

      const updated = await updateMyProfile(payload);

      setProfile(updated);
      setForm({
        display_name: updated?.display_name || "",
        phone: updated?.phone || "",
        photo: null,
      });

      setIsEditing(false);
      setSaveMessage(text.success);
    } catch (err) {
      setError(err.message || text.updateError);
    } finally {
      setSaving(false);
    }
  }

  async function handleRespondFamilyRequest(linkId, action) {
    try {
      setRespondingId(linkId);
      setError("");
      setSaveMessage("");

      await respondFamilyLink(linkId, action);

      setFamilyRequests((prev) => prev.filter((item) => item.id !== linkId));

      setSaveMessage(
        action === "APPROVE" ? text.approvedRequest : text.rejectedRequest
      );
    } catch (err) {
      setError(err.message || text.updateError);
    } finally {
      setRespondingId(null);
    }
  }

  return (
    <div className="appPage">
      <div className="appShellMockup">
        <div className="topbar">
          <Link to={homePath} className="brandLink" onClick={goToPageTop}>
            RehabPlay
          </Link>

          <div className="userArea">
            {text.hello}, {firstName}
          </div>
        </div>

        <div className="content profileProPage" ref={pageTopRef}>
          {loading && (
            <div className="profileProStateCard">
              <h3>{text.loadingTitle}</h3>
              <p>{text.loadingText}</p>
            </div>
          )}

          {error && !loading && (
            <div className="profileProError">
              <strong>{text.error}</strong>
              <span>{error}</span>
            </div>
          )}

          {!loading && !error && profile && (
            <>
              {saveMessage && (
                <div className="profileProSuccess">{saveMessage}</div>
              )}

              <section className="profileProHero">
                <div className="profileProHeroMain">
                  <div className="profileProEyebrow">{text.eyebrow}</div>

                  <h1 className="profileProTitle">{displayName}</h1>

                  <p className="profileProSubtitle">{text.subtitle}</p>

                  <div className="profileProHeroActions">
                    <button
                      type="button"
                      className="profileProPrimaryBtn"
                      onClick={() => {
                        setIsEditing((prev) => !prev);
                        setSaveMessage("");
                        goToPageTop();
                      }}
                    >
                      {isEditing ? text.closeEdit : text.editProfile}
                    </button>

                    <Link
                      to="/settings"
                      className="profileProGhostBtn"
                      onClick={goToPageTop}
                    >
                      {text.settings}
                    </Link>
                  </div>
                </div>

                <div className="profileProIdentityCard">
                  <div className="profileProAvatarFrame">
                    {profile.photo_url ? (
                      <img
                        src={profile.photo_url}
                        alt={text.profilePhotoAlt}
                        className="profileProAvatarImage"
                      />
                    ) : (
                      <div className="profileProAvatarFallback">{initials}</div>
                    )}
                  </div>

                  <div className="profileProIdentityName">{displayName}</div>

                  <div className="profileProRolePill">
                    {formatRole(profile.role, text)}
                  </div>

                  <div className="profileProCompleteness">
                    <div className="profileProCompletenessTop">
                      <span>{text.completeness}</span>
                      <strong>{completeness}%</strong>
                    </div>

                    <div className="profileProProgressTrack">
                      <div
                        className="profileProProgressFill"
                        style={{ width: `${completeness}%` }}
                      />
                    </div>
                  </div>
                </div>
              </section>

              {isEditing && (
                <form className="profileProEditCard" onSubmit={handleSave}>
                  <div className="profileProEditHeader">
                    <div>
                      <h2>{text.editTitle}</h2>
                      <p>{text.editText}</p>
                    </div>
                  </div>

                  <div className="profileProFormGrid">
                    <div className="profileProField">
                      <label>{text.displayName}</label>
                      <input
                        name="display_name"
                        value={form.display_name}
                        onChange={handleChange}
                        placeholder={text.displayName}
                      />
                    </div>

                    <div className="profileProField">
                      <label>{text.phone}</label>
                      <input
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        placeholder={text.phone}
                      />
                    </div>

                    <div className="profileProField profileProFieldWide">
                      <label>{text.profilePhoto}</label>
                      <input
                        type="file"
                        name="photo"
                        accept="image/*"
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="profileProEditActions">
                    <button
                      type="button"
                      className="profileProGhostBtn"
                      onClick={() => {
                        setIsEditing(false);
                        goToPageTop();
                      }}
                    >
                      {text.cancel}
                    </button>

                    <button
                      type="submit"
                      className="profileProPrimaryBtn"
                      disabled={saving}
                    >
                      {saving ? text.saving : text.saveChanges}
                    </button>
                  </div>
                </form>
              )}

              <section className="profileProGrid">
                <div className="profileProCard">
                  <div className="profileProCardHeader">
                    <h2>{text.personalInfo}</h2>
                    <span>{text.mainData}</span>
                  </div>

                  <div className="profileProInfoList">
                    <div className="profileProInfoItem">
                      <span>{text.displayName}</span>
                      <strong>{profile.display_name || "-"}</strong>
                    </div>

                    <div className="profileProInfoItem">
                      <span>{text.phone}</span>
                      <strong>{profile.phone || "-"}</strong>
                    </div>

                    <div className="profileProInfoItem">
                      <span>{text.role}</span>
                      <strong>{formatRole(profile.role, text)}</strong>
                    </div>
                  </div>
                </div>

                <div className="profileProCard">
                  <div className="profileProCardHeader">
                    <h2>{text.accountStatus}</h2>
                    <span>{text.summary}</span>
                  </div>

                  <div className="profileProStatusGrid">
                    <div className="profileProStatusBox">
                      <span>{text.activeProfile}</span>
                      <strong>{text.yes}</strong>
                    </div>

                    <div className="profileProStatusBox">
                      <span>{text.uploadedPhoto}</span>
                      <strong>{profile.photo_url ? text.yes : text.no}</strong>
                    </div>

                    <div className="profileProStatusBox">
                      <span>{text.availability}</span>
                      <strong>{text.active}</strong>
                    </div>

                    <div className="profileProStatusBox">
                      <span>{text.accessType}</span>
                      <strong>{formatRole(profile.role, text)}</strong>
                    </div>
                  </div>
                </div>
              </section>

              {profile.role === "PATIENT" && (
                <section className="profileProCard profileFamilyRequestsCard">
                  <div className="profileProCardHeader">
                    <div>
                      <h2>{text.familyRequests}</h2>
                      <p className="profileFamilyRequestsSub">
                        {text.familyRequestsSub}
                      </p>
                    </div>

                    <span className="profileProSoftBadge">{text.pending}</span>
                  </div>

                  {familyRequests.length === 0 ? (
                    <div className="profileFamilyEmpty">
                      <div className="profileFamilyEmptyIcon">✓</div>
                      <div>
                        <strong>{text.noFamilyRequests}</strong>
                        <p>{text.miniNote}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="profileFamilyRequestList">
                      {familyRequests.map((request) => (
                        <div
                          key={request.id}
                          className="profileFamilyRequestItem"
                        >
                          <div className="profileFamilyRequestInfo">
                            <span>{text.requestFrom}</span>
                            <strong>{getFamilyRequestName(request)}</strong>
                          </div>

                          <div className="profileFamilyRequestActions">
                            <button
                              type="button"
                              className="profileProPrimaryBtn"
                              disabled={respondingId === request.id}
                              onClick={() =>
                                handleRespondFamilyRequest(
                                  request.id,
                                  "APPROVE"
                                )
                              }
                            >
                              {text.approve}
                            </button>

                            <button
                              type="button"
                              className="profileProGhostBtn"
                              disabled={respondingId === request.id}
                              onClick={() =>
                                handleRespondFamilyRequest(
                                  request.id,
                                  "REJECT"
                                )
                              }
                            >
                              {text.reject}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}

              <section className="profileProBottomGrid">
                <div className="profileProCard profileProAboutCard">
                  <div className="profileProCardHeader">
                    <h2>{text.presentation}</h2>
                    <span>{text.context}</span>
                  </div>

                  <p>{getRoleDescription(profile.role, text)}</p>

                  <div className="profileProMiniNote">{text.miniNote}</div>
                </div>

                <div className="profileProCard">
                  <div className="profileProCardHeader">
                    <h2>{text.quickActions}</h2>
                    <span>{text.shortcuts}</span>
                  </div>

                  <div className="profileProActionList">
                    <Link
                      to="/settings"
                      className="profileProActionLink"
                      onClick={goToPageTop}
                    >
                      <span className="profileProActionIcon">⚙</span>
                      <span>{text.goSettings}</span>
                      <strong>›</strong>
                    </Link>

                    <Link
                      to={homePath}
                      className="profileProActionLink"
                      onClick={goToPageTop}
                    >
                      <span className="profileProActionIcon">▦</span>
                      <span>{text.backDashboard}</span>
                      <strong>›</strong>
                    </Link>

                    <button
                      type="button"
                      className="profileProActionButton"
                      onClick={handleUpdateInfo}
                    >
                      <span className="profileProActionIcon">✎</span>
                      <span>{text.updateInfo}</span>
                      <strong>›</strong>
                    </button>
                  </div>
                </div>
              </section>
            </>
          )}

          {!loading && !error && !profile && (
            <div className="profileProStateCard">
              <h3>{text.noData}</h3>
              <p>{text.noDataText}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}