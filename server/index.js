require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
const connectDB = require("./utils/db");

const authRoutes = require("./routes/auth");
const documentRoutes = require("./routes/documents");
const chatRoutes = require("./routes/chat");
const knowledgeBaseRoutes = require("./routes/knowledgeBases");  // ← ADD THIS

const app = express();

app.use(helmet());
app.set('trust proxy', 1);
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false,
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/knowledge-bases", knowledgeBaseRoutes);  // ← ADD THIS

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error("❌ Error:", err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

const PORT = 5001;
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🧠 EchoMind server running on http://localhost:${PORT}`);
    console.log(`📦 Environment: ${process.env.NODE_ENV || "development"}\n`);
  });
});