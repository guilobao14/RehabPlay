import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchMyProfile } from "../api/auth";
import {
  fetchNotifications,
  markNotificationAsRead,
} from "../api/notifications";
import { useAppPreferences } from "../context/AppPreferencesContext.jsx";

const notificationsText = {
  "pt-PT": {
    hello: "Olá",
    userFallback: "Utilizador",
    noDate: "Sem data",
    today: "Hoje",
    yesterday: "Ontem",
    notification: "Notificação",
    noContent: "Sem conteúdo disponível.",
    error: "Erro",

    filters: {
      all: "Todas",
      unread: "Não lidas",
      exercise: "Exercícios",
      message: "Mensagens",
      library: "Biblioteca",
      achievement: "Conquistas",
      system: "Sistema",
    },

    tagExercise: "Exercício",
    tagMessage: "Mensagem",
    tagLibrary: "Biblioteca",
    tagAchievement: "Conquista",
    tagSystem: "Sistema",
    tagGeneral: "Geral",

    loadingTitle: "A carregar notificações...",
    loadingText: "A obter os dados reais da tua conta.",

    eyebrow: "Centro de alertas",
    title: "Notificações",
    subtitle:
      "Acompanha mensagens, lembretes, sessões e atualizações da plataforma num painel simples, organizado e sempre atualizado.",

    total: "Total",
    unread: "Não lidas",
    read: "Lidas",

    currentStatus: "Estado atual",
    pending: "por consultar",
    allGood: "Tudo em dia",
    pendingText:
      "Tens notificações pendentes. Confirma os avisos mais recentes para não perderes nenhuma atualização.",
    allGoodText: "Não existem notificações pendentes neste momento.",

    updating: "A atualizar...",
    update: "Atualizar",
    markAllRead: "Marcar todas como lidas",

    mostRecent: "Mais recente",
    noNotifications: "Sem notificações",
    noRecords: "Ainda não existem registos.",

    messages: "Mensagens",
    exercises: "Exercícios",
    system: "Sistema",

    messagesText: "Notificações relacionadas com conversas.",
    exercisesText: "Avisos associados a sessões e planos.",
    systemText: "Atualizações gerais da plataforma.",

    listTitle: "Lista de notificações",
    listText:
      "Filtra por estado ou categoria para encontrares rapidamente o que precisas.",

    new: "Nova",
    marking: "A marcar...",
    markAsRead: "Marcar como lida",
    openArea: "Abrir área",
    hide: "Ocultar",

    emptyTitle: "Sem notificações nesta categoria",
    emptyText:
      "Experimenta mudar o filtro ou aguarda por novas atualizações.",

    loadError: "Erro ao carregar notificações.",
    markReadError: "Erro ao marcar notificação como lida.",
    markAllReadError: "Erro ao marcar todas como lidas.",
  },

  en: {
    hello: "Hi",
    userFallback: "User",
    noDate: "No date",
    today: "Today",
    yesterday: "Yesterday",
    notification: "Notification",
    noContent: "No content available.",
    error: "Error",

    filters: {
      all: "All",
      unread: "Unread",
      exercise: "Exercises",
      message: "Messages",
      library: "Library",
      achievement: "Achievements",
      system: "System",
    },

    tagExercise: "Exercise",
    tagMessage: "Message",
    tagLibrary: "Library",
    tagAchievement: "Achievement",
    tagSystem: "System",
    tagGeneral: "General",

    loadingTitle: "Loading notifications...",
    loadingText: "Fetching your real account data.",

    eyebrow: "Alert center",
    title: "Notifications",
    subtitle:
      "Track messages, reminders, sessions and platform updates in a simple, organized and always up-to-date panel.",

    total: "Total",
    unread: "Unread",
    read: "Read",

    currentStatus: "Current status",
    pending: "pending",
    allGood: "All caught up",
    pendingText:
      "You have pending notifications. Check the latest alerts so you do not miss any update.",
    allGoodText: "There are no pending notifications right now.",

    updating: "Updating...",
    update: "Refresh",
    markAllRead: "Mark all as read",

    mostRecent: "Most recent",
    noNotifications: "No notifications",
    noRecords: "There are no records yet.",

    messages: "Messages",
    exercises: "Exercises",
    system: "System",

    messagesText: "Notifications related to conversations.",
    exercisesText: "Alerts related to sessions and plans.",
    systemText: "General platform updates.",

    listTitle: "Notifications list",
    listText: "Filter by status or category to quickly find what you need.",

    new: "New",
    marking: "Marking...",
    markAsRead: "Mark as read",
    openArea: "Open area",
    hide: "Hide",

    emptyTitle: "No notifications in this category",
    emptyText: "Try changing the filter or wait for new updates.",

    loadError: "Error loading notifications.",
    markReadError: "Error marking notification as read.",
    markAllReadError: "Error marking all as read.",
  },
};

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

