import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchMyProfile, updateMyProfile } from "../api/auth";

function formatRole(role) {
  if (role === "PATIENT") return "Paciente";
  if (role === "THERAPIST") return "Terapeuta";
  if (role === "FAMILY") return "Familiar";
  return role || "-";
}

function getInitials(name) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() || "").join("") || "U";
}

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const [form, setForm] = useState({
    display_name: "",
    phone: "",
    photo: null,
  });

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
      } catch (err) {
        setError(err.message || "Erro ao carregar perfil.");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  const initials = useMemo(
    () => getInitials(profile?.display_name),
    [profile?.display_name]
  );

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
      setSaveMessage("Perfil atualizado com sucesso.");
    } catch (err) {
      setError(err.message || "Erro ao atualizar perfil.");
    } finally {
      setSaving(false);
    }
  }

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
          <h1 className="pageTitle">Perfil do Utilizador</h1>
          <div className="pageSubtitle">
            Consulta e gere as tuas informações de perfil
          </div>
        </div>

        <div className="content">
          {loading && (
            <div className="profileCardModern">
              <h3 className="profileBlockTitle">A carregar...</h3>
              <p className="profileMutedText">A obter os dados do perfil.</p>
            </div>
          )}

          {error && !loading && (
            <div className="profileCardModern">
              <h3 className="profileBlockTitle">Erro</h3>
              <p className="profileMutedText">{error}</p>
            </div>
          )}

          {!loading && !error && profile && (
            <>
              {saveMessage && (
                <div className="profileNoticeOk">{saveMessage}</div>
              )}

              <div className="profileTopGrid">
                <div className="profileCardModern profileMainCard">
                  <div className="profileAvatarWrap">
                    {profile.photo_url ? (
                      <img
                        src={profile.photo_url}
                        alt="Foto de perfil"
                        className="profileAvatarImage"
                      />
                    ) : (
                      <div className="profileAvatarFallback">{initials}</div>
                    )}
                  </div>

                  <h2 className="profileMainName">
                    {profile.display_name || "Sem nome"}
                  </h2>

                  <div className="profileRoleBadge">
                    {formatRole(profile.role)}
                  </div>

                  <div className="profilePrimaryActions">
                    <button
                      type="button"
                      className="mediumButton"
                      onClick={() => {
                        setIsEditing((prev) => !prev);
                        setSaveMessage("");
                      }}
                    >
                      {isEditing ? "Cancelar edição" : "Editar perfil"}
                    </button>
                  </div>
                </div>

                <div className="profileCardModern">
                  <h3 className="profileBlockTitle">Informação pessoal</h3>

                  <div className="profileInfoList">
                    <div className="profileInfoItem">
                      <span>Nome apresentado</span>
                      <strong>{profile.display_name || "-"}</strong>
                    </div>

                    <div className="profileInfoItem">
                      <span>Telefone</span>
                      <strong>{profile.phone || "-"}</strong>
                    </div>

                    <div className="profileInfoItem">
                      <span>Função</span>
                      <strong>{formatRole(profile.role)}</strong>
                    </div>
                  </div>
                </div>

                <div className="profileCardModern">
                  <h3 className="profileBlockTitle">Resumo</h3>

                  <div className="profileInfoList">
                    <div className="profileInfoItem">
                      <span>Perfil ativo</span>
                      <strong>Sim</strong>
                    </div>

                    <div className="profileInfoItem">
                      <span>Foto carregada</span>
                      <strong>{profile.photo_url ? "Sim" : "Não"}</strong>
                    </div>

                    <div className="profileInfoItem">
                      <span>Estado</span>
                      <strong>Disponível</strong>
                    </div>
                  </div>
                </div>
              </div>

              {isEditing && (
                <form className="profileEditCard" onSubmit={handleSave}>
                  <h3 className="profileBlockTitle">Editar perfil</h3>

                  <div className="profileEditGrid">
                    <div className="profileField">
                      <label className="profileLabel">Nome apresentado</label>
                      <input
                        className="input"
                        name="display_name"
                        value={form.display_name}
                        onChange={handleChange}
                        placeholder="Nome apresentado"
                      />
                    </div>

                    <div className="profileField">
                      <label className="profileLabel">Telefone</label>
                      <input
                        className="input"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        placeholder="Telefone"
                      />
                    </div>

                    <div className="profileField profileFieldWide">
                      <label className="profileLabel">Foto de perfil</label>
                      <input
                        className="input"
                        type="file"
                        name="photo"
                        accept="image/*"
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="profileEditActions">
                    <button
                      type="button"
                      className="profileGhostLinkBtn profileGhostButton"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancelar
                    </button>

                    <button
                      type="submit"
                      className="mediumButton"
                      disabled={saving}
                    >
                      {saving ? "A guardar..." : "Guardar alterações"}
                    </button>
                  </div>
                </form>
              )}

              <div className="profileBottomGrid">
                <div className="profileCardModern">
                  <h3 className="profileBlockTitle">Apresentação</h3>
                  <p className="profileMutedText">
                    Este perfil representa a tua conta dentro da plataforma
                    RehabPlay. Os dados aqui mostrados são usados para
                    identificação e personalização da experiência.
                  </p>
                </div>

                <div className="profileCardModern">
                  <h3 className="profileBlockTitle">Ações rápidas</h3>

                  <div className="profileQuickActions">
                    <Link to="/settings" className="profileGhostLinkBtn">
                      Ir para definições
                    </Link>
                    <Link to="/dashboard" className="profileGhostLinkBtn">
                      Voltar ao dashboard
                    </Link>
                  </div>
                </div>
              </div>
            </>
          )}

          {!loading && !error && !profile && (
            <div className="profileCardModern">
              <h3 className="profileBlockTitle">Sem dados</h3>
              <p className="profileMutedText">
                Não foi possível encontrar informações de perfil.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}