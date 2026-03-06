document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  const refreshBtn = document.getElementById("refreshInsightsBtn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", loadInsights);
  }

  loadInsights();
});

async function loadInsights() {
  const token = localStorage.getItem("token");
  const statusEl = document.getElementById("aiStatus");
  const raw = sessionStorage.getItem("analysisResult");

  if (!raw) {
    setStatus("No analysis data found. Run analysis first.", true);
    return;
  }

  let analysisResult;
  try {
    analysisResult = JSON.parse(raw);
  } catch (error) {
    setStatus("Analysis data is invalid. Run analysis again.", true);
    return;
  }

  setStatus("Generating structured AI insights...", false);
  clearSections();

  const fallbackCode = Array.isArray(analysisResult.explanations)
    ? analysisResult.explanations.map((item) => item.code || "").join("\n")
    : "";
  const codeForAi = analysisResult.code || fallbackCode;

  try {
    const response = await apiFetch("/api/ai/insights", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        code: codeForAi,
        language: analysisResult.language,
        metrics: analysisResult.metrics,
        smells: analysisResult.smells,
        explanations: analysisResult.explanations
      })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || "Failed to generate AI insights");
    }

    renderInsights(data.insights || {});
    const rawJson = document.getElementById("rawJsonOutput");
    if (rawJson) {
      rawJson.textContent = JSON.stringify(data.insights || {}, null, 2);
    }

    setStatus(`AI insights ready (${data.model || "model"}).`, false);
    if (statusEl) statusEl.style.color = "#cbd5ff";
  } catch (error) {
    setStatus(error.message || "Unable to load AI insights.", true);
  }
}

function renderInsights(insights) {
  const overviewText = document.getElementById("overviewText");
  const riskText = document.getElementById("riskText");

  if (overviewText) {
    overviewText.textContent = insights.overview || "No overview returned.";
  }

  if (riskText) {
    riskText.textContent = `Risk Level: ${insights.riskLevel || "Unknown"}`;
  }

  renderSmellInsights(Array.isArray(insights.codeSmells) ? insights.codeSmells : []);
  renderRefactoringInsights(Array.isArray(insights.refactoringSuggestions) ? insights.refactoringSuggestions : []);
  renderSimpleList("quickWinsList", Array.isArray(insights.quickWins) ? insights.quickWins : []);
  renderSimpleList("learningStepsList", Array.isArray(insights.nextLearningSteps) ? insights.nextLearningSteps : []);
}

function renderSmellInsights(smells) {
  const container = document.getElementById("smellsInsights");
  if (!container) return;
  container.innerHTML = "";

  if (smells.length === 0) {
    container.innerHTML = "<p>No structured code smell findings returned.</p>";
    return;
  }

  smells.forEach((smell) => {
    const card = document.createElement("div");
    card.className = "history-card";

    card.innerHTML = `
      <div class="history-top">
        <strong>${escapeHtml(smell.name || "Unnamed smell")}</strong>
        <span class="lang-badge">${escapeHtml(smell.severity || "Unknown")}</span>
      </div>
      <p><strong>Evidence:</strong> ${escapeHtml(smell.evidence || "N/A")}</p>
      <p><strong>Explanation:</strong> ${escapeHtml(smell.explanation || "N/A")}</p>
      <p><strong>Impact:</strong> ${escapeHtml(smell.impact || "N/A")}</p>
      <p><strong>Fix:</strong> ${escapeHtml(smell.fix || "N/A")}</p>
    `;

    container.appendChild(card);
  });
}

function renderRefactoringInsights(suggestions) {
  const container = document.getElementById("refactorInsights");
  if (!container) return;
  container.innerHTML = "";

  if (suggestions.length === 0) {
    container.innerHTML = "<p>No structured refactoring suggestions returned.</p>";
    return;
  }

  suggestions.forEach((item) => {
    const card = document.createElement("div");
    card.className = "history-card";

    const steps = Array.isArray(item.steps)
      ? item.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")
      : "<li>No steps provided.</li>";

    card.innerHTML = `
      <div class="history-top">
        <strong>${escapeHtml(item.title || "Refactoring suggestion")}</strong>
      </div>
      <p><strong>Why:</strong> ${escapeHtml(item.why || "N/A")}</p>
      <p><strong>Steps:</strong></p>
      <ul>${steps}</ul>
      <p><strong>Example Patch:</strong></p>
      <pre style="white-space:pre-wrap; word-break:break-word;">${escapeHtml(item.examplePatch || "N/A")}</pre>
      <p><strong>Expected Outcome:</strong> ${escapeHtml(item.expectedOutcome || "N/A")}</p>
    `;

    container.appendChild(card);
  });
}

function renderSimpleList(id, values) {
  const list = document.getElementById(id);
  if (!list) return;

  list.innerHTML = "";
  if (!values.length) {
    const li = document.createElement("li");
    li.textContent = "No items returned.";
    list.appendChild(li);
    return;
  }

  values.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    list.appendChild(li);
  });
}

function clearSections() {
  const overviewText = document.getElementById("overviewText");
  const riskText = document.getElementById("riskText");
  const smellsInsights = document.getElementById("smellsInsights");
  const refactorInsights = document.getElementById("refactorInsights");
  const quickWinsList = document.getElementById("quickWinsList");
  const learningStepsList = document.getElementById("learningStepsList");
  const rawJsonOutput = document.getElementById("rawJsonOutput");

  if (overviewText) overviewText.textContent = "Loading...";
  if (riskText) riskText.textContent = "";
  if (smellsInsights) smellsInsights.innerHTML = "";
  if (refactorInsights) refactorInsights.innerHTML = "";
  if (quickWinsList) quickWinsList.innerHTML = "";
  if (learningStepsList) learningStepsList.innerHTML = "";
  if (rawJsonOutput) rawJsonOutput.textContent = "";
}

function setStatus(message, isError) {
  const statusEl = document.getElementById("aiStatus");
  if (!statusEl) return;

  statusEl.textContent = message;
  statusEl.style.color = isError ? "#ff6b6b" : "#cbd5ff";
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
