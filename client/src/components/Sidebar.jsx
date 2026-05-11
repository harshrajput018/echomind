import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Sidebar.css";

export default function Sidebar({ knowledgeBase, conversations, currentConvId, onNewChat }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <aside className="sidebar">
      {/* Logo */}
      <Link to="/dashboard" className="sidebar-logo">
        <span className="sidebar-logo-icon">🧠</span>
        <span className="sidebar-logo-text">EchoMind</span>
      </Link>

      {/* KB Info */}
      {knowledgeBase && (
        <div className="sidebar-kb">
          <span className="kb-icon" style={{ background: `${knowledgeBase.color}18`, border: `1.5px solid ${knowledgeBase.color}40` }}>
            {knowledgeBase.icon}
          </span>
          <div className="kb-info">
            <div className="kb-name">{knowledgeBase.name}</div>
            <div className="kb-meta">{knowledgeBase.documentCount} docs · {knowledgeBase.totalChunks} chunks</div>
          </div>
        </div>
      )}

      {/* New chat button */}
      {knowledgeBase && (
        <button className="new-chat-btn" onClick={onNewChat}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Chat
        </button>
      )}

      {/* Conversations */}
      {conversations?.length > 0 && (
        <div className="sidebar-section">
          <div className="sidebar-section-label">Chats</div>
          <div className="sidebar-convs">
            {conversations.map((c) => (
              <Link
                key={c._id}
                to={`/kb/${knowledgeBase?._id}/chat/${c._id}`}
                className={`conv-item ${currentConvId === c._id ? "active" : ""}`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                <span className="conv-title">{c.title || "Untitled"}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="sidebar-nav">
        <Link to="/dashboard" className={`nav-item ${location.pathname === "/dashboard" ? "active" : ""}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          All Workspaces
        </Link>
        {knowledgeBase && (
          <Link to={`/kb/${knowledgeBase._id}`} className={`nav-item ${location.pathname === `/kb/${knowledgeBase._id}` ? "active" : ""}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
            Documents
          </Link>
        )}
      </nav>

      {/* User */}
      <div className="sidebar-user">
        <div className="user-avatar">{user?.name?.[0]?.toUpperCase()}</div>
        <div className="user-info">
          <div className="user-name">{user?.name}</div>
          <div className="user-plan">{user?.plan} plan</div>
        </div>
        <button className="logout-btn" onClick={logout} title="Sign out">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        </button>
      </div>
    </aside>
  );
}
