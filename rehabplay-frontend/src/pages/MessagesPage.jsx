import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchThreads,
  fetchThreadMessages,
  sendThreadMessage,
} from "../api/patient";

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getInitials(name) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() || "").join("") || "U";
}

export default function MessagesPage() {
  const [threads, setThreads] = useState([]);
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");

  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadThreads() {
      try {
        const data = await fetchThreads();
        const safeThreads = Array.isArray(data) ? data : [];
        setThreads(safeThreads);

        if (safeThreads.length > 0) {
          setSelectedThreadId(safeThreads[0].id);
        }
      } catch (err) {
        setError(err.message || "Erro ao carregar conversas.");
      } finally {
        setLoadingThreads(false);
      }
    }

    loadThreads();
  }, []);

  useEffect(() => {
    async function loadMessages() {
      if (!selectedThreadId) {
        setMessages([]);
        return;
      }

      try {
        setLoadingMessages(true);
        const data = await fetchThreadMessages(selectedThreadId);
        setMessages(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || "Erro ao carregar mensagens.");
      } finally {
        setLoadingMessages(false);
      }
    }

    loadMessages();
  }, [selectedThreadId]);

  const selectedThread = useMemo(() => {
    return threads.find((thread) => thread.id === selectedThreadId) || null;
  }, [threads, selectedThreadId]);

  const threadCards = useMemo(() => {
    return threads.map((thread) => {
      const otherName =
        thread.therapist_username || thread.patient_username || "Conversa";

      return {
        id: thread.id,
        name: otherName,
        subtitle:
          thread.patient_username && thread.therapist_username
            ? `${thread.patient_username} · ${thread.therapist_username}`
            : "Thread",
        time: formatDateTime(thread.created_at),
        initials: getInitials(otherName),
      };
    });
  }, [threads]);

  async function handleSendMessage() {
    const clean = draft.trim();
    if (!clean || !selectedThreadId) return;

    try {
      setSending(true);
      setError("");

      const created = await sendThreadMessage(selectedThreadId, { body: clean });

      setMessages((prev) => [...prev, created]);
      setDraft("");
    } catch (err) {
      setError(err.message || "Erro ao enviar mensagem.");
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
          <div className="userArea">Olá, Guilherme</div>
        </div>

        <div className="pageHeader">
          <h1 className="pageTitle">Mensagens</h1>
          <div className="pageSubtitle">
            Comunica diretamente dentro da plataforma
          </div>
        </div>

        <div className="content">
          {error && (
            <div className="messagesNoticeError">
              {error}
            </div>
          )}

          <div className="messagesWrap">
            <aside className="messagesSidebar">
              <div className="messagesSidebarTop">
                <div className="messagesSidebarTitle">Conversas</div>
              </div>

              <div className="messagesThreadList">
                {loadingThreads ? (
                  <div className="messagesEmpty">
                    <h3>A carregar...</h3>
                    <p>A obter as tuas conversas.</p>
                  </div>
                ) : threadCards.length === 0 ? (
                  <div className="messagesEmpty">
                    <h3>Sem conversas</h3>
                    <p>Ainda não tens threads disponíveis.</p>
                  </div>
                ) : (
                  threadCards.map((thread) => (
                    <button
                      key={thread.id}
                      className={`messagesThreadItem ${
                        selectedThreadId === thread.id
                          ? "messagesThreadItemActive"
                          : ""
                      }`}
                      onClick={() => setSelectedThreadId(thread.id)}
                    >
                      <div className="messagesAvatarWrap">
                        <div className="messagesAvatar">{thread.initials}</div>
                      </div>

                      <div className="messagesThreadMeta">
                        <div className="messagesThreadRow">
                          <div className="messagesThreadName">{thread.name}</div>
                          <div className="messagesThreadTime">{thread.time}</div>
                        </div>

                        <div className="messagesThreadRole">{thread.subtitle}</div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </aside>

            <section className="messagesChatPanel">
              {!selectedThread ? (
                <div className="messagesEmpty">
                  <h3>Seleciona uma conversa</h3>
                  <p>Escolhe uma thread para veres as mensagens.</p>
                </div>
              ) : (
                <>
                  <div className="messagesChatTop">
                    <div className="messagesChatUser">
                      <div className="messagesChatAvatar">
                        {getInitials(
                          selectedThread.therapist_username ||
                            selectedThread.patient_username
                        )}
                      </div>

                      <div>
                        <div className="messagesChatName">
                          {selectedThread.therapist_username ||
                            selectedThread.patient_username ||
                            "Conversa"}
                        </div>
                        <div className="messagesChatRole">
                          Criada em {formatDateTime(selectedThread.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="messagesChatBody">
                    {loadingMessages ? (
                      <div className="messagesEmpty">
                        <h3>A carregar mensagens...</h3>
                        <p>A obter mensagens da thread selecionada.</p>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="messagesEmpty">
                        <h3>Sem mensagens</h3>
                        <p>Esta conversa ainda não tem mensagens.</p>
                      </div>
                    ) : (
                      messages.map((message) => {
                        const isMine =
                          selectedThread &&
                          message.sender_username !==
                            (selectedThread.therapist_username ||
                              selectedThread.patient_username);

                        return (
                          <div
                            key={message.id}
                            className={`messagesBubbleRow ${
                              isMine ? "messagesBubbleRowMe" : ""
                            }`}
                          >
                            <div
                              className={`messagesBubble ${
                                isMine
                                  ? "messagesBubbleMe"
                                  : "messagesBubbleThem"
                              }`}
                            >
                              <div className="messagesBubbleAuthor">
                                {message.sender_username}
                              </div>
                              <div className="messagesBubbleText">
                                {message.body}
                              </div>
                              <div className="messagesBubbleTime">
                                {formatDateTime(message.created_at)}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="messagesComposer">
                    <textarea
                      className="messagesInput"
                      placeholder="Escreve a tua mensagem..."
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={handleKeyDown}
                    />

                    <button
                      className="messagesSendBtn"
                      onClick={handleSendMessage}
                      disabled={sending || !draft.trim()}
                    >
                      {sending ? "A enviar..." : "Enviar"}
                    </button>
                  </div>
                </>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}