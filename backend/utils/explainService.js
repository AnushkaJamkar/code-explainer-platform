const { analyzeJavaScript } = require("./codeAnalyzer");

function runAnalysis({ code, language }) {
  const normalizedLanguage = (language || "javascript").toLowerCase();
  const lines = code.split(/\r?\n/);

  const explanations = lines.map((line, index) => ({
    lineNumber: index + 1,
    code: line.trim() || "(empty line)",
    explanation: generateExplanation(line.trim(), normalizedLanguage)
  }));

  let analysisResult = {
    metrics: {},
    smells: [],
    flowNodes: []
  };

  if (normalizedLanguage === "javascript") {
    analysisResult = analyzeJavaScript(code);
  }

  const metrics = {
    totalLines: lines.length,
    ...(analysisResult.metrics || {})
  };

  const smells = Array.isArray(analysisResult.smells) ? analysisResult.smells : [];
  const flowNodes = Array.isArray(analysisResult.flowNodes) ? analysisResult.flowNodes : [];

  const aiSuggestions = {
    summary: generateSummary(metrics),
    refactoringHints: generateRefactorHints(smells, metrics),
    performanceTips: generatePerformanceTips(metrics)
  };

  return {
    language: normalizedLanguage,
    explanations,
    metrics,
    smells,
    flowNodes,
    aiSuggestions
  };
}

function generateExplanation(line, language) {
  if (!line) {
    return {
      what: "Empty line.",
      why: "Adds visual separation for readability.",
      impact: "No runtime impact."
    };
  }

  if (line.startsWith("//") || line.startsWith("#")) {
    return {
      what: "Comment statement.",
      why: "Documents intent and behavior.",
      impact: "Ignored by runtime."
    };
  }

  if (matches(line, [/^import\s/, /^from\s+['"]/, /^const\s+\w+\s*=\s*require\(/])) {
    return {
      what: "Dependency import.",
      why: "Pulls external module/functionality into this file.",
      impact: "Missing import can break runtime with undefined references."
    };
  }

  if (matches(line, [/^function\s+\w+/, /^\w+\s*=>\s*{?/, /^const\s+\w+\s*=\s*\(?.*\)?\s*=>/])) {
    return {
      what: "Function definition.",
      why: "Encapsulates reusable logic.",
      impact: "Changes here affect all call sites."
    };
  }

  if (matches(line, [/^if\s*\(/, /^else\b/, /^switch\s*\(/])) {
    return {
      what: "Branching control flow.",
      why: "Executes different logic based on conditions.",
      impact: "High impact on correctness and edge-case behavior."
    };
  }

  if (matches(line, [/^for\s*\(/, /^while\s*\(/, /^do\s*{/, /\.forEach\(/])) {
    return {
      what: "Iteration logic.",
      why: "Processes repeated items/actions.",
      impact: "Can affect time complexity and performance."
    };
  }

  if (matches(line, [/^return\b/])) {
    return {
      what: "Return statement.",
      why: "Ends current function and sends a value to caller.",
      impact: "Controls function output and execution path."
    };
  }

  if (matches(line, [/^try\s*{/, /^catch\s*\(/, /^finally\s*{/])) {
    return {
      what: "Error-handling block.",
      why: "Prevents crashes and handles exceptional cases.",
      impact: "Improves reliability and fault tolerance."
    };
  }

  if (language === "javascript" && matches(line, [/\b(async|await)\b/])) {
    return {
      what: "Asynchronous operation.",
      why: "Handles non-blocking tasks like I/O or API calls.",
      impact: "Incorrect use can cause race conditions or unhandled failures."
    };
  }

  if (matches(line, [/\b(const|let|var)\b/])) {
    return {
      what: "Variable declaration/assignment.",
      why: "Stores state used by other statements.",
      impact: "State mutations here influence downstream behavior."
    };
  }

  return {
    what: "General program statement.",
    why: "Contributes to business logic execution.",
    impact: "Removing/changing this line may alter output behavior."
  };
}

function generateSummary(metrics) {
  return `Code has ${metrics.functionCount || 0} function(s), ${metrics.loopCount || 0} loop(s), cyclomatic complexity ${metrics.cyclomaticComplexity || 1}, and estimated time complexity ${metrics.timeComplexity || "O(1)"}.`;
}

function generateRefactorHints(smells, metrics) {
  if (smells.length > 0) {
    return smells.map((smell) => `Refactor priority: ${smell}`);
  }

  const hints = [];
  if ((metrics.cyclomaticComplexity || 0) > 10) {
    hints.push("Split complex branches into smaller helper functions.");
  }
  if ((metrics.maxNestingDepth || 0) > 3) {
    hints.push("Use guard clauses to reduce deep nesting.");
  }

  return hints.length ? hints : ["Code structure looks reasonable."];
}

function generatePerformanceTips(metrics) {
  const tips = [];
  const complexity = String(metrics.timeComplexity || "").toLowerCase();

  if (complexity.includes("n^2")) {
    tips.push("Consider hash maps or early exits to reduce nested-loop cost.");
  }
  if ((metrics.loopCount || 0) > 3) {
    tips.push("Review loop bodies for repeated computations and cache results.");
  }
  if ((metrics.decisionCount || 0) > 10) {
    tips.push("Break conditional-heavy logic into composable functions.");
  }

  return tips.length ? tips : ["Performance looks acceptable for current structure."];
}

function matches(line, regexes) {
  return regexes.some((regex) => regex.test(line));
}

module.exports = {
  runAnalysis
};
