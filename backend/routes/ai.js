const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { createRateLimiter } = require("../middleware/rateLimit");

const AI_PROVIDER = process.env.AI_PROVIDER || "mock";
const AI_API_URL = process.env.AI_API_URL || "https://openrouter.ai/api/v1/chat/completions";
const AI_MODEL = process.env.AI_MODEL || "meta-llama/llama-3.1-8b-instruct:free";
const AI_API_KEY = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || "";
const aiLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 15,
  message: "Too many AI requests. Please wait a minute and retry."
});

router.post("/tutor", authMiddleware, aiLimiter, async (req, res) => {
  try {
    const {
      question,
      code,
      language,
      metrics,
      smells,
      explanations
    } = req.body || {};

    if (!question || typeof question !== "string") {
      return res.status(400).json({ message: "Question is required" });
    }

    const tutorPayload = {
      question: question.slice(0, 1000),
      language: language || "javascript",
      metrics: metrics || {},
      smells: Array.isArray(smells) ? smells : [],
      explanations: Array.isArray(explanations) ? explanations.slice(0, 120) : [],
      code: typeof code === "string" ? code.slice(0, 12000) : ""
    };

    if (AI_PROVIDER === "mock" || !AI_API_KEY) {
      return res.json({
        provider: "mock",
        model: "heuristic-tutor-v1",
        tutor: buildMockTutorReply(tutorPayload)
      });
    }

    const systemPrompt = [
      "You are a patient programming tutor for beginner-to-intermediate students.",
      "Return ONLY valid JSON.",
      "Do not include markdown code fences or extra text.",
      "Be precise, concise, and pedagogical."
    ].join(" ");

    const userPrompt = [
      "Create a JSON object with this exact shape:",
      "{",
      '  "directAnswer": "string",',
      '  "stepByStep": ["string"],',
      '  "codeWalkthrough": "string",',
      '  "commonMistake": "string",',
      '  "hint": "string",',
      '  "practiceTask": "string",',
      '  "difficulty": "Easy|Medium|Hard"',
      "}",
      "Use the submitted question and code context to produce practical guidance.",
      "Tutor context JSON:",
      JSON.stringify(tutorPayload)
    ].join("\n");

    const response = await fetchAiModel(systemPrompt, userPrompt);

    if (!response.ok) {
      return res.status(response.status).json({
        message: response.message || "Failed to generate tutor response",
        provider: AI_PROVIDER
      });
    }

    return res.json({
      provider: AI_PROVIDER,
      model: AI_MODEL,
      tutor: response.data
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to generate tutor response",
      error: error.message
    });
  }
});

router.post("/insights", authMiddleware, aiLimiter, async (req, res) => {
  try {
    const { code, language, metrics, smells, explanations } = req.body || {};

    if (!code || typeof code !== "string") {
      return res.status(400).json({ message: "Code is required" });
    }

    const analysisPayload = {
      language: language || "javascript",
      metrics: metrics || {},
      smells: Array.isArray(smells) ? smells : [],
      explanations: Array.isArray(explanations) ? explanations.slice(0, 120) : [],
      code: code.slice(0, 12000)
    };

    if (AI_PROVIDER === "mock" || !AI_API_KEY) {
      return res.json({
        provider: "mock",
        model: "heuristic-v1",
        insights: buildMockInsights(analysisPayload)
      });
    }

    const systemPrompt = [
      "You are a senior software reviewer.",
      "Return ONLY valid JSON.",
      "Do not include markdown fences or extra text.",
      "Analyze the submitted code and produce practical, specific, implementation-focused guidance."
    ].join(" ");

    const userPrompt = [
      "Create a JSON object with this exact shape:",
      "{",
      '  "overview": "string",',
      '  "riskLevel": "Low|Moderate|High",',
      '  "codeSmells": [',
      "    {",
      '      "name": "string",',
      '      "severity": "Low|Moderate|High",',
      '      "evidence": "string",',
      '      "explanation": "string",',
      '      "impact": "string",',
      '      "fix": "string"',
      "    }",
      "  ],",
      '  "refactoringSuggestions": [',
      "    {",
      '      "title": "string",',
      '      "why": "string",',
      '      "steps": ["string"],',
      '      "examplePatch": "string",',
      '      "expectedOutcome": "string"',
      "    }",
      "  ],",
      '  "quickWins": ["string"],',
      '  "nextLearningSteps": ["string"]',
      "}",
      "Use concrete references to the input code behavior where possible.",
      "Input analysis context JSON:",
      JSON.stringify(analysisPayload)
    ].join("\n");

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${AI_API_KEY}`
    };

    if (process.env.OPENROUTER_SITE_URL) {
      headers["HTTP-Referer"] = process.env.OPENROUTER_SITE_URL;
    }
    if (process.env.OPENROUTER_APP_NAME) {
      headers["X-Title"] = process.env.OPENROUTER_APP_NAME;
    }

    const response = await fetchAiModel(systemPrompt, userPrompt);
    if (!response.ok) {
      return res.status(response.status).json({
        message: response.message || "Failed to generate AI insights",
        provider: AI_PROVIDER
      });
    }

    return res.json({
      provider: AI_PROVIDER,
      model: AI_MODEL,
      insights: response.data
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to generate AI insights",
      error: error.message
    });
  }
});

async function fetchAiModel(systemPrompt, userPrompt) {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${AI_API_KEY}`
  };

  if (process.env.OPENROUTER_SITE_URL) {
    headers["HTTP-Referer"] = process.env.OPENROUTER_SITE_URL;
  }
  if (process.env.OPENROUTER_APP_NAME) {
    headers["X-Title"] = process.env.OPENROUTER_APP_NAME;
  }

  const response = await fetch(AI_API_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: AI_MODEL,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ]
    })
  });

  const raw = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      message: raw?.error?.message || raw?.message || "AI provider request failed"
    };
  }

  const content = raw?.choices?.[0]?.message?.content || "";
  const parsed = parseJsonFromModel(content);
  if (!parsed) {
    return {
      ok: false,
      status: 502,
      message: "AI returned malformed JSON"
    };
  }

  return {
    ok: true,
    status: 200,
    data: parsed
  };
}

