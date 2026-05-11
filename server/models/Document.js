const mongoose = require("mongoose");

const chunkSchema = new mongoose.Schema({
  content: { type: String, required: true },
  chunkIndex: { type: Number, required: true },
  page: { type: Number },
  termFreq: { type: Map, of: Number }, // stores BM25 term frequencies — no Pinecone needed
});

const documentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    originalName: { type: String, required: true },
    type: { type: String, enum: ["pdf", "txt", "md", "docx", "link"], required: true },
    url: { type: String },
    filePath: { type: String },
    sizeBytes: { type: Number, default: 0 },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    knowledgeBase: { type: mongoose.Schema.Types.ObjectId, ref: "KnowledgeBase", required: true },
    status: { type: String, enum: ["uploading", "processing", "ready", "error"], default: "uploading" },
    errorMessage: { type: String },
    chunks: [chunkSchema],
    totalChunks: { type: Number, default: 0 },
    pageCount: { type: Number },
    wordCount: { type: Number },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Document", documentSchema);
