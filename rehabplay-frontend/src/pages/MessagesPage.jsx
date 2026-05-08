import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { fetchMyProfile } from "../api/auth";
import {
  fetchThreads,
  fetchThreadMessages,
  sendThreadMessage,
} from "../api/patient";
import { useAppPreferences } from "../context/AppPreferencesContext.jsx";

const messagesText = {
  "pt-PT": {
    noDate: "Sem data",
    today: "Hoje",
    yesterday: "Ontem",
    userFallback: "Utilizador",
    therapist: "Terapeuta",
    patient: "Paciente",
    conversation: "Conversa",
    privateConversation: "Conversa privada",
    responsibleTherapist: "Terapeuta responsável",
    associatedPatient: "Paciente associado",
    you: "Tu",

    hello: "Olá",
    internalCommunication: "Comunicação interna",
    title: "Mensagens",
    subtitle:
      "Centraliza as conversas da plataforma, acompanha respostas e mantém a comunicação organizada entre paciente e terapeuta.",

    conversations: "Conversas",
    messagesInThisConversation: "Mensagens nesta conversa",
    activeConversation: "Conversa ativa",

    sidebarTitle: "Conversas",
    sidebarSubtitle: "Seleciona uma conversa para consultar o histórico.",
    refresh: "Atualizar",
    refreshing: "A atualizar...",
    searchPlaceholder: "Pesquisar conversa...",

    loading: "A carregar...",
    loadingThreadsText: "A obter as tuas conversas.",
    noConversations: "Sem conversas",
    noConversationsAvailable: "Ainda não existem conversas disponíveis.",
    noSearchResults: "Não encontrámos resultados para a tua pesquisa.",

    selectedConversation: "Conversa selecionada",
    available: "Disponível",

    selectConversation: "Seleciona uma conversa",
    selectConversationText: "Escolhe uma conversa para veres as mensagens.",

    createdAt: "Criada a",
    messageSingular: "mensagem",
    messagePlural: "mensagens",

    loadingMessages: "A carregar mensagens...",
    loadingMessagesText: "A obter mensagens desta conversa.",
    noMessages: "Sem mensagens",
    noMessagesText: "Esta conversa ainda não tem mensagens.",

    composerPlaceholder: "Escreve a tua mensagem...",
    enterHint: "Enter para enviar · Shift + Enter para nova linha",
    sending: "A enviar...",
    send: "Enviar",
    lastActivity: "Última atividade",

    loadThreadsError: "Erro ao carregar conversas.",
    loadMessagesError: "Erro ao carregar mensagens.",
    sendMessageError: "Erro ao enviar mensagem.",
  },

  en: {
    noDate: "No date",
    today: "Today",
    yesterday: "Yesterday",
    userFallback: "User",
    therapist: "Therapist",
    patient: "Patient",
    conversation: "Conversation",
    privateConversation: "Private conversation",
    responsibleTherapist: "Responsible therapist",
    associatedPatient: "Associated patient",
    you: "You",

    hello: "Hi",
    internalCommunication: "Internal communication",
    title: "Messages",
    subtitle:
      "Centralize platform conversations, follow responses and keep communication organized between patient and therapist.",

    conversations: "Conversations",
    messagesInThisConversation: "Messages in this conversation",
    activeConversation: "Active conversation",

    sidebarTitle: "Conversations",
    sidebarSubtitle: "Select a conversation to view its history.",
    refresh: "Refresh",
    refreshing: "Refreshing...",
    searchPlaceholder: "Search conversation...",

    loading: "Loading...",
    loadingThreadsText: "Fetching your conversations.",
    noConversations: "No conversations",
    noConversationsAvailable: "There are no conversations available yet.",
    noSearchResults: "No results found for your search.",

    selectedConversation: "Selected conversation",
    available: "Available",

    selectConversation: "Select a conversation",
    selectConversationText: "Choose a conversation to view the messages.",

    createdAt: "Created at",
    messageSingular: "message",
    messagePlural: "messages",

    loadingMessages: "Loading messages...",
    loadingMessagesText: "Fetching messages from this conversation.",
    noMessages: "No messages",
    noMessagesText: "This conversation has no messages yet.",

    composerPlaceholder: "Write your message...",
    enterHint: "Enter to send · Shift + Enter for a new line",
    sending: "Sending...",
    send: "Send",
    lastActivity: "Last activity",

    loadThreadsError: "Error loading conversations.",
    loadMessagesError: "Error loading messages.",
    sendMessageError: "Error sending message.",
  },
};

