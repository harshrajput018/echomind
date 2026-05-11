const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { protect } = require("../middleware/auth");
const Document = require("../models/Document");
const KnowledgeBase = require("../models/KnowledgeBase");
const { extractText } = require("../utils/extractText");
const { splitIntoChunks, processChunks } = require("../utils/rag");

// ── Multer config ─────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "../uploads", req.user._id.toString());
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = [
    "application/pdf", "text/plain", "text/markdown",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Only PDF, TXT, MD, DOCX files allowed."), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB) || 20) * 1024 * 1024 },
});

// ── POST /api/documents/upload ────────────────────────────────────────
router.post("/upload", protect, upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded." });
  const { knowledgeBaseId } = req.body;
  if (!knowledgeBaseId) return res.status(400).json({ error: "knowledgeBaseId required." });

  try {
    const kb = await KnowledgeBase.findOne({ _id: knowledgeBaseId, owner: req.user._id });
    if (!kb) return res.status(404).json({ error: "Knowledge base not found." });

    const doc = await Document.create({
      name: req.file.originalname,
      originalName: req.file.originalname,
      type: req.file.mimetype === "application/pdf" ? "pdf"
        : req.file.mimetype.includes("word") ? "docx" : "txt",
      filePath: req.file.path,
      sizeBytes: req.file.size,
      owner: req.user._id,
      knowledgeBase: kb._id,
      status: "processing",
    });

    // Respond immediately — process in background
    res.status(201).json({ document: doc, message: "File received — processing started." });

    // Extract text
    const { text, pageCount, wordCount } = await extractText(req.file.path, req.file.mimetype);

    // Split into chunks
    const rawChunks = splitIntoChunks(text);

    // Pre-compute BM25 term frequencies (stored in MongoDB — no Pinecone!)
    const chunkRecords = processChunks(rawChunks);

    // Save to document
    doc.status = "ready";
    doc.chunks = chunkRecords;
    doc.totalChunks = chunkRecords.length;
    doc.pageCount = pageCount;
    doc.wordCount = wordCount;
    await doc.save();

    // Update KB counters
    kb.documentCount += 1;
    kb.totalChunks += chunkRecords.length;
    await kb.save();
  } catch (err) {
    console.error("Document processing error:", err);
    await Document.findByIdAndUpdate(req.body?.docId, {
      status: "error", errorMessage: err.message,
    }).catch(() => {});
  }
});

// ── GET /api/documents/:kbId ──────────────────────────────────────────
router.get("/:kbId", protect, async (req, res) => {
  try {
    const docs = await Document.find({
      knowledgeBase: req.params.kbId,
      owner: req.user._id,
    }).select("-chunks").sort({ createdAt: -1 });
    res.json({ documents: docs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/documents/:id ─────────────────────────────────────────
router.delete("/:id", protect, async (req, res) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, owner: req.user._id });
    if (!doc) return res.status(404).json({ error: "Document not found." });

    await KnowledgeBase.findByIdAndUpdate(doc.knowledgeBase, {
      $inc: { documentCount: -1, totalChunks: -doc.totalChunks },
    });

    if (doc.filePath && fs.existsSync(doc.filePath)) fs.unlinkSync(doc.filePath);
    await doc.deleteOne();
    res.json({ message: "Document deleted." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
