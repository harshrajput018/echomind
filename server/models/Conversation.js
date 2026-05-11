const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ["user", "assistant"], required: true },
  content: { type: String, required: true },
  sources: [
    {
      documentId: { type: mongoose.Schema.Types.ObjectId, ref: "Document" },
      documentName: String,
      content: String,
      page: Number,
      chunkIndex: Number,
      score: Number, // similarity score from Pinecone
    },
  ],
  tokensUsed: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

const conversationSchema = new mongoose.Schema(
  {
    title: { type: String, default: "New Chat" },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    knowledgeBase: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "KnowledgeBase",
      required: true,
    },
    messages: [messageSchema],
    totalTokensUsed: { type: Number, default: 0 },
    isPinned: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Conversation", conversationSchema);
