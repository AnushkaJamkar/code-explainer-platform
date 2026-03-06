document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  const user = readUserFromStorage();
  if (user && user.name) {
    const nameEl = document.getElementById("userName");
    const initialEl = document.getElementById("userInitial");

    if (nameEl) nameEl.innerText = user.name;
    if (initialEl) initialEl.innerText = user.name.charAt(0).toUpperCase();
  }

  const hamburger = document.getElementById("hamburger");
  const navMenu = document.getElementById("navMenu");
  if (hamburger && navMenu) {
    hamburger.addEventListener("click", () => {
      navMenu.classList.toggle("active");
    });
  }

  const startBtn = document.getElementById("startBtn");
  if (startBtn) {
    startBtn.addEventListener("click", () => {
      const editor = document.getElementById("editor");
      if (editor) editor.scrollIntoView({ behavior: "smooth" });
    });
  }

  const explainBtn = document.getElementById("explainBtn");
  if (explainBtn) {
    explainBtn.addEventListener("click", explainCode);
  }

  hydrateEditorFromPlaygroundDraft();

  startTypingEffect();
  loadHistory();
});

function readUserFromStorage() {
  const raw = localStorage.getItem("user");
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (error) {
    localStorage.removeItem("user");
    return null;
  }
}

function startTypingEffect() {
  const texts = ["Understand Code.", "Improve Logic.", "Build Better Software."];
  const typingElement = document.getElementById("typing-text");
  if (!typingElement) return;

  let textIndex = 0;
  let charIndex = 0;
  let isDeleting = false;

  function typeEffect() {
    const currentText = texts[textIndex];

    if (!isDeleting) {
      typingElement.textContent = currentText.substring(0, charIndex++);
      if (charIndex > currentText.length) {
        isDeleting = true;
        setTimeout(typeEffect, 1200);
        return;
      }
    } else {
      typingElement.textContent = currentText.substring(0, charIndex--);
      if (charIndex < 0) {
        isDeleting = false;
        textIndex = (textIndex + 1) % texts.length;
      }
    }

    setTimeout(typeEffect, isDeleting ? 40 : 80);
  }

  typeEffect();
}

async function explainCode() {
  const token = localStorage.getItem("token");
  const languageEl = document.getElementById("language");
  const codeInput = document.getElementById("codeInput");

  if (!token || !languageEl || !codeInput) {
    alert("Missing required page data. Please reload the page.");
    return;
  }

  const language = languageEl.value;
  const code = codeInput.value;

  if (!code.trim()) {
    alert("Please write or paste some code first.");
    return;
  }

  try {
    const response = await apiFetch("/api/explain", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ code, language })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || data.error || "Unable to analyze code");
    }

    const analysisResult = {
      ...data,
      code
    };

    sessionStorage.setItem("analysisResult", JSON.stringify(analysisResult));
    window.location.href = "analysis.html";
  } catch (error) {
    console.error("Explain Error:", error);
    alert(error.message || "Something went wrong. Try again.");
  }
}

async function loadHistory() {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const response = await apiFetch("/api/history", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error("History fetch failed");
    }

    const data = await response.json();

    const historyList = document.getElementById("historyList");
    const totalAnalysesEl = document.getElementById("totalAnalyses");
    const totalLinesEl = document.getElementById("totalLines");

    if (!historyList) return;

    historyList.innerHTML = "";
    let totalLines = 0;

    if (!Array.isArray(data) || data.length === 0) {
      historyList.innerHTML = "<p>No history yet.</p>";
      if (totalAnalysesEl) totalAnalysesEl.innerText = "0";
      if (totalLinesEl) totalLinesEl.innerText = "0";
      return;
    }

    data.forEach((item) => {
      const lines = item.metrics?.totalLines || 0;
      totalLines += lines;

      const div = document.createElement("div");
      div.className = "history-card";

      div.innerHTML = `
        <div class="history-top">
          <span class="lang-badge">${String(item.language || "unknown").toUpperCase()}</span>
          <span class="date">${new Date(item.createdAt).toLocaleString()}</span>
        </div>
        <div class="history-stats">Lines: ${lines}</div>
      `;

      historyList.appendChild(div);
    });

    if (totalAnalysesEl) totalAnalysesEl.innerText = String(data.length);
    if (totalLinesEl) totalLinesEl.innerText = String(totalLines);
  } catch (error) {
    console.error("History Load Error:", error);
  }
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  sessionStorage.removeItem("analysisResult");
  window.location.href = "login.html";
}

function hydrateEditorFromPlaygroundDraft() {
  const draftCode = sessionStorage.getItem("draftCode");
  const draftLanguage = sessionStorage.getItem("draftLanguage");

  if (!draftCode) return;

  const codeInput = document.getElementById("codeInput");
  const languageEl = document.getElementById("language");

  if (codeInput) {
    codeInput.value = draftCode;
  }

  if (languageEl && draftLanguage) {
    languageEl.value = draftLanguage;
  }

  sessionStorage.removeItem("draftCode");
  sessionStorage.removeItem("draftLanguage");
}
