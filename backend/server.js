require("dotenv").config();

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
  if (!process.env.MONGO_URI) {
    throw new Error("Missing MONGO_URI in environment");
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("MongoDB Connected");

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err.message);
  process.exit(1);
});
