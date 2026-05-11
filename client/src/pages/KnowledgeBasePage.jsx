import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../utils/api";
import toast from "react-hot-toast";
import Sidebar from "../components/Sidebar";
import "./KnowledgeBase.css";

const statusColor = { uploading:"var(--amber)", processing:"var(--primary)", ready:"var(--green)", error:"var(--red)" };
const statusLabel = { uploading:"Uploading", processing:"Processing", ready:"Ready", error:"Error" };

export default function KnowledgeBasePage() {
  const { kbId } = useParams();
  const navigate = useNavigate();
  const [kb, setKb] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    Promise.all([
      api.get(`/knowledge-bases/${kbId}`),
      api.get(`/chat/conversations/${kbId}`),
    ])
      .then(([kbRes, convRes]) => {
        setKb(kbRes.data.knowledgeBase);
        setDocuments(kbRes.data.documents);
        setConversations(convRes.data.conversations);
      })
      .catch(() => toast.error("Failed to load workspace."))
      .finally(() => setLoading(false));
  }, [kbId]);

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("knowledgeBaseId", kbId);

      setUploading(true);
      try {
        const { data } = await api.post("/documents/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setDocuments((prev) => [data.document, ...prev]);
        toast.success(`"${file.name}" uploaded — processing…`);

        // Poll until ready
        const poll = setInterval(async () => {
          try {
            const { data: docs } = await api.get(`/documents/${kbId}`);
            const updated = docs.documents.find((d) => d._id === data.document._id);
            if (updated && (updated.status === "ready" || updated.status === "error")) {
              clearInterval(poll);
              setDocuments(docs.documents);
              if (updated.status === "ready") toast.success(`"${file.name}" is ready to chat!`);
              else toast.error(`Processing failed: ${updated.errorMessage}`);
            }
          } catch {}
        }, 3000);
      } catch (err) {
        toast.error(err.response?.data?.error || `Upload failed for ${file.name}`);
      } finally {
        setUploading(false);
      }
    }
    fileRef.current.value = "";
  };

  const deleteDoc = async (docId, docName) => {
    if (!window.confirm(`Delete "${docName}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/documents/${docId}`);
      setDocuments((prev) => prev.filter((d) => d._id !== docId));
      toast.success("Document deleted.");
    } catch {
      toast.error("Failed to delete document.");
    }
  };

  const formatBytes = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) return (
    <div className="layout">
      <Sidebar />
      <main className="main" style={{ display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div className="spinner" />
      </main>
    </div>
  );

  return (
    <div className="layout">
      <Sidebar
        knowledgeBase={kb}
        conversations={conversations}
        onNewChat={() => navigate(`/kb/${kbId}/chat`)}
      />
      <main className="main">
        {/* Header */}
        <header className="page-header">
          <div style={{ display:"flex", alignItems:"center", gap:"0.75rem" }}>
            <span style={{ fontSize:"2rem" }}>{kb?.icon}</span>
            <div>
              <h1 className="page-title">{kb?.name}</h1>
              {kb?.description && <p className="page-sub">{kb.description}</p>}
            </div>
          </div>
          <button className="btn-primary" onClick={() => navigate(`/kb/${kbId}/chat`)}>
            💬 Start Chatting
          </button>
        </header>

        {/* Stats */}
        <div className="stats-row">
          <div className="stat-box">
            <div className="stat-val">{kb?.documentCount || 0}</div>
            <div className="stat-lbl">Documents</div>
          </div>
          <div className="stat-box">
            <div className="stat-val">{kb?.totalChunks || 0}</div>
            <div className="stat-lbl">Text Chunks</div>
          </div>
          <div className="stat-box">
            <div className="stat-val">{conversations.length}</div>
            <div className="stat-lbl">Conversations</div>
          </div>
        </div>

        {/* Upload zone */}
        <div className="upload-zone" onClick={() => fileRef.current.click()}>
          <input
            ref={fileRef} type="file" multiple hidden
            accept=".pdf,.txt,.md,.docx"
            onChange={handleUpload}
          />
          <div className="upload-icon">{uploading ? "⏳" : "📂"}</div>
          <div className="upload-title">{uploading ? "Uploading…" : "Upload documents"}</div>
          <div className="upload-sub">PDF, TXT, MD, DOCX · up to 20 MB each</div>
        </div>

        {/* Documents list */}
        <section className="docs-section">
          <h2 className="section-heading">Documents ({documents.length})</h2>
          {documents.length === 0 ? (
            <div className="empty-docs">No documents yet — upload some above to get started.</div>
          ) : (
            <div className="docs-list">
              {documents.map((doc) => (
                <div key={doc._id} className="doc-row">
                  <div className="doc-icon">{doc.type === "pdf" ? "📄" : doc.type === "docx" ? "📝" : "📃"}</div>
                  <div className="doc-info">
                    <div className="doc-name">{doc.name}</div>
                    <div className="doc-meta">
                      {formatBytes(doc.sizeBytes)}
                      {doc.pageCount && ` · ${doc.pageCount} pages`}
                      {doc.wordCount && ` · ${doc.wordCount.toLocaleString()} words`}
                      {doc.totalChunks > 0 && ` · ${doc.totalChunks} chunks`}
                    </div>
                  </div>
                  <span
                    className="doc-status"
                    style={{ color: statusColor[doc.status], background: `${statusColor[doc.status]}15` }}
                  >
                    {statusLabel[doc.status]}
                  </span>
                  <button className="doc-delete" onClick={() => deleteDoc(doc._id, doc.name)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3,6 5,6 21,6"/><path d="M19,6l-1,14H6L5,6"/><path d="M10,11v6M14,11v6"/><path d="M9,6V4h6v2"/></svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
