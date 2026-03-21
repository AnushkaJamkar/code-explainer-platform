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

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
  });
});

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

function getMongoUriCandidates() {
  return [
    process.env.MONGO_URI,
    process.env.MONGODB_URI,
    process.env.MONGO_DIRECT_URI
  ].filter(Boolean);
}

function isMongoUriValid(mongoUri) {
  return typeof mongoUri === "string" &&
    /^(mongodb(\+srv)?):\/\/.+/i.test(mongoUri.trim());
}

async function connectToDatabase() {
  const mongoUris = getMongoUriCandidates();

  if (!mongoUris.length) {
    console.warn("MongoDB connection skipped: MONGO_URI/MONGODB_URI is not configured.");
    return false;
  }

  for (const mongoUri of mongoUris) {
    if (!isMongoUriValid(mongoUri)) {
      console.warn("Skipping invalid Mongo URI format.");
      continue;
    }

    try {
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 10000
      });
      console.log("MongoDB Connected");
      return true;
    } catch (error) {
      console.warn(`MongoDB connection attempt failed: ${error.message}`);
    }
  }

  return false;
}

async function startServer() {
  const dbConnected = await connectToDatabase();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}${dbConnected ? "" : " (database offline mode)"}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err.message);
  process.exit(1);
});
