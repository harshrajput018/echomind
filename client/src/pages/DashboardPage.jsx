import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import toast from "react-hot-toast";
import Sidebar from "../components/Sidebar";
import "./Dashboard.css";

const KB_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899"];
const KB_ICONS = ["🧠", "📚", "💼", "🔬", "📝", "🎯", "💡", "🗂️", "🌐"];

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [knowledgeBases, setKnowledgeBases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", color: "#6366f1", icon: "🧠" });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    api.get("/knowledge-bases")
      .then(({ data }) => setKnowledgeBases(data.knowledgeBases))
      .catch(() => toast.error("Failed to load workspaces."))
      .finally(() => setLoading(false));
  }, []);

  const createKB = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setCreating(true);
    try {
      const { data } = await api.post("/knowledge-bases", form);
      setKnowledgeBases((prev) => [data.knowledgeBase, ...prev]);
      setShowModal(false);
      setForm({ name: "", description: "", color: "#6366f1", icon: "🧠" });
      toast.success("Workspace created!");
      navigate(`/kb/${data.knowledgeBase._id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to create workspace.");
    } finally {
      setCreating(false);
    }
  };

  const deleteKB = async (id, name) => {
  if (!window.confirm(`Delete "${name}" and all its documents? This cannot be undone.`)) return;
  try {
    await api.delete(`/knowledge-bases/${id}`);
    setKnowledgeBases((prev) => prev.filter((kb) => kb._id !== id));
    toast.success("Workspace deleted.");
  } catch {
    toast.error("Failed to delete workspace.");
  }
};

  return (
    <div className="layout">
      <Sidebar />
      <main className="main">
        <header className="page-header">
          <div>
            <h1 className="page-title">Good morning, {user?.name?.split(" ")[0]} 👋</h1>
            <p className="page-sub">Your AI-powered knowledge workspaces</p>
          </div>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            + New Workspace
          </button>
        </header>

        {loading ? (
          <div className="loading-state"><div className="spinner" /></div>
        ) : knowledgeBases.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🧠</div>
            <h3>No workspaces yet</h3>
            <p>Create your first knowledge base to start chatting with your documents.</p>
            <button className="btn-primary" onClick={() => setShowModal(true)}>Create workspace</button>
          </div>
        ) : (
          <div className="kb-grid">
            {knowledgeBases.map((kb) => (
              <div key={kb._id} className="kb-card" onClick={() => navigate(`/kb/${kb._id}`)}>
                <div className="kb-card-icon" style={{ background: `${kb.color}15`, border: `2px solid ${kb.color}30` }}>
                  <span style={{ fontSize: "1.8rem" }}>{kb.icon}</span>
                </div>
                <div className="kb-card-body">
                  <h3 className="kb-card-name">{kb.name}</h3>
                  {kb.description && <p className="kb-card-desc">{kb.description}</p>}
                  <div className="kb-card-meta">
                    <span className="meta-chip">{kb.documentCount} docs</span>
                    <span className="meta-chip">{kb.totalChunks} chunks</span>
                  </div>
                </div>
                <div className="kb-card-arrow">→</div>
                <button
                  className="kb-delete-btn"
                  onClick={(e) => { e.stopPropagation(); deleteKB(kb._id, kb.name); }}
                  title="Delete workspace"
                >🗑️</button>
              </div>
            ))}
          </div>
        )}

        {/* Create modal */}
        {showModal && (
          <div className="modal-backdrop" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h2 className="modal-title">New Workspace</h2>
              <form onSubmit={createKB} className="modal-form">
                <div className="field">
                  <label>Name *</label>
                  <input
                    type="text" required maxLength={100}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Research Papers, Product Docs…"
                    autoFocus
                  />
                </div>
                <div className="field">
                  <label>Description</label>
                  <input
                    type="text" maxLength={500}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="What's in this workspace?"
                  />
                </div>
                <div className="field">
                  <label>Icon</label>
                  <div className="icon-picker">
                    {KB_ICONS.map((ic) => (
                      <button type="button" key={ic}
                        className={`icon-opt ${form.icon === ic ? "selected" : ""}`}
                        onClick={() => setForm({ ...form, icon: ic })}
                      >{ic}</button>
                    ))}
                  </div>
                </div>
                <div className="field">
                  <label>Color</label>
                  <div className="color-picker">
                    {KB_COLORS.map((c) => (
                      <button type="button" key={c}
                        className={`color-opt ${form.color === c ? "selected" : ""}`}
                        style={{ background: c }}
                        onClick={() => setForm({ ...form, color: c })}
                      />
                    ))}
                  </div>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={creating}>
                    {creating ? "Creating…" : "Create Workspace"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
