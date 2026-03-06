const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const CodeHistory = require("../models/CodeHistory");
const { runAnalysis } = require("../utils/explainService");
const { createRateLimiter } = require("../middleware/rateLimit");
const { createHttpError } = require("../utils/httpError");

const explainLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 20,
  message: "Too many analyze requests. Please wait a minute and retry."
});

router.post("/", authMiddleware, explainLimiter, async (req, res, next) => {
  try {
    const { code, language } = req.body;

    if (!code || typeof code !== "string") {
      return next(createHttpError(400, "Code is required"));
    }

    if (code.length > 100000) {
      return next(createHttpError(413, "Code payload too large"));
    }

    const analysis = runAnalysis({ code, language });

    const historyEntry = await CodeHistory.create({
      user: req.user,
      code,
      language: analysis.language,
      metrics: analysis.metrics,
      smells: analysis.smells,
      flowNodes: analysis.flowNodes,
      aiSuggestions: analysis.aiSuggestions
    });

    return res.json({
      id: historyEntry._id,
      createdAt: historyEntry.createdAt,
      language: analysis.language,
      explanations: analysis.explanations,
      metrics: analysis.metrics,
      smells: analysis.smells,
      aiSuggestions: analysis.aiSuggestions,
      flowNodes: analysis.flowNodes
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;

