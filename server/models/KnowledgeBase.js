const mongoose = require("mongoose");

const knowledgeBaseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 500 },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    color: { type: String, default: "#6366f1" },
    icon: { type: String, default: "🧠" },
    documentCount: { type: Number, default: 0 },
    totalChunks: { type: Number, default: 0 },
    isPublic: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("KnowledgeBase", knowledgeBaseSchema);
