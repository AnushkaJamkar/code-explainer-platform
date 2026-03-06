let currentAnalysisResult = null;

document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  const raw = sessionStorage.getItem("analysisResult");
  if (!raw) {
    showFallback("No analysis data found. Run a new analysis from the dashboard.");
    setupExportButton();
    return;
  }

  let result;
  try {
    result = JSON.parse(raw);
  } catch (error) {
    showFallback("Analysis data is invalid. Run a new analysis.");
    setupExportButton();
    return;
  }

  currentAnalysisResult = result;

  renderMetrics(result.metrics || {});
  renderSmells(result.smells || []);
  renderSuggestions(result.aiSuggestions || {});
  renderExplanations(result.explanations || []);
  renderRadarChart(result.metrics || {});
  renderFlowchart(result.flowNodes || []);
  renderHealth(result.metrics || {});
  setupExportButton();
});

function setupExportButton() {
  const exportBtn = document.getElementById("exportPdfBtn");
  if (!exportBtn) return;

  exportBtn.addEventListener("click", exportAnalysisPdf);
}

function exportAnalysisPdf() {
  if (!currentAnalysisResult) {
    alert("No analysis data available to export.");
    return;
  }

  const jsPdfCtor = window.jspdf?.jsPDF || window.jsPDF;
  if (!jsPdfCtor) {
    alert("PDF library not loaded. Please refresh and try again.");
    return;
  }

  const result = currentAnalysisResult;
  const metrics = result.metrics || {};
  const aiSuggestions = result.aiSuggestions || {};
  const smells = Array.isArray(result.smells) ? result.smells : [];
  const explanations = Array.isArray(result.explanations) ? result.explanations : [];

  const doc = new jsPdfCtor({ unit: "mm", format: "a4" });
  const marginX = 12;
  const maxWidth = 186;
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = 12;

  const ensureSpace = (lineCount = 1) => {
    const needed = lineCount * 5 + 2;
    if (y + needed > pageHeight - 12) {
      doc.addPage();
      y = 12;
    }
  };

  const addHeading = (text) => {
    ensureSpace(2);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(text, marginX, y);
    y += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
  };

  const addParagraph = (text = "") => {
    const safe = normalizePdfText(text);
    const wrapped = doc.splitTextToSize(safe, maxWidth);
    ensureSpace(wrapped.length);
    doc.text(wrapped, marginX, y);
    y += wrapped.length * 5 + 1;
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Code Analysis Report", marginX, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, marginX, y);
  y += 8;

  addHeading("Metrics");
  addParagraph(`Language: ${result.language || "unknown"}`);
  addParagraph(`Total Lines: ${metrics.totalLines ?? 0}`);
  addParagraph(`Functions: ${metrics.functionCount ?? 0}`);
  addParagraph(`Loops: ${metrics.loopCount ?? 0}`);
  addParagraph(`Decisions: ${metrics.decisionCount ?? 0}`);
  addParagraph(`Cyclomatic Complexity: ${metrics.cyclomaticComplexity ?? 1}`);
  addParagraph(`Max Nesting Depth: ${metrics.maxNestingDepth ?? 0}`);
  addParagraph(`Maintainability Score: ${metrics.maintainabilityScore ?? 0}`);
  addParagraph(`Risk Level: ${metrics.riskLevel || inferRisk(metrics.maintainabilityScore ?? 0)}`);
  addParagraph(`Time Complexity: ${metrics.timeComplexity || "O(1)"}`);

  addHeading("Code Smells");
  if (smells.length === 0) {
    addParagraph("No major code smells detected.");
  } else {
    smells.forEach((smell, index) => addParagraph(`${index + 1}. ${smell}`));
  }

  addHeading("AI Suggestions");
  addParagraph(`Summary: ${aiSuggestions.summary || "No summary available."}`);

  addParagraph("Refactoring Hints:");
  const refHints = Array.isArray(aiSuggestions.refactoringHints)
    ? aiSuggestions.refactoringHints
    : ["No refactoring hints available."];
  refHints.forEach((hint, index) => addParagraph(`- ${index + 1}. ${hint}`));

  addParagraph("Performance Tips:");
  const perfTips = Array.isArray(aiSuggestions.performanceTips)
    ? aiSuggestions.performanceTips
    : ["No performance tips available."];
  perfTips.forEach((tip, index) => addParagraph(`- ${index + 1}. ${tip}`));

  addHeading("Line-by-Line Explanation");
  if (explanations.length === 0) {
    addParagraph("No line-by-line explanation available.");
  } else {
    explanations.forEach((item) => {
      addParagraph(`Line ${item.lineNumber || "?"}: ${item.code || ""}`);
      addParagraph(`What: ${item.explanation?.what || "No details"}`);
      addParagraph(`Why: ${item.explanation?.why || "No details"}`);
      addParagraph(`Impact: ${item.explanation?.impact || "No details"}`);
      y += 1;
    });
  }

  const dateStamp = new Date().toISOString().slice(0, 10);
  doc.save(`code-analysis-${dateStamp}.pdf`);
}

function normalizePdfText(value) {
  return String(value)
    .replace(/\r\n/g, "\n")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function showFallback(message) {
  const explanation = document.getElementById("explanation");
  if (!explanation) return;
  explanation.innerHTML = "";

  const p = document.createElement("p");
  p.textContent = message;
  explanation.appendChild(p);
}

function renderMetrics(metrics) {
  setText("metricLines", metrics.totalLines ?? 0);
  setText("metricFunctions", metrics.functionCount ?? 0);
  setText("metricLoops", metrics.loopCount ?? 0);
  setText("metricDecisions", metrics.decisionCount ?? 0);
  setText("metricComplexity", metrics.cyclomaticComplexity ?? 1);
  setText("metricNesting", metrics.maxNestingDepth ?? 0);
  setText("metricMaintainability", metrics.maintainabilityScore ?? 0);
  setText("metricTime", metrics.timeComplexity || "O(1)");
}

function renderSmells(smells) {
  const list = document.getElementById("smellsList");
  if (!list) return;
  list.innerHTML = "";

  if (!Array.isArray(smells) || smells.length === 0) {
    appendListItem(list, "No major code smells detected.");
    return;
  }

  smells.forEach((smell) => appendListItem(list, smell));
}

function renderSuggestions(aiSuggestions) {
  setText("summaryText", aiSuggestions.summary || "No summary available.");

  const refactorList = document.getElementById("refactorList");
  if (refactorList) {
    refactorList.innerHTML = "";
    const hints = Array.isArray(aiSuggestions.refactoringHints)
      ? aiSuggestions.refactoringHints
      : ["No refactoring hints available."];
    hints.forEach((hint) => appendListItem(refactorList, hint));
  }

  const performanceList = document.getElementById("performanceList");
  if (performanceList) {
    performanceList.innerHTML = "";
    const tips = Array.isArray(aiSuggestions.performanceTips)
      ? aiSuggestions.performanceTips
      : ["No performance tips available."];
    tips.forEach((tip) => appendListItem(performanceList, tip));
  }
}

function renderExplanations(explanations) {
  const container = document.getElementById("explanation");
  if (!container) return;
  container.innerHTML = "";

  if (!Array.isArray(explanations) || explanations.length === 0) {
    const p = document.createElement("p");
    p.textContent = "No line-by-line explanation available.";
    container.appendChild(p);
    return;
  }

  explanations.forEach((item) => {
    const card = document.createElement("div");
    card.className = "history-card";

    const what = item.explanation?.what || "No details";
    const why = item.explanation?.why || "No details";
    const impact = item.explanation?.impact || "No details";

    card.innerHTML = `
      <div class="history-top">
        <strong>Line ${item.lineNumber}</strong>
      </div>
      <div><code>${escapeHtml(item.code || "")}</code></div>
      <p><strong>What:</strong> ${escapeHtml(what)}</p>
      <p><strong>Why:</strong> ${escapeHtml(why)}</p>
      <p><strong>Impact:</strong> ${escapeHtml(impact)}</p>
    `;

    container.appendChild(card);
  });
}

function renderRadarChart(metrics) {
  const canvas = document.getElementById("radarChart");
  if (!canvas || typeof Chart === "undefined") return;

  const maintainability = clamp(metrics.maintainabilityScore ?? 0, 0, 100);
  const complexityPenalty = 100 - clamp((metrics.cyclomaticComplexity ?? 1) * 10, 0, 100);
  const nestingPenalty = 100 - clamp((metrics.maxNestingDepth ?? 0) * 12, 0, 100);
  const decisionPenalty = 100 - clamp((metrics.decisionCount ?? 0) * 8, 0, 100);

  const ctx = canvas.getContext("2d");
  new Chart(ctx, {
    type: "radar",
    data: {
      labels: ["Maintainability", "Complexity", "Nesting", "Decisions"],
      datasets: [
        {
          label: "Code Health",
          data: [maintainability, complexityPenalty, nestingPenalty, decisionPenalty],
          backgroundColor: "rgba(124,124,255,0.2)",
          borderColor: "rgba(124,124,255,1)",
          pointBackgroundColor: "rgba(168,85,247,1)"
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          labels: {
            color: "#f1f3ff"
          }
        }
      },
      scales: {
        r: {
          min: 0,
          max: 100,
          ticks: { display: false },
          pointLabels: { color: "#e4e7ff" },
          grid: { color: "rgba(255,255,255,0.2)" },
          angleLines: { color: "rgba(255,255,255,0.15)" }
        }
      }
    }
  });
}

function renderFlowchart(flowNodes) {
  const flowchart = document.getElementById("flowchart");
  if (!flowchart) return;

  if (!Array.isArray(flowNodes) || flowNodes.length === 0) {
    flowchart.textContent = "No flowchart data available.";
    return;
  }

  const nodes = flowNodes.slice(0, 30);
  const lines = ["flowchart TD", "n0([Start])"];

  nodes.forEach((node, index) => {
    const currentId = `n${index + 1}`;
    const previousId = `n${index}`;
    const label = sanitizeFlowLabel(node.label || node.type || "Step");
    lines.push(`${currentId}[${label}]`);
    lines.push(`${previousId} --> ${currentId}`);
  });

  const endId = `n${nodes.length + 1}`;
  lines.push(`${endId}([End])`);
  lines.push(`n${nodes.length} --> ${endId}`);

  const graph = lines.join("\n");

  if (typeof mermaid === "undefined") {
    flowchart.textContent = "Flowchart renderer not available.";
    return;
  }

  const id = `flowchart-${Date.now()}`;
  mermaid
    .render(id, graph)
    .then(({ svg }) => {
      flowchart.innerHTML = svg;
    })
    .catch(() => {
      flowchart.textContent = "Unable to render flowchart.";
    });
}

function renderHealth(metrics) {
  const maintainability = clamp(metrics.maintainabilityScore ?? 0, 0, 100);
  const fill = document.getElementById("complexityFill");
  const label = document.getElementById("complexityLabel");
  const verdict = document.getElementById("healthVerdict");

  if (fill) {
    fill.style.width = `${maintainability}%`;
    if (maintainability >= 80) {
      fill.style.background = "#22c55e";
    } else if (maintainability >= 50) {
      fill.style.background = "#facc15";
    } else {
      fill.style.background = "#ef4444";
    }
  }

  const risk = metrics.riskLevel || inferRisk(maintainability);
  if (label) label.textContent = `Maintainability: ${maintainability}/100 (${risk} Risk)`;

  if (verdict) {
    if (maintainability >= 80) {
      verdict.textContent = "Code structure is healthy and easier to maintain.";
    } else if (maintainability >= 50) {
      verdict.textContent = "Code is acceptable but should be improved for long-term maintenance.";
    } else {
      verdict.textContent = "Code has high maintenance risk and should be refactored.";
    }
  }
}

function inferRisk(score) {
  if (score < 50) return "High";
  if (score < 80) return "Moderate";
  return "Low";
}

function appendListItem(list, text) {
  const li = document.createElement("li");
  li.textContent = text;
  list.appendChild(li);
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = String(value);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function sanitizeFlowLabel(input) {
  return String(input)
    .replace(/[\[\]{}()<>]/g, "")
    .replace(/"/g, "'")
    .replace(/\n/g, " ")
    .slice(0, 60);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
