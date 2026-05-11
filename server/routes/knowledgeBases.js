const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const KnowledgeBase = require("../models/KnowledgeBase");
const Document = require("../models/Document");
const Conversation = require("../models/Conversation");

// GET /api/knowledge-bases — list user's KBs
router.get("/", protect, async (req, res) => {
  try {
    const kbs = await KnowledgeBase.find({ owner: req.user._id }).sort({ updatedAt: -1 });
    res.json({ knowledgeBases: kbs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/knowledge-bases — create a KB
router.post("/", protect, async (req, res) => {
  const { name, description, color, icon } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required." });
  try {
    const kb = await KnowledgeBase.create({
      name, description, color, icon,
      owner: req.user._id,
    });
    res.status(201).json({ knowledgeBase: kb });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/knowledge-bases/:id
router.get("/:id", protect, async (req, res) => {
  try {
    const kb = await KnowledgeBase.findOne({ _id: req.params.id, owner: req.user._id });
    if (!kb) return res.status(404).json({ error: "Knowledge base not found." });
    const documents = await Document.find({ knowledgeBase: kb._id }).select("-chunks");
    res.json({ knowledgeBase: kb, documents });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/knowledge-bases/:id
router.put("/:id", protect, async (req, res) => {
  try {
    const kb = await KnowledgeBase.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!kb) return res.status(404).json({ error: "Knowledge base not found." });
    res.json({ knowledgeBase: kb });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/knowledge-bases/:id
router.delete("/:id", protect, async (req, res) => {
  try {
    const kb = await KnowledgeBase.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!kb) return res.status(404).json({ error: "Knowledge base not found." });
    await Document.deleteMany({ knowledgeBase: kb._id });
    await Conversation.deleteMany({ knowledgeBase: kb._id });
    res.json({ message: "Knowledge base deleted." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
