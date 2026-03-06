const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const explainRoutes = require("./routes/explain");
const historyRoutes = require("./routes/history");
const aiRoutes = require("./routes/ai");
const { securityHeaders } = require("./middleware/securityHeaders");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandlers");

const app = express();

// Middleware
app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(securityHeaders);
app.use(express.json({ limit: "1mb" }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/explain", explainRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/ai", aiRoutes);

// Global route handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Server Start
const PORT = process.env.PORT || 5000;

async function startServer() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("Missing MONGO_URI or MONGODB_URI in environment");
  }

  try {
    new URL(mongoUri);
  } catch {
    throw new Error("Invalid Mongo URI format. Check scheme, special characters, and query string.");
  }

  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 10000
  });
  console.log("MongoDB Connected");

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err.message);
  process.exit(1);
});