function buildMockInsights(payload) {
  const metrics = payload.metrics || {};
  const sourceSmells = Array.isArray(payload.smells) ? payload.smells : [];
  const maintainability = Number(metrics.maintainabilityScore || 0);
  const complexity = Number(metrics.cyclomaticComplexity || 1);
  const nesting = Number(metrics.maxNestingDepth || 0);

  const riskLevel =
    maintainability < 50 || complexity > 12 || nesting > 4
      ? "High"
      : maintainability < 80 || complexity > 7 || nesting > 2
        ? "Moderate"
        : "Low";

  const smellEntries = sourceSmells.length
    ? sourceSmells.map((smell) => ({
      name: smell,
      severity: riskLevel,
      evidence: "Detected by static analysis metrics and heuristic scan.",
      explanation: `This pattern can reduce readability and maintainability: ${smell}.`,
      impact: "Can increase debugging time and future change risk.",
      fix: "Extract smaller functions, simplify branches, and remove duplicated logic."
    }))
    : [
      {
        name: "Complexity Hotspot",
        severity: riskLevel,
        evidence: `Cyclomatic complexity: ${complexity}, nesting depth: ${nesting}.`,
        explanation: "Higher branching and nesting make logic harder to follow.",
        impact: "Harder testing and more regression risk during changes.",
        fix: "Break logic into smaller pure functions and flatten nested conditions."
      }
    ];

  return {
    overview:
      `This project analysis indicates ${riskLevel.toLowerCase()} risk with ` +
      `${complexity} cyclomatic complexity and maintainability score ${maintainability}.`,
    riskLevel,
    codeSmells: smellEntries,
    refactoringSuggestions: [
      {
        title: "Extract Complex Blocks",
        why: "Smaller focused functions improve readability and testability.",
        steps: [
          "Identify branches/loops with multiple responsibilities.",
          "Move each responsibility into a named helper function.",
          "Keep the main workflow function linear and descriptive."
        ],
        examplePatch:
          "Before: one large function with nested if/loop blocks\n" +
          "After: validateInput(), computeResult(), formatResponse() called in sequence",
        expectedOutcome: "Lower complexity, easier testing, and safer future changes."
      },
      {
        title: "Guard Clauses for Early Exit",
        why: "Reduces nesting depth and clarifies failure conditions.",
        steps: [
          "Check invalid input at the top of function.",
          "Return early for error cases.",
          "Keep happy-path logic at root indentation."
        ],
        examplePatch:
          "Replace nested if-else trees with top-level returns for invalid states.",
        expectedOutcome: "Cleaner control flow and faster code review/debugging."
      }
    ],
    quickWins: [
      "Add descriptive names for helper functions around core logic.",
      "Add 2-3 tests around highest-complexity branch paths.",
      "Avoid deep nesting by returning early on invalid states."
    ],
    nextLearningSteps: [
      "Practice refactoring one 30+ line function into 3 small functions.",
      "Write branch-focused unit tests for condition-heavy code paths.",
      "Study cyclomatic complexity and maintainability trade-offs."
    ]
  };
}

function buildMockTutorReply(payload) {
  const complexity = Number(payload.metrics?.cyclomaticComplexity || 1);
  const difficulty = complexity > 10 ? "Hard" : complexity > 5 ? "Medium" : "Easy";
  const language = payload.language || "javascript";

  return {
    directAnswer:
      `For ${language}, focus on understanding control flow and function boundaries first. ` +
      `Your question is best solved by tracing input -> branch conditions -> output.`,
    stepByStep: [
      "Read the function signature and identify inputs.",
      "Trace each condition in order and note when execution returns early.",
      "Follow loops with one small example input manually.",
      "Check where values are mutated before final return."
    ],
    codeWalkthrough:
      "Start from the first executable line, mark state changes after each conditional/loop, and compare that trace to the expected behavior from your question.",
    commonMistake:
      "Trying to understand the whole file at once instead of tracing one path through the code.",
    hint:
      "Pick one test input and write the variable values after each major block.",
    practiceTask:
      "Refactor one nested conditional into guard clauses and verify behavior stays the same.",
    difficulty
  };
}

function parseJsonFromModel(content) {
  if (!content || typeof content !== "string") return null;

  try {
    return JSON.parse(content);
  } catch (error) {
    const start = content.indexOf("{");
    const end = content.lastIndexOf("}");

    if (start >= 0 && end > start) {
      const slice = content.slice(start, end + 1);
      try {
        return JSON.parse(slice);
      } catch (innerError) {
        return null;
      }
    }

    return null;
  }
}

module.exports = router;
