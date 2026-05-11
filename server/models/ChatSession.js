const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ["user", "assistant"],
    required: true,
  },
  content: { type: String, required: true },
  sources: [
    {
      documentId: { type: mongoose.Schema.Types.ObjectId, ref: "Document" },
      documentTitle: String,
      chunkContent: String,
      chunkIndex: Number,
      score: Number, // Similarity score from Pinecone
    },
  ],
  tokensUsed: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

const chatSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      default: "New Chat",
      maxlength: [120, "Title cannot exceed 120 characters"],
    },
    messages: [messageSchema],
    totalTokensUsed: { type: Number, default: 0 },
    documentScope: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Document",
      },
    ], // If empty = search all user docs
    isPinned: { type: Boolean, default: false },
  },
  { timestamps: true }
);

chatSessionSchema.index({ user: 1, updatedAt: -1 });

module.exports = mongoose.model("ChatSession", chatSessionSchema);