function formatDateTime(value, language) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString(language === "en" ? "en-GB" : "pt-PT", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDay(value, language, text) {
  if (!value) return text.noDate;

  const date = new Date(value);
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

function getInitials(name) {
  if (!name) return "U";
  const parts = String(name).trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() || "").join("") || "U";
}

function getMyUsername(thread, profile) {
  const role = String(profile?.role || "").toUpperCase();

  if (profile?.username) return profile.username;
  if (profile?.user?.username) return profile.user.username;

  if (role === "PATIENT") return thread?.patient_username || "";
  if (role === "THERAPIST") return thread?.therapist_username || "";

  return "";
}

function getThreadDisplayName(thread, profile, text) {
  const role = String(profile?.role || "").toUpperCase();
  const patient = thread?.patient_username || "";
  const therapist = thread?.therapist_username || "";
  const me = getMyUsername(thread, profile);

  if (role === "PATIENT") return therapist || text.therapist;
  if (role === "THERAPIST") return patient || text.patient;

  if (me && patient === me) return therapist || text.conversation;
  if (me && therapist === me) return patient || text.conversation;

  return therapist || patient || text.conversation;
}

function getThreadSubtitle(thread, profile, text) {
  const role = String(profile?.role || "").toUpperCase();
  const patient = thread?.patient_username || "";
  const therapist = thread?.therapist_username || "";

  if (role === "PATIENT") {
    return therapist ? text.responsibleTherapist : text.privateConversation;
  }

  if (role === "THERAPIST") {
    return patient ? text.associatedPatient : text.privateConversation;
  }

  if (patient && therapist) return `${patient} · ${therapist}`;

  return text.privateConversation;
}

export default function MessagesPage() {
  const chatEndRef = useRef(null);
  const { language } = useAppPreferences();

  const text = messagesText[language] || messagesText["pt-PT"];

  const [profile, setProfile] = useState(null);
  const [threads, setThreads] = useState([]);
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");

  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const displayName =
    profile?.display_name || profile?.username || text.userFallback;

  const firstName = String(displayName).split(" ")[0] || text.userFallback;

  const selectedThread = useMemo(() => {
    return threads.find((thread) => thread.id === selectedThreadId) || null;
  }, [threads, selectedThreadId]);

  const myUsername = useMemo(() => {
    return getMyUsername(selectedThread, profile);
  }, [selectedThread, profile]);

  const selectedPartnerName = useMemo(() => {
    if (!selectedThread) return text.conversation;
    return getThreadDisplayName(selectedThread, profile, text);
  }, [selectedThread, profile, text]);

  const loadThreads = useCallback(async () => {
    try {
      setLoadingThreads(true);
      setError("");

      const data = await fetchThreads();
      const safeThreads = Array.isArray(data) ? data : [];

      setThreads(safeThreads);

      setSelectedThreadId((prev) => {
        if (prev && safeThreads.some((thread) => thread.id === prev)) {
          return prev;
        }

        return safeThreads[0]?.id || null;
      });
    } catch (err) {
      setError(err.message || text.loadThreadsError);
    } finally {
      setLoadingThreads(false);
    }
  }, [text.loadThreadsError]);

  const loadMessages = useCallback(
    async (threadId) => {
      if (!threadId) {
        setMessages([]);
        return;
      }

      try {
        setLoadingMessages(true);
        setError("");

        const data = await fetchThreadMessages(threadId);
        setMessages(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || text.loadMessagesError);
      } finally {
        setLoadingMessages(false);
      }
    },
    [text.loadMessagesError]
  );

  useEffect(() => {
    async function bootstrap() {
      await loadThreads();

      try {
        const data = await fetchMyProfile();
        setProfile(data || null);
      } catch {
        setProfile(null);
      }
    }

    bootstrap();
  }, [loadThreads]);

  useEffect(() => {
    loadMessages(selectedThreadId);
  }, [selectedThreadId, loadMessages]);

  useEffect(() => {
    if (!chatEndRef.current) return;
    chatEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedThreadId]);

  const threadCards = useMemo(() => {
    return threads.map((thread) => {
      const name = getThreadDisplayName(thread, profile, text);

      return {
        id: thread.id,
        name,
        subtitle: getThreadSubtitle(thread, profile, text),
        time: formatDateTime(thread.created_at, language),
        initials: getInitials(name),
      };
    });
  }, [threads, profile, text, language]);

  const filteredThreadCards = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return threadCards;

    return threadCards.filter((thread) =>
      `${thread.name} ${thread.subtitle}`.toLowerCase().includes(q)
    );
  }, [threadCards, search]);

  const decoratedMessages = useMemo(() => {
    const result = [];
    let lastDay = "";

    for (const message of messages) {
      const day = formatDay(message.created_at, language, text);

      if (day !== lastDay) {
        result.push({
          type: "day",
          id: `day-${day}-${message.id}`,
          label: day,
        });
        lastDay = day;
      }

      result.push({
        type: "message",
        id: message.id,
        message,
      });
    }

    return result;
  }, [messages, language, text]);

  const lastMessageAt = useMemo(() => {
    if (messages.length > 0) return messages[messages.length - 1]?.created_at;
    return selectedThread?.created_at || null;
  }, [messages, selectedThread]);

  async function handleSendMessage() {
    const clean = draft.trim();
    if (!clean || !selectedThreadId) return;

    try {
      setSending(true);
      setError("");

      const created = await sendThreadMessage(selectedThreadId, {
        body: clean,
      });

      const safeCreated =
        created && typeof created === "object"
          ? created
          : {
              id: `temp-${Date.now()}`,
              sender_username: myUsername || text.you,
              body: clean,
              created_at: new Date().toISOString(),
            };

      setMessages((prev) => [...prev, safeCreated]);
      setDraft("");
    } catch (err) {
      setError(err.message || text.sendMessageError);
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
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
            {text.hello}, {firstName}
          </div>
        </div>

        <div className="content msgUltraPage">
          <section className="msgUltraHero">
            <div className="msgUltraHeroMain">
              <div className="msgUltraEyebrow">
                {text.internalCommunication}
              </div>

              <h1 className="msgUltraTitle">{text.title}</h1>

              <p className="msgUltraSubtitle">{text.subtitle}</p>
            </div>

            <div className="msgUltraHeroPanel">
              <div className="msgUltraHeroMetric">
                <span>{text.conversations}</span>
                <strong>{threadCards.length}</strong>
              </div>

              <div className="msgUltraHeroMetric">
                <span>{text.messagesInThisConversation}</span>
                <strong>{messages.length}</strong>
              </div>

              <div className="msgUltraHeroMetric msgUltraHeroMetricWide">
                <span>{text.activeConversation}</span>
                <strong>{selectedThread ? selectedPartnerName : "—"}</strong>
              </div>
            </div>
          </section>

          {error && <div className="msgUltraError">{error}</div>}

          <section className="msgUltraLayout">
            <aside className="msgUltraSidebar">
              <div className="msgUltraSidebarHeader">
                <div>
                  <h2>{text.sidebarTitle}</h2>
                  <p>{text.sidebarSubtitle}</p>
                </div>

                <button
                  type="button"
                  className="msgUltraSmallButton"
                  onClick={loadThreads}
                  disabled={loadingThreads}
                >
                  {loadingThreads ? text.refreshing : text.refresh}
                </button>
              </div>

              <div className="msgUltraSearchBox">
                <input
                  type="text"
                  placeholder={text.searchPlaceholder}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="msgUltraThreadList">
                {loadingThreads ? (
                  <div className="msgUltraEmpty">
                    <h3>{text.loading}</h3>
                    <p>{text.loadingThreadsText}</p>
                  </div>
                ) : filteredThreadCards.length === 0 ? (
                  <div className="msgUltraEmpty">
                    <h3>{text.noConversations}</h3>
                    <p>
                      {threadCards.length === 0
                        ? text.noConversationsAvailable
                        : text.noSearchResults}
                    </p>
                  </div>
                ) : (
                  filteredThreadCards.map((thread) => (
                    <button
                      key={thread.id}
                      type="button"
                      className={`msgUltraThread ${
                        selectedThreadId === thread.id ? "isSelected" : ""
                      }`}
                      onClick={() => setSelectedThreadId(thread.id)}
                    >
                      <div className="msgUltraThreadAvatar">
                        {thread.initials}
                      </div>

                      <div className="msgUltraThreadContent">
                        <div className="msgUltraThreadTop">
                          <strong>{thread.name}</strong>
                          <span>{thread.time}</span>
                        </div>

                        <p>{thread.subtitle}</p>

                        <div className="msgUltraThreadStatus">
                          {selectedThreadId === thread.id
                            ? text.selectedConversation
                            : text.available}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </aside>

            <main className="msgUltraChat">
              {!selectedThread ? (
                <div className="msgUltraEmpty msgUltraEmptyChat">
                  <h3>{text.selectConversation}</h3>
                  <p>{text.selectConversationText}</p>
                </div>
              ) : (
                <>
                  <header className="msgUltraChatHeader">
                    <div className="msgUltraChatIdentity">
                      <div className="msgUltraChatAvatar">
                        {getInitials(selectedPartnerName)}
                      </div>

                      <div>
                        <h2>{selectedPartnerName}</h2>
                        <p>{getThreadSubtitle(selectedThread, profile, text)}</p>
                      </div>
                    </div>

                    <div className="msgUltraChatActions">
                      <div className="msgUltraHeaderBadge">
                        {text.createdAt}{" "}
                        {formatDateTime(selectedThread.created_at, language)}
                      </div>

                      <div className="msgUltraHeaderBadge msgUltraHeaderBadgeLight">
                        {messages.length}{" "}
                        {messages.length === 1
                          ? text.messageSingular
                          : text.messagePlural}
                      </div>

                      <button
                        type="button"
                        className="msgUltraSmallButton"
                        onClick={() => loadMessages(selectedThreadId)}
                        disabled={loadingMessages}
                      >
                        {loadingMessages ? text.refreshing : text.refresh}
                      </button>
                    </div>
                  </header>

                  <div className="msgUltraChatBody">
                    {loadingMessages ? (
                      <div className="msgUltraEmpty">
                        <h3>{text.loadingMessages}</h3>
                        <p>{text.loadingMessagesText}</p>
                      </div>
                    ) : decoratedMessages.length === 0 ? (
                      <div className="msgUltraEmpty">
                        <h3>{text.noMessages}</h3>
                        <p>{text.noMessagesText}</p>
                      </div>
                    ) : (
                      decoratedMessages.map((item) => {
                        if (item.type === "day") {
                          return (
                            <div key={item.id} className="msgUltraDaySeparator">
                              <span>{item.label}</span>
                            </div>
                          );
                        }

                        const message = item.message;
                        const isMine = myUsername
                          ? message.sender_username === myUsername
                          : false;

                        return (
                          <div
                            key={item.id}
                            className={`msgUltraMessageRow ${
                              isMine ? "isMine" : ""
                            }`}
                          >
                            <div
                              className={`msgUltraBubble ${
                                isMine ? "isMine" : "isOther"
                              }`}
                            >
                              <div className="msgUltraBubbleAuthor">
                                {isMine ? text.you : message.sender_username}
                              </div>

                              <div className="msgUltraBubbleText">
                                {message.body}
                              </div>

                              <div className="msgUltraBubbleTime">
                                {formatDateTime(message.created_at, language)}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}

                    <div ref={chatEndRef} />
                  </div>

                  <footer className="msgUltraComposer">
                    <div className="msgUltraComposerBox">
                      <textarea
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={text.composerPlaceholder}
                        maxLength={1500}
                      />

                      <div className="msgUltraComposerFooter">
                        <span>{text.enterHint}</span>

                        <div className="msgUltraComposerActions">
                          <span>{draft.length}/1500</span>

                          <button
                            type="button"
                            onClick={handleSendMessage}
                            disabled={sending || !draft.trim()}
                          >
                            {sending ? text.sending : text.send}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="msgUltraLastActivity">
                      {text.lastActivity}:{" "}
                      {formatDateTime(lastMessageAt, language)}
                    </div>
                  </footer>
                </>
              )}
            </main>
          </section>
        </div>
      </div>
    </div>
  );
}