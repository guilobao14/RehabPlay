import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchNotifications,
  markNotificationAsRead,
} from "../api/notifications";

const filters = [
  { key: "all", label: "Todas" },
  { key: "unread", label: "Não lidas" },
  { key: "exercise", label: "Exercícios" },
  { key: "message", label: "Mensagens" },
  { key: "library", label: "Biblioteca" },
  { key: "achievement", label: "Conquistas" },
  { key: "system", label: "Sistema" },
];

function normalizeType(type) {
  const value = String(type || "").toLowerCase();

  if (
    value.includes("exercise") ||
    value.includes("exercicio") ||
    value.includes("session") ||
    value.includes("sess")
  ) {
    return "exercise";
  }

  if (
    value.includes("message") ||
    value.includes("mensag") ||
    value.includes("thread")
  ) {
    return "message";
  }

  if (
    value.includes("library") ||
    value.includes("biblioteca") ||
    value.includes("media")
  ) {
    return "library";
  }

  if (
    value.includes("achievement") ||
    value.includes("badge") ||
    value.includes("reward") ||
    value.includes("conquista")
  ) {
    return "achievement";
  }

  return "system";
}

function formatTime(dateValue) {
  if (!dateValue) return "-";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return String(dateValue);

  return date.toLocaleString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeNotification(raw) {
  const normalizedType = normalizeType(raw.type);

  return {
    id: raw.id,
    type: normalizedType,
    title: raw.title || "Notificação",
    message: raw.body || "Sem conteúdo disponível.",
    objectType: raw.object_type || null,
    objectId: raw.object_id || null,
    read: !!raw.is_read,
    time: formatTime(raw.created_at),
  };
}

function getNotificationIcon(type) {
  switch (type) {
    case "exercise":
      return "🏃";
    case "message":
      return "💬";
    case "library":
      return "📚";
    case "achievement":
      return "🏅";
    case "system":
      return "🔔";
    default:
      return "•";
  }
}

function getNotificationTag(type) {
  switch (type) {
    case "exercise":
      return "Exercício";
    case "message":
      return "Mensagem";
    case "library":
      return "Biblioteca";
    case "achievement":
      return "Conquista";
    case "system":
      return "Sistema";
    default:
      return "Geral";
  }
}

export default function NotificationsPage() {
  const [items, setItems] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [workingIds, setWorkingIds] = useState([]);

  useEffect(() => {
    async function loadNotifications() {
      try {
        const data = await fetchNotifications();
        const normalized = Array.isArray(data)
          ? data.map(normalizeNotification)
          : [];
        setItems(normalized);
      } catch (err) {
        setError(err.message || "Erro ao carregar notificações.");
      } finally {
        setLoading(false);
      }
    }

    loadNotifications();
  }, []);

  const unreadCount = items.filter((item) => !item.read).length;

  const filteredItems = useMemo(() => {
    if (activeFilter === "all") return items;
    if (activeFilter === "unread") return items.filter((item) => !item.read);
    return items.filter((item) => item.type === activeFilter);
  }, [items, activeFilter]);

  async function handleMarkAsRead(id) {
    try {
      setWorkingIds((prev) => [...prev, id]);
      await markNotificationAsRead(id);

      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, read: true } : item))
      );
    } catch (err) {
      setError(err.message || "Erro ao marcar notificação como lida.");
    } finally {
      setWorkingIds((prev) => prev.filter((itemId) => itemId !== id));
    }
  }

  async function handleMarkAllAsRead() {
    const unreadItems = items.filter((item) => !item.read);
    if (!unreadItems.length) return;

    try {
      setWorkingIds(unreadItems.map((item) => item.id));

      await Promise.all(
        unreadItems.map((item) => markNotificationAsRead(item.id))
      );

      setItems((prev) => prev.map((item) => ({ ...item, read: true })));
    } catch (err) {
      setError(err.message || "Erro ao marcar todas como lidas.");
    } finally {
      setWorkingIds([]);
    }
  }

  function handleRemoveLocal(id) {
    setItems((prev) => prev.filter((item) => item.id !== id));
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
          <h1 className="pageTitle">Notificações</h1>
          <div className="pageSubtitle">
            Acompanha alertas, lembretes, mensagens e novidades da plataforma
          </div>
        </div>

        <div className="content">
          {loading && (
            <div className="notificationsPanel">
              <div className="notificationsEmpty">
                <h3>A carregar notificações...</h3>
                <p>A obter dados reais da tua conta.</p>
              </div>
            </div>
          )}

          {error && !loading && (
            <div className="notificationsPanel">
              <div className="notificationsEmpty">
                <h3>Erro</h3>
                <p>{error}</p>
              </div>
            </div>
          )}

          {!loading && !error && (
            <>
              <div className="notificationsTopRow">
                <div className="notificationsStats">
                  <div className="notificationsStatCard">
                    <div className="notificationsStatLabel">Total</div>
                    <div className="notificationsStatValue">{items.length}</div>
                  </div>

                  <div className="notificationsStatCard">
                    <div className="notificationsStatLabel">Não lidas</div>
                    <div className="notificationsStatValue notificationsAccent">
                      {unreadCount}
                    </div>
                  </div>
                </div>

                <div className="notificationsTopActions">
                  <button
                    className="notificationsActionBtn"
                    onClick={handleMarkAllAsRead}
                    disabled={!unreadCount || workingIds.length > 0}
                  >
                    Marcar todas como lidas
                  </button>
                </div>
              </div>

              <div className="notificationsFilters">
                {filters.map((filter) => (
                  <button
                    key={filter.key}
                    className={`notificationsFilterBtn ${
                      activeFilter === filter.key
                        ? "notificationsFilterBtnActive"
                        : ""
                    }`}
                    onClick={() => setActiveFilter(filter.key)}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              <div className="notificationsPanel">
                {filteredItems.length > 0 ? (
                  <div className="notificationsList">
                    {filteredItems.map((item) => (
                      <div
                        key={item.id}
                        className={`notificationItem ${
                          !item.read ? "notificationItemUnread" : ""
                        }`}
                      >
                        <div className="notificationIconWrap">
                          <div className="notificationIcon">
                            {getNotificationIcon(item.type)}
                          </div>
                        </div>

                        <div className="notificationContent">
                          <div className="notificationTopLine">
                            <div className="notificationTitleWrap">
                              <h3 className="notificationTitle">{item.title}</h3>
                              <span className="notificationTag">
                                {getNotificationTag(item.type)}
                              </span>
                              {!item.read && (
                                <span className="notificationNewBadge">
                                  Nova
                                </span>
                              )}
                            </div>

                            <div className="notificationTime">{item.time}</div>
                          </div>

                          <p className="notificationMessage">{item.message}</p>

                          <div className="notificationActions">
                            {!item.read && (
                              <button
                                className="notificationInlineBtn"
                                onClick={() => handleMarkAsRead(item.id)}
                                disabled={workingIds.includes(item.id)}
                              >
                                {workingIds.includes(item.id)
                                  ? "A marcar..."
                                  : "Marcar como lida"}
                              </button>
                            )}

                            <button
                              className="notificationInlineBtn notificationInlineBtnDanger"
                              onClick={() => handleRemoveLocal(item.id)}
                            >
                              Remover
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="notificationsEmpty">
                    <h3>Sem notificações nesta categoria</h3>
                    <p>
                      Experimenta mudar o filtro ou aguarda por novas atualizações.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}