function translateNotificationTitle(title, language) {
  if (language !== "en") return title;

  const value = String(title || "").toLowerCase();

  if (value.includes("nova mensagem")) return "New message";
  if (value.includes("novo plano atribuído")) return "New plan assigned";
  if (value.includes("plano atualizado")) return "Plan updated";
  if (value.includes("nova sessão agendada")) return "New session scheduled";

  return title;
}

function translateNotificationBody(body, language) {
  if (language !== "en") return body;

  let value = String(body || "");

  value = value.replace("Mensagem de", "Message from");
  value = value.replace("Sessão agendada para", "Session scheduled for");
  value = value.replace(
    "Foi adicionado um exercício ao teu plano:",
    "An exercise was added to your plan:"
  );
  value = value.replace("O terapeuta", "Therapist");
  value = value.replace("atribuiu-te o plano:", "assigned you the plan:");

  return value;
}

function formatTime(dateValue, language) {
  if (!dateValue) return "-";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return String(dateValue);

  return date.toLocaleString(language === "en" ? "en-GB" : "pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDay(dateValue, language, text) {
  if (!dateValue) return text.noDate;

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return text.noDate;

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(date, today)) return text.today;
  if (sameDay(date, yesterday)) return text.yesterday;

  return date.toLocaleDateString(language === "en" ? "en-GB" : "pt-PT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function getNotificationCode(type) {
  switch (type) {
    case "exercise":
      return "EX";
    case "message":
      return "MSG";
    case "library":
      return "BIB";
    case "achievement":
      return "CON";
    case "system":
      return "SYS";
    default:
      return "INF";
  }
}

function getNotificationTarget(type) {
  switch (type) {
    case "exercise":
      return "/patient/plan";
    case "message":
      return "/messages";
    case "library":
      return "/patient/library";
    case "achievement":
      return "/patient/gamification";
    default:
      return "/dashboard";
  }
}

function getNotificationTag(type, text) {
  switch (type) {
    case "exercise":
      return text.tagExercise;
    case "message":
      return text.tagMessage;
    case "library":
      return text.tagLibrary;
    case "achievement":
      return text.tagAchievement;
    case "system":
      return text.tagSystem;
    default:
      return text.tagGeneral;
  }
}

function normalizeNotification(raw, language, text) {
  const normalizedType = normalizeType(raw.type);

  return {
    id: raw.id,
    type: normalizedType,
    title: translateNotificationTitle(raw.title || text.notification, language),
    message: translateNotificationBody(raw.body || text.noContent, language),
    objectType: raw.object_type || null,
    objectId: raw.object_id || null,
    read: !!raw.is_read,
    createdAt: raw.created_at,
    time: formatTime(raw.created_at, language),
    day: formatDay(raw.created_at, language, text),
  };
}

export default function NotificationsPage() {
  const { language } = useAppPreferences();
  const text = notificationsText[language] || notificationsText["pt-PT"];

  const filters = [
    { key: "all", label: text.filters.all },
    { key: "unread", label: text.filters.unread },
    { key: "exercise", label: text.filters.exercise },
    { key: "message", label: text.filters.message },
    { key: "library", label: text.filters.library },
    { key: "achievement", label: text.filters.achievement },
    { key: "system", label: text.filters.system },
  ];

  const [profile, setProfile] = useState(null);
  const [items, setItems] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [workingIds, setWorkingIds] = useState([]);

  const displayName =
    profile?.display_name || profile?.username || text.userFallback;

  const firstName = String(displayName).split(" ")[0] || text.userFallback;

  async function loadNotifications({ silent = false } = {}) {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const [notificationsData, profileData] = await Promise.all([
        fetchNotifications(),
        fetchMyProfile().catch(() => null),
      ]);

      const normalized = Array.isArray(notificationsData)
        ? notificationsData.map((item) =>
            normalizeNotification(item, language, text)
          )
        : [];

      setItems(normalized);
      setProfile(profileData);
    } catch (err) {
      setError(err.message || text.loadError);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, [language]);

  const unreadCount = useMemo(() => {
    return items.filter((item) => !item.read).length;
  }, [items]);

  const readCount = items.length - unreadCount;

  const categoryCounts = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        acc.all += 1;
        if (!item.read) acc.unread += 1;
        acc[item.type] = (acc[item.type] || 0) + 1;
        return acc;
      },
      {
        all: 0,
        unread: 0,
        exercise: 0,
        message: 0,
        library: 0,
        achievement: 0,
        system: 0,
      }
    );
  }, [items]);

  const filteredItems = useMemo(() => {
    if (activeFilter === "all") return items;
    if (activeFilter === "unread") return items.filter((item) => !item.read);
    return items.filter((item) => item.type === activeFilter);
  }, [items, activeFilter]);

  const groupedItems = useMemo(() => {
    const groups = [];

    for (const item of filteredItems) {
      const existingGroup = groups.find((group) => group.day === item.day);

      if (existingGroup) {
        existingGroup.items.push(item);
      } else {
        groups.push({
          day: item.day,
          items: [item],
        });
      }
    }

    return groups;
  }, [filteredItems]);

  const mostRecent = items[0];

  async function handleMarkAsRead(id) {
    try {
      setWorkingIds((prev) => [...prev, id]);
      setError("");

      await markNotificationAsRead(id);

      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, read: true } : item))
      );
    } catch (err) {
      setError(err.message || text.markReadError);
    } finally {
      setWorkingIds((prev) => prev.filter((itemId) => itemId !== id));
    }
  }

  async function handleMarkAllAsRead() {
    const unreadItems = items.filter((item) => !item.read);
    if (!unreadItems.length) return;

    try {
      setWorkingIds(unreadItems.map((item) => item.id));
      setError("");

      await Promise.all(
        unreadItems.map((item) => markNotificationAsRead(item.id))
      );

      setItems((prev) => prev.map((item) => ({ ...item, read: true })));
    } catch (err) {
      setError(err.message || text.markAllReadError);
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

          <div className="userArea">
            {text.hello}, {firstName}
          </div>
        </div>

        <div className="content notifProPage">
          {loading && (
            <div className="notifProStateCard">
              <h3>{text.loadingTitle}</h3>
              <p>{text.loadingText}</p>
            </div>
          )}

          {error && !loading && (
            <div className="notifProError">
              <strong>{text.error}</strong>
              <span>{error}</span>
            </div>
          )}

          {!loading && (
            <>
              <section className="notifProHero">
                <div className="notifProHeroMain">
                  <div className="notifProEyebrow">{text.eyebrow}</div>

                  <h1 className="notifProTitle">{text.title}</h1>

                  <p className="notifProSubtitle">{text.subtitle}</p>

                  <div className="notifProQuickStats">
                    <div className="notifProQuickStat">
                      <span>{text.total}</span>
                      <strong>{items.length}</strong>
                    </div>

                    <div className="notifProQuickStat">
                      <span>{text.unread}</span>
                      <strong>{unreadCount}</strong>
                    </div>

                    <div className="notifProQuickStat">
                      <span>{text.read}</span>
                      <strong>{readCount}</strong>
                    </div>
                  </div>
                </div>

                <div className="notifProHeroSide">
                  <div className="notifProFocusCard">
                    <div className="notifProFocusLabel">
                      {text.currentStatus}
                    </div>

                    <div className="notifProFocusValue">
                      {unreadCount > 0
                        ? `${unreadCount} ${text.pending}`
                        : text.allGood}
                    </div>

                    <p>
                      {unreadCount > 0 ? text.pendingText : text.allGoodText}
                    </p>

                    <div className="notifProFocusActions">
                      <button
                        type="button"
                        className="notifProPrimaryBtn"
                        onClick={handleMarkAllAsRead}
                        disabled={!unreadCount || workingIds.length > 0}
                      >
                        {workingIds.length > 0
                          ? text.updating
                          : text.markAllRead}
                      </button>

                      <button
                        type="button"
                        className="notifProGhostBtn"
                        onClick={() => loadNotifications({ silent: true })}
                        disabled={refreshing}
                      >
                        {refreshing ? text.updating : text.update}
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              <section className="notifProSummaryGrid">
                <div className="notifProSummaryCard">
                  <span>{text.mostRecent}</span>
                  <strong>{mostRecent?.title || text.noNotifications}</strong>
                  <p>{mostRecent ? mostRecent.time : text.noRecords}</p>
                </div>

                <div className="notifProSummaryCard">
                  <span>{text.messages}</span>
                  <strong>{categoryCounts.message}</strong>
                  <p>{text.messagesText}</p>
                </div>

                <div className="notifProSummaryCard">
                  <span>{text.exercises}</span>
                  <strong>{categoryCounts.exercise}</strong>
                  <p>{text.exercisesText}</p>
                </div>

                <div className="notifProSummaryCard">
                  <span>{text.system}</span>
                  <strong>{categoryCounts.system}</strong>
                  <p>{text.systemText}</p>
                </div>
              </section>

              <section className="notifProToolbar">
                <div>
                  <h2>{text.listTitle}</h2>
                  <p>{text.listText}</p>
                </div>
              </section>

              <div className="notifProFilters">
                {filters.map((filter) => (
                  <button
                    key={filter.key}
                    type="button"
                    className={`notifProFilter ${
                      activeFilter === filter.key ? "isActive" : ""
                    }`}
                    onClick={() => setActiveFilter(filter.key)}
                  >
                    <span>{filter.label}</span>
                    <strong>{categoryCounts[filter.key] || 0}</strong>
                  </button>
                ))}
              </div>

              <section className="notifProPanel">
                {groupedItems.length > 0 ? (
                  groupedItems.map((group) => (
                    <div key={group.day} className="notifProGroup">
                      <div className="notifProGroupTitle">
                        <span>{group.day}</span>
                      </div>

                      <div className="notifProList">
                        {group.items.map((item) => (
                          <article
                            key={item.id}
                            className={`notifProItem ${
                              !item.read ? "isUnread" : ""
                            }`}
                          >
                            <div
                              className={`notifProItemCode notifType-${item.type}`}
                            >
                              {getNotificationCode(item.type)}
                            </div>

                            <div className="notifProItemBody">
                              <div className="notifProItemTop">
                                <div>
                                  <div className="notifProItemTitleRow">
                                    <h3>{item.title}</h3>

                                    <span className="notifProTag">
                                      {getNotificationTag(item.type, text)}
                                    </span>

                                    {!item.read && (
                                      <span className="notifProNewBadge">
                                        {text.new}
                                      </span>
                                    )}
                                  </div>

                                  <p className="notifProMessage">
                                    {item.message}
                                  </p>
                                </div>

                                <div className="notifProTime">{item.time}</div>
                              </div>

                              <div className="notifProActions">
                                {!item.read && (
                                  <button
                                    type="button"
                                    className="notifProActionBtn"
                                    onClick={() => handleMarkAsRead(item.id)}
                                    disabled={workingIds.includes(item.id)}
                                  >
                                    {workingIds.includes(item.id)
                                      ? text.marking
                                      : text.markAsRead}
                                  </button>
                                )}

                                <Link
                                  to={getNotificationTarget(item.type)}
                                  className="notifProActionLink"
                                >
                                  {text.openArea}
                                </Link>

                                <button
                                  type="button"
                                  className="notifProActionBtn notifProActionBtnLight"
                                  onClick={() => handleRemoveLocal(item.id)}
                                >
                                  {text.hide}
                                </button>
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="notifProEmpty">
                    <h3>{text.emptyTitle}</h3>
                    <p>{text.emptyText}</p>
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}