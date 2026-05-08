import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchFamilyLinks,
  createFamilyLink,
  deleteFamilyLink,
} from "../../api/family";
import { useAppPreferences } from "../../context/AppPreferencesContext.jsx";

const familyLinksText = {
  "pt-PT": {
    hello: "Olá",
    familyUser: "Familiar",
    title: "Ligações Familiares",
    subtitle:
      "Envia pedidos de ligação a pacientes e consulta apenas progresso autorizado.",
    loadingTitle: "A carregar...",
    loadingText: "A obter ligações familiares disponíveis.",
    errorText: "Erro ao carregar ligações familiares.",

    activeLinks: "Ligações aprovadas",
    activeLinksText: "Pacientes com acompanhamento autorizado.",
    pendingLinks: "Pedidos pendentes",
    pendingLinksText: "Pedidos enviados a aguardar aprovação do paciente.",
    privateMessages: "Mensagens privadas",
    privateMessagesText:
      "Contas familiares não têm acesso às conversas entre paciente e terapeuta.",

    addTitle: "Pedir ligação a paciente",
    addText:
      "Introduz o username do paciente. O acesso ao progresso só fica disponível depois de o paciente aprovar o pedido.",
    patientUsername: "Username do paciente",
    patientPlaceholder: "Ex: paciente1",
    createLink: "Enviar pedido",
    creating: "A enviar...",
    createSuccess: "Pedido de ligação enviado com sucesso.",
    deleteSuccess: "Ligação removida com sucesso.",
    deleteLink: "Remover",
    confirmDelete: "Queres mesmo remover esta ligação?",

    linksList: "Lista de pedidos e ligações",
    linksSub:
      "Consulta o estado das ligações familiares associadas ao teu perfil.",
    noLinks: "Sem ligações",
    noLinksText: "Ainda não tens pedidos ou ligações familiares.",

    patient: "Paciente",
    familyMember: "Familiar",
    viewProgress: "Ver progresso",
    viewMessages: "Ver mensagens",
    notAllowed: "Não permitido",
    createdAt: "Data de criação",
    status: "Estado",
    pending: "Pendente",
    approved: "Aprovado",
    rejected: "Rejeitado",
    yes: "Sim",
    no: "Não",
    link: "Ligação",

    privacyTitle: "Privacidade e confidencialidade",
    privacySubtitle: "Acesso apenas após aprovação",
    privacyText:
      "O familiar só pode consultar o progresso depois de o paciente aprovar a ligação. As conversas clínicas permanecem sempre privadas.",

    quickActions: "Ações rápidas",
    backDashboard: "Voltar ao dashboard",
    consultProgress: "Consultar progresso",
  },

  en: {
    hello: "Hi",
    familyUser: "Family",
    title: "Family Links",
    subtitle:
      "Send patient link requests and view authorized progress only.",
    loadingTitle: "Loading...",
    loadingText: "Fetching available family links.",
    errorText: "Error loading family links.",

    activeLinks: "Approved links",
    activeLinksText: "Patients with authorized monitoring.",
    pendingLinks: "Pending requests",
    pendingLinksText: "Requests sent and waiting for patient approval.",
    privateMessages: "Private messages",
    privateMessagesText:
      "Family accounts cannot access conversations between patient and therapist.",

    addTitle: "Request patient link",
    addText:
      "Enter the patient username. Progress access only becomes available after the patient approves the request.",
    patientUsername: "Patient username",
    patientPlaceholder: "Example: patient1",
    createLink: "Send request",
    creating: "Sending...",
    createSuccess: "Link request sent successfully.",
    deleteSuccess: "Link removed successfully.",
    deleteLink: "Remove",
    confirmDelete: "Do you really want to remove this link?",

    linksList: "Requests and links list",
    linksSub:
      "Check the status of family links associated with your profile.",
    noLinks: "No links",
    noLinksText: "You do not currently have any requests or family links.",

    patient: "Patient",
    familyMember: "Family member",
    viewProgress: "View progress",
    viewMessages: "View messages",
    notAllowed: "Not allowed",
    createdAt: "Created at",
    status: "Status",
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    yes: "Yes",
    no: "No",
    link: "Link",

    privacyTitle: "Privacy and confidentiality",
    privacySubtitle: "Access only after approval",
    privacyText:
      "Family members can only view progress after the patient approves the link. Clinical conversations always remain private.",

    quickActions: "Quick actions",
    backDashboard: "Back to dashboard",
    consultProgress: "Check progress",
  },
};

