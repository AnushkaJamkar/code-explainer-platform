document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  const raw = sessionStorage.getItem("analysisResult");
  let analysisResult = null;

  if (raw) {
    try {
      analysisResult = JSON.parse(raw);
    } catch (error) {
      analysisResult = null;
    }
  }

  const contextPreview = document.getElementById("contextPreview");
  const previewText = analysisResult?.code ||
    (Array.isArray(analysisResult?.explanations)
      ? analysisResult.explanations.map((x) => x.code || "").join("\n")
      : "No current analysis context. Analyze some code first.");

  if (contextPreview) {
    contextPreview.textContent = previewText.slice(0, 5000);
  }

  bindPromptChips();

  const askBtn = document.getElementById("askTutorBtn");
  if (askBtn) {
    askBtn.addEventListener("click", () => askTutor(analysisResult));
  }

  const questionEl = document.getElementById("tutorQuestion");
  if (questionEl) {
    questionEl.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        askTutor(analysisResult);
      }
    });
  }
});

function bindPromptChips() {
  const chips = document.querySelectorAll(".prompt-chip");
  const questionEl = document.getElementById("tutorQuestion");
  if (!chips.length || !questionEl) return;

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      questionEl.value = chip.getAttribute("data-q") || "";
      questionEl.focus();
    });
  });
}

async function askTutor(analysisResult) {
  const token = localStorage.getItem("token");
  const questionEl = document.getElementById("tutorQuestion");
  const statusEl = document.getElementById("tutorStatus");
  const responseEl = document.getElementById("tutorResponse");

  const question = (questionEl?.value || "").trim();
  if (!question) {
    setTutorStatus("Please enter a question first.", true);
    return;
  }

  if (responseEl) responseEl.innerHTML = "";
  setTutorStatus("Tutor is thinking...", false);

  const payload = {
    question,
    code: analysisResult?.code || "",
    language: analysisResult?.language || "javascript",
    metrics: analysisResult?.metrics || {},
    smells: analysisResult?.smells || [],
    explanations: analysisResult?.explanations || []
  };

  try {
    const response = await apiFetch("/api/ai/tutor", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || "Tutor request failed");
    }

    renderTutorResponse(data.tutor || {});
    addHistoryItem(question, data.tutor || {});
    setTutorStatus(`Tutor response ready (${data.model || "model"}).`, false);
    if (statusEl) statusEl.style.color = "#cbd5ff";
  } catch (error) {
    setTutorStatus(error.message || "Unable to fetch tutor response.", true);
  }
}

function renderTutorResponse(tutor) {
  const container = document.getElementById("tutorResponse");
  if (!container) return;

  const steps = Array.isArray(tutor.stepByStep)
    ? tutor.stepByStep.map((s) => `<li>${escapeHtml(s)}</li>`).join("")
    : "<li>No steps provided.</li>";

  container.innerHTML = `
    <div class="history-card tutor-card">
      <div class="history-top">
        <strong>Direct Answer</strong>
        <span class="lang-badge">${escapeHtml(tutor.difficulty || "Unknown")}</span>
      </div>
      <p>${escapeHtml(tutor.directAnswer || "No answer returned.")}</p>
      <p><strong>Step-by-step:</strong></p>
      <ul>${steps}</ul>
      <p><strong>Code Walkthrough:</strong> ${escapeHtml(tutor.codeWalkthrough || "N/A")}</p>
      <p><strong>Common Mistake:</strong> ${escapeHtml(tutor.commonMistake || "N/A")}</p>
      <p><strong>Hint:</strong> ${escapeHtml(tutor.hint || "N/A")}</p>
      <p><strong>Practice Task:</strong> ${escapeHtml(tutor.practiceTask || "N/A")}</p>
    </div>
  `;
}

function addHistoryItem(question, tutor) {
  const history = document.getElementById("qaHistory");
  if (!history) return;

  const card = document.createElement("div");
  card.className = "history-card";
  card.innerHTML = `
    <p><strong>Q:</strong> ${escapeHtml(question)}</p>
    <p><strong>A:</strong> ${escapeHtml(tutor.directAnswer || "No answer")}</p>
  `;

  history.prepend(card);
}

function setTutorStatus(message, isError) {
  const status = document.getElementById("tutorStatus");
  if (!status) return;
  status.textContent = message;
  status.style.color = isError ? "#ff6b6b" : "#cbd5ff";
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
