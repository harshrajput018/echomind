import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import api from "../utils/api";
import toast from "react-hot-toast";
import Sidebar from "../components/Sidebar";
import "./Chat.css";

export default function ChatPage() {
  const { kbId, convId } = useParams();
  const navigate = useNavigate();
  const [kb, setKb] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(convId || null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialising, setInitialising] = useState(true);
  const [expandedSources, setExpandedSources] = useState({});
  const bottomRef = useRef();
  const inputRef = useRef();

  useEffect(() => {
    Promise.all([
      api.get(`/knowledge-bases/${kbId}`),
      api.get(`/chat/conversations/${kbId}`),
    ])
      .then(([kbRes, convRes]) => {
        setKb(kbRes.data.knowledgeBase);
        setConversations(convRes.data.conversations);
      })
      .catch(() => toast.error("Failed to load workspace."))
      .finally(() => setInitialising(false));
  }, [kbId]);

  useEffect(() => {
    if (convId) {
      setInitialising(true);
      api.get(`/chat/conversation/${convId}`)
        .then(({ data }) => {
          setMessages(data.conversation.messages);
          setConversationId(convId);
        })
        .catch(() => toast.error("Failed to load conversation."))
        .finally(() => setInitialising(false));
    }
  }, [convId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: "user", content: text, createdAt: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const { data } = await api.post("/chat/message", {
        knowledgeBaseId: kbId,
        conversationId,
        message: text,
      });

      setConversationId(data.conversationId);
      setMessages((prev) => [...prev, data.message]);

      // Update URL without reload
      navigate(`/kb/${kbId}/chat/${data.conversationId}`, { replace: true });

      // Refresh conversations list
      const convRes = await api.get(`/chat/conversations/${kbId}`);
      setConversations(convRes.data.conversations);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to get a response.");
      setMessages((prev) => prev.slice(0, -1)); // remove optimistic user msg
      setInput(text);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleSources = (idx) =>
    setExpandedSources((prev) => ({ ...prev, [idx]: !prev[idx] }));

  const isEmpty = messages.length === 0 && !loading;

  if (initialising) return (
    <div className="layout">
      <Sidebar knowledgeBase={kb} conversations={[]} onNewChat={() => navigate(`/kb/${kbId}/chat`)} />
      <main className="chat-main" style={{ display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div className="spinner" />
      </main>
    </div>
  );

  return (
    <div className="layout">
      <Sidebar
        knowledgeBase={kb}
        conversations={conversations}
        currentConvId={conversationId}
        onNewChat={() => { setMessages([]); setConversationId(null); navigate(`/kb/${kbId}/chat`); }}
      />
      <main className="chat-main">
        {/* Empty state */}
        {isEmpty && (
          <div className="chat-empty">
            <div className="chat-empty-icon">{kb?.icon || "🧠"}</div>
            <h2>Ask anything about your documents</h2>
            <p>
              EchoMind searches through <strong>{kb?.documentCount} document{kb?.documentCount !== 1 ? "s" : ""}</strong> and
              cites exactly where each answer comes from.
            </p>
            <div className="starter-chips">
              {["Summarise the key points", "What are the main findings?", "Explain the methodology"].map((q) => (
                <button key={q} className="starter-chip" onClick={() => { setInput(q); inputRef.current?.focus(); }}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={`message-row ${msg.role}`}>
              <div className="msg-avatar">
                {msg.role === "user" ? "👤" : "🧠"}
              </div>
              <div className="msg-body">
                <div className={`msg-bubble ${msg.role}`}>
                  {msg.role === "assistant" ? (
                    <div className="markdown">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p>{msg.content}</p>
                  )}
                </div>

                {/* Sources */}
                {msg.sources?.length > 0 && (
                  <div className="sources">
                    <button className="sources-toggle" onClick={() => toggleSources(idx)}>
                      📎 {msg.sources.length} source{msg.sources.length > 1 ? "s" : ""} referenced
                      <span>{expandedSources[idx] ? " ▲" : " ▼"}</span>
                    </button>
                    {expandedSources[idx] && (
                      <div className="sources-list">
                        {msg.sources.map((s, si) => (
                          <div key={si} className="source-card">
                            <div className="source-header">
                              <span className="source-doc">📄 {s.documentName}</span>
                              {s.page && <span className="source-page">Page {s.page}</span>}
                              <span className="source-score">{Math.round(s.score * 100)}% match</span>
                            </div>
                            <p className="source-content">{s.content.slice(0, 200)}…</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {msg.tokensUsed > 0 && (
                  <div className="msg-meta">{msg.tokensUsed} tokens</div>
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="message-row assistant">
              <div className="msg-avatar">🧠</div>
              <div className="msg-body">
                <div className="msg-bubble assistant typing">
                  <span /><span /><span />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="chat-input-area">
          <div className="chat-input-wrap">
            <textarea
              ref={inputRef}
              className="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about your documents…"
              rows={1}
              disabled={loading}
            />
            <button
              className="send-btn"
              onClick={sendMessage}
              disabled={!input.trim() || loading}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22,2 15,22 11,13 2,9"/></svg>
            </button>
          </div>
          <p className="chat-hint">Enter to send · Shift+Enter for new line · AI cites sources automatically</p>
        </div>
      </main>
    </div>
  );
}