function formatDate(value, language) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString(language === "en" ? "en-GB" : "pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getStatusLabel(status, text) {
  const value = String(status || "PENDING").toUpperCase();

  if (value === "APPROVED") return text.approved;
  if (value === "REJECTED") return text.rejected;
  return text.pending;
}

function normalizeLink(raw, text) {
  return {
    id: raw.id,
    patientId: raw.patient ?? raw.patient_id ?? raw.patient_user_id ?? null,
    familyId: raw.family ?? raw.family_id ?? raw.family_user_id ?? null,
    patientName:
      raw.patient_display_name ||
      raw.patient_name ||
      raw.patient_username ||
      `${text.patient} ${raw.patient ?? raw.patient_id ?? ""}`,
    familyName:
      raw.family_display_name ||
      raw.family_name ||
      raw.family_username ||
      text.familyMember,
    status: raw.status || "PENDING",
    canViewProgress:
      raw.can_view_progress === true || raw.can_view_progress === false
        ? raw.can_view_progress
        : false,
    createdAt: raw.created_at || raw.created || null,
  };
}

export default function FamilyLinksPage() {
  const { language } = useAppPreferences();
  const text = familyLinksText[language] || familyLinksText["pt-PT"];

  const [links, setLinks] = useState([]);
  const [patientUsername, setPatientUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadLinks() {
    try {
      setError("");

      const data = await fetchFamilyLinks();
      const safeLinks = Array.isArray(data)
        ? data.map((item) => normalizeLink(item, text))
        : [];

      setLinks(safeLinks);
    } catch (err) {
      setError(err.message || text.errorText);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLinks();
  }, [text]);

  const approvedLinks = useMemo(() => {
    return links.filter((item) => String(item.status).toUpperCase() === "APPROVED");
  }, [links]);

  const pendingLinks = useMemo(() => {
    return links.filter((item) => String(item.status).toUpperCase() === "PENDING");
  }, [links]);

  async function handleCreateLink(event) {
    event.preventDefault();

    if (!patientUsername.trim()) return;

    try {
      setCreating(true);
      setError("");
      setSuccess("");

      const created = await createFamilyLink({
        patient_username: patientUsername.trim(),
      });

      setLinks((prev) => [normalizeLink(created, text), ...prev]);
      setPatientUsername("");
      setSuccess(text.createSuccess);
    } catch (err) {
      setError(err.message || text.errorText);
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteLink(linkId) {
    const ok = window.confirm(text.confirmDelete);
    if (!ok) return;

    try {
      setRemovingId(linkId);
      setError("");
      setSuccess("");

      await deleteFamilyLink(linkId);

      setLinks((prev) => prev.filter((item) => item.id !== linkId));
      setSuccess(text.deleteSuccess);
    } catch (err) {
      setError(err.message || text.errorText);
    } finally {
      setRemovingId(null);
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
            {text.hello}, {text.familyUser}
          </div>
        </div>

        <div className="pageHeader">
          <h1 className="pageTitle">{text.title}</h1>
          <div className="pageSubtitle">{text.subtitle}</div>
        </div>

        <div className="content">
          {loading && (
            <div className="familyCard">
              <h3 className="familyCardTitle">{text.loadingTitle}</h3>
              <p className="familyNoteText">{text.loadingText}</p>
            </div>
          )}

          {error && !loading && <div className="theraNoticeError">{error}</div>}
          {success && !loading && <div className="theraNoticeOk">{success}</div>}

          {!loading && (
            <>
              <div className="familyHeroGrid">
                <div className="familyHeroCard">
                  <div className="familyHeroLabel">{text.activeLinks}</div>
                  <div className="familyHeroValue">{approvedLinks.length}</div>
                  <div className="familyHeroText">{text.activeLinksText}</div>
                </div>

                <div className="familyHeroCard">
                  <div className="familyHeroLabel">{text.pendingLinks}</div>
                  <div className="familyHeroValue">{pendingLinks.length}</div>
                  <div className="familyHeroText">{text.pendingLinksText}</div>
                </div>

                <div className="familyHeroCard">
                  <div className="familyHeroLabel">{text.privateMessages}</div>
                  <div className="familyHeroValue">0</div>
                  <div className="familyHeroText">{text.privateMessagesText}</div>
                </div>
              </div>

              <div className="familyLinkCreateGrid">
                <form className="familyCard" onSubmit={handleCreateLink}>
                  <div className="familyCardHeader">
                    <h3 className="familyCardTitle">{text.addTitle}</h3>
                    <span className="familySmallTag">{text.pending}</span>
                  </div>

                  <div className="familyNoteBox">
                    <div className="familyNoteText">{text.addText}</div>
                  </div>

                  <div className="familyCreateField">
                    <label>{text.patientUsername}</label>
                    <input
                      value={patientUsername}
                      onChange={(event) => setPatientUsername(event.target.value)}
                      placeholder={text.patientPlaceholder}
                    />
                  </div>

                  <button
                    type="submit"
                    className="familyGhostLinkBtn"
                    disabled={creating || !patientUsername.trim()}
                  >
                    {creating ? text.creating : text.createLink}
                  </button>
                </form>

                <div className="familyCard">
                  <div className="familyCardHeader">
                    <h3 className="familyCardTitle">{text.privacyTitle}</h3>
                  </div>

                  <div className="familyNoteBox">
                    <div className="familyNoteTitle">{text.privacySubtitle}</div>
                    <div className="familyNoteText">{text.privacyText}</div>
                  </div>
                </div>
              </div>

              <div className="familySectionHeader">
                <h2 className="familySectionTitle">{text.linksList}</h2>
                <p className="familySectionSub">{text.linksSub}</p>
              </div>

              <div className="familyLinksGridReal">
                {links.length === 0 ? (
                  <div className="familyCard">
                    <div className="familyNoteBox">
                      <div className="familyNoteTitle">{text.noLinks}</div>
                      <div className="familyNoteText">{text.noLinksText}</div>
                    </div>
                  </div>
                ) : (
                  links.map((link) => {
                    const status = String(link.status || "PENDING").toUpperCase();
                    const isApproved = status === "APPROVED";

                    return (
                      <div key={link.id} className="familyCard">
                        <div className="familyCardHeader">
                          <h3 className="familyCardTitle">{link.patientName}</h3>
                          <span className={`familySmallTag familyStatus-${status.toLowerCase()}`}>
                            {getStatusLabel(status, text)}
                          </span>
                        </div>

                        <div className="familyInfoList">
                          <div className="familyInfoItem">
                            <span>{text.patient}</span>
                            <strong>{link.patientName}</strong>
                          </div>

                          <div className="familyInfoItem">
                            <span>{text.familyMember}</span>
                            <strong>{link.familyName}</strong>
                          </div>

                          <div className="familyInfoItem">
                            <span>{text.status}</span>
                            <strong>{getStatusLabel(status, text)}</strong>
                          </div>

                          <div className="familyInfoItem">
                            <span>{text.viewProgress}</span>
                            <strong>
                              {isApproved && link.canViewProgress ? text.yes : text.no}
                            </strong>
                          </div>

                          <div className="familyInfoItem">
                            <span>{text.viewMessages}</span>
                            <strong>{text.notAllowed}</strong>
                          </div>

                          <div className="familyInfoItem">
                            <span>{text.createdAt}</span>
                            <strong>{formatDate(link.createdAt, language)}</strong>
                          </div>
                        </div>

                        <div className="familyLinkActions">
                          {isApproved && link.canViewProgress && (
                            <Link
                              to="/family/progress"
                              className="familyGhostLinkBtn"
                            >
                              {text.viewProgress}
                            </Link>
                          )}

                          <button
                            type="button"
                            className="familyDangerLinkBtn"
                            disabled={removingId === link.id}
                            onClick={() => handleDeleteLink(link.id)}
                          >
                            {text.deleteLink}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="familyBottomGrid">
                <div className="familyCard">
                  <div className="familyCardHeader">
                    <h3 className="familyCardTitle">{text.quickActions}</h3>
                  </div>

                  <div className="familyQuickActions">
                    <Link to="/family" className="familyGhostLinkBtn">
                      {text.backDashboard}
                    </Link>

                    <Link to="/family/progress" className="familyGhostLinkBtn">
                      {text.consultProgress}
                    </Link>
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