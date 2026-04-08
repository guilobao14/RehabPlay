import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchFamilyLinks } from "../../api/family";

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function normalizeLink(raw) {
  return {
    id: raw.id,
    patientId: raw.patient ?? raw.patient_id ?? raw.patient_user_id ?? null,
    familyId: raw.family ?? raw.family_id ?? raw.family_user_id ?? null,
    patientName:
      raw.patient_display_name ||
      raw.patient_name ||
      raw.patient_username ||
      `Paciente ${raw.patient ?? raw.patient_id ?? ""}`,
    familyName:
      raw.family_display_name ||
      raw.family_name ||
      raw.family_username ||
      "Familiar",
    canViewProgress:
      raw.can_view_progress === true ||
      raw.can_view_progress === false
        ? raw.can_view_progress
        : false,
    canViewMessages:
      raw.can_view_messages === true ||
      raw.can_view_messages === false
        ? raw.can_view_messages
        : false,
    createdAt: raw.created_at || raw.created || null,
  };
}

export default function FamilyLinksPage() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadLinks() {
      try {
        const data = await fetchFamilyLinks();
        const safeLinks = Array.isArray(data) ? data.map(normalizeLink) : [];
        setLinks(safeLinks);
      } catch (err) {
        setError(err.message || "Erro ao carregar links familiares.");
      } finally {
        setLoading(false);
      }
    }

    loadLinks();
  }, []);

  const linksWithProgress = useMemo(
    () => links.filter((item) => item.canViewProgress).length,
    [links]
  );

  const linksWithMessages = useMemo(
    () => links.filter((item) => item.canViewMessages).length,
    [links]
  );

  return (
    <div className="appPage">
      <div className="appShellMockup">
        <div className="topbar">
          <Link to="/dashboard" className="brandLink">
            RehabPlay
          </Link>
          <div className="userArea">Olá, Familiar</div>
        </div>

        <div className="pageHeader">
          <h1 className="pageTitle">Ligações Familiares</h1>
          <div className="pageSubtitle">
            Consulta as autorizações de acompanhamento associadas à tua conta
          </div>
        </div>

        <div className="content">
          {loading && (
            <div className="familyCard">
              <h3 className="familyCardTitle">A carregar...</h3>
              <p className="familyNoteText">
                A obter ligações familiares disponíveis.
              </p>
            </div>
          )}

          {error && !loading && <div className="theraNoticeError">{error}</div>}

          {!loading && !error && (
            <>
              <div className="familyHeroGrid">
                <div className="familyHeroCard">
                  <div className="familyHeroLabel">Ligações ativas</div>
                  <div className="familyHeroValue">{links.length}</div>
                  <div className="familyHeroText">
                    Total de pacientes ligados à tua conta familiar.
                  </div>
                </div>

                <div className="familyHeroCard">
                  <div className="familyHeroLabel">Acesso a progresso</div>
                  <div className="familyHeroValue">{linksWithProgress}</div>
                  <div className="familyHeroText">
                    Ligações com permissão para consultar evolução clínica.
                  </div>
                </div>

                <div className="familyHeroCard">
                  <div className="familyHeroLabel">Acesso a mensagens</div>
                  <div className="familyHeroValue">{linksWithMessages}</div>
                  <div className="familyHeroText">
                    Ligações com permissão para consultar threads do paciente.
                  </div>
                </div>
              </div>

              <div className="familySectionHeader">
                <h2 className="familySectionTitle">Lista de ligações</h2>
                <p className="familySectionSub">
                  Informação das autorizações atualmente associadas ao teu perfil
                </p>
              </div>

              <div className="familyLinksGridReal">
                {links.length === 0 ? (
                  <div className="familyCard">
                    <div className="familyNoteBox">
                      <div className="familyNoteTitle">Sem ligações ativas</div>
                      <div className="familyNoteText">
                        Ainda não tens nenhuma ligação familiar autorizada.
                      </div>
                    </div>
                  </div>
                ) : (
                  links.map((link) => (
                    <div key={link.id} className="familyCard">
                      <div className="familyCardHeader">
                        <h3 className="familyCardTitle">{link.patientName}</h3>
                        <span className="familySmallTag">
                          Link #{link.id}
                        </span>
                      </div>

                      <div className="familyInfoList">
                        <div className="familyInfoItem">
                          <span>Paciente</span>
                          <strong>{link.patientName}</strong>
                        </div>

                        <div className="familyInfoItem">
                          <span>Familiar</span>
                          <strong>{link.familyName}</strong>
                        </div>

                        <div className="familyInfoItem">
                          <span>Ver progresso</span>
                          <strong>{link.canViewProgress ? "Sim" : "Não"}</strong>
                        </div>

                        <div className="familyInfoItem">
                          <span>Ver mensagens</span>
                          <strong>{link.canViewMessages ? "Sim" : "Não"}</strong>
                        </div>

                        <div className="familyInfoItem">
                          <span>Data de criação</span>
                          <strong>{formatDate(link.createdAt)}</strong>
                        </div>
                      </div>

                      <div className="familyLinkActions">
                        {link.canViewProgress && (
                          <Link
                            to="/family/progress"
                            className="familyGhostLinkBtn"
                          >
                            Ver progresso
                          </Link>
                        )}

                        {link.canViewMessages && (
                          <Link
                            to="/messages"
                            className="familyGhostLinkBtn"
                          >
                            Ver mensagens
                          </Link>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="familyBottomGrid">
                <div className="familyCard">
                  <div className="familyCardHeader">
                    <h3 className="familyCardTitle">Notas</h3>
                  </div>

                  <div className="familyNoteBox">
                    <div className="familyNoteTitle">
                      Gestão de permissões controlada
                    </div>
                    <div className="familyNoteText">
                      As ligações familiares e respetivas permissões são definidas
                      por quem tem autorização clínica ou pelo próprio paciente.
                    </div>
                  </div>
                </div>

                <div className="familyCard">
                  <div className="familyCardHeader">
                    <h3 className="familyCardTitle">Ações rápidas</h3>
                  </div>

                  <div className="familyQuickActions">
                    <Link to="/family" className="familyGhostLinkBtn">
                      Voltar ao dashboard
                    </Link>
                    <Link to="/family/progress" className="familyGhostLinkBtn">
                      Consultar progresso
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