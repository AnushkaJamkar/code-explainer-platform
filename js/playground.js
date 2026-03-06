const SAMPLE_LIBRARY = {
  javascript: [
    {
      name: "Nested Loop Search",
      level: "hard",
      topic: "algorithms",
      code: `function findPair(nums, target) {
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] + nums[j] === target) {
        return [i, j];
      }
    }
  }
  return null;
}`
    },
    {
      name: "Auth Guard Logic",
      level: "medium",
      topic: "auth",
      code: `function canAccess(user, resource) {
  if (!user) return false;
  if (user.role === "admin") return true;
  if (resource.isPrivate && resource.ownerId !== user.id) return false;
  return true;
}`
    },
    {
      name: "Array Clean-up",
      level: "easy",
      topic: "arrays",
      code: `function cleanTags(tags) {
  const cleaned = [];
  for (const tag of tags) {
    const t = tag.trim().toLowerCase();
    if (t && !cleaned.includes(t)) {
      cleaned.push(t);
    }
  }
  return cleaned;
}`
    }
  ],
  python: [
    {
      name: "List Filter and Transform",
      level: "easy",
      topic: "loops",
      code: `def process_numbers(nums):
    result = []
    for n in nums:
        if n % 2 == 0:
            result.append(n * 2)
        else:
            result.append(n)
    return result`
    },
    {
      name: "Simple Grade Analyzer",
      level: "easy",
      topic: "conditions",
      code: `def classify_grade(score):
    if score >= 90:
        return "A"
    elif score >= 75:
        return "B"
    elif score >= 60:
        return "C"
    return "D"`
    },
    {
      name: "Token Rate Limiter",
      level: "hard",
      topic: "backend",
      code: `def can_send(user_tokens, now):
    active = []
    for t in user_tokens:
        if now - t < 60:
            active.append(t)
    if len(active) >= 5:
        return False
    active.append(now)
    return True`
    }
  ],
  php: [
    {
      name: "Cart Total",
      level: "medium",
      topic: "commerce",
      code: `<?php
function calculateCartTotal($items) {
  $total = 0;
  foreach ($items as $item) {
    if ($item['inStock']) {
      $total += $item['price'] * $item['qty'];
    }
  }
  return $total;
}`
    },
    {
      name: "User Visibility",
      level: "medium",
      topic: "auth",
      code: `<?php
function canViewProfile($viewer, $ownerId, $isPrivate) {
  if (!$viewer) return false;
  if ($viewer['role'] === 'admin') return true;
  if ($isPrivate && $viewer['id'] !== $ownerId) return false;
  return true;
}`
    },
    {
      name: "Input Sanitizer",
      level: "easy",
      topic: "security",
      code: `<?php
function sanitizeInput($text) {
  $clean = trim($text);
  $clean = strip_tags($clean);
  return htmlspecialchars($clean, ENT_QUOTES, 'UTF-8');
}`
    }
  ]
};

let filteredSamples = [];

document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  const languageEl = document.getElementById("sampleLanguage");
  const difficultyEl = document.getElementById("sampleDifficulty");
  const sampleEl = document.getElementById("sampleSnippet");
  const searchEl = document.getElementById("sampleSearch");

  document.getElementById("analyzeSampleBtn")?.addEventListener("click", sendToAnalyzer);
  document.getElementById("runQuickAnalyzeBtn")?.addEventListener("click", quickAnalyzeHere);
  document.getElementById("askTutorFromSampleBtn")?.addEventListener("click", askTutorFromSample);
  document.getElementById("copySampleBtn")?.addEventListener("click", copySampleCode);
  document.getElementById("randomSampleBtn")?.addEventListener("click", randomizeSample);

  languageEl?.addEventListener("change", applyFilters);
  difficultyEl?.addEventListener("change", applyFilters);
  sampleEl?.addEventListener("change", () => loadSelectedSample(sampleEl.selectedIndex));
  searchEl?.addEventListener("input", applyFilters);

  applyFilters();
});

function applyFilters() {
  const language = document.getElementById("sampleLanguage")?.value || "javascript";
  const difficulty = document.getElementById("sampleDifficulty")?.value || "all";
  const search = (document.getElementById("sampleSearch")?.value || "").trim().toLowerCase();
  const samples = SAMPLE_LIBRARY[language] || [];

  filteredSamples = samples.filter((item) => {
    const matchDifficulty = difficulty === "all" || item.level === difficulty;
    const matchSearch =
      !search ||
      item.name.toLowerCase().includes(search) ||
      item.topic.toLowerCase().includes(search) ||
      item.code.toLowerCase().includes(search);

    return matchDifficulty && matchSearch;
  });

  const sampleEl = document.getElementById("sampleSnippet");
  sampleEl.innerHTML = "";

  if (!filteredSamples.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "No samples matched";
    sampleEl.appendChild(option);
    setEditorCode("");
    updateSampleMeta(null);
    return;
  }

  filteredSamples.forEach((sample, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = sample.name;
    sampleEl.appendChild(option);
  });

  loadSelectedSample(0);
}

function loadSelectedSample(index) {
  const sample = filteredSamples[index] || null;
  setEditorCode(sample ? sample.code : "");
  updateSampleMeta(sample);
}

function setEditorCode(code) {
  const codeEl = document.getElementById("sampleCode");
  if (codeEl) codeEl.value = code || "";
}

function updateSampleMeta(sample) {
  const metaEl = document.getElementById("sampleMeta");
  if (!metaEl) return;

  if (!sample) {
    metaEl.innerHTML = "<span class=\"meta-chip\">No sample selected</span>";
    return;
  }

  metaEl.innerHTML = `
    <span class="meta-chip">Topic: ${escapeHtml(sample.topic)}</span>
    <span class="meta-chip">Difficulty: ${escapeHtml(sample.level)}</span>
    <span class="meta-chip">Lines: ${String(sample.code.split(/\r?\n/).length)}</span>
  `;
}

function sendToAnalyzer() {
  const language = document.getElementById("sampleLanguage")?.value || "javascript";
  const code = document.getElementById("sampleCode")?.value || "";

  if (!code.trim()) {
    alert("Sample code is empty.");
    return;
  }

  sessionStorage.setItem("draftCode", code);
  sessionStorage.setItem("draftLanguage", language);
  window.location.href = "index.html#editor";
}

async function quickAnalyzeHere() {
  const token = localStorage.getItem("token");
  const language = document.getElementById("sampleLanguage")?.value || "javascript";
  const code = document.getElementById("sampleCode")?.value || "";
  const resultEl = document.getElementById("playgroundResult");

  if (!code.trim()) {
    alert("Sample code is empty.");
    return false;
  }

  resultEl.textContent = "Running quick analysis...";

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
      throw new Error(data.message || "Quick analysis failed");
    }

    const m = data.metrics || {};
    const firstExplanation = data.explanations?.[0]?.explanation?.what || "No explanation";

    resultEl.innerHTML = `
      <div class="history-card">
        <p><strong>Total Lines:</strong> ${m.totalLines ?? 0}</p>
        <p><strong>Cyclomatic Complexity:</strong> ${m.cyclomaticComplexity ?? 1}</p>
        <p><strong>Maintainability:</strong> ${m.maintainabilityScore ?? 0}</p>
        <p><strong>Risk:</strong> ${escapeHtml(m.riskLevel || "Unknown")}</p>
        <p><strong>Time Complexity:</strong> ${m.timeComplexity || "O(1)"}</p>
        <p><strong>First Line Insight:</strong> ${escapeHtml(firstExplanation)}</p>
      </div>
    `;

    const analysisResult = {
      ...data,
      code
    };
    sessionStorage.setItem("analysisResult", JSON.stringify(analysisResult));
    return true;
  } catch (error) {
    resultEl.innerHTML = `<p style="color:#ff6b6b;">${escapeHtml(error.message || "Error")}</p>`;
    return false;
  }
}

async function askTutorFromSample() {
  const ok = await quickAnalyzeHere();
  if (ok) {
    window.location.href = "ai-tutor.html";
  }
}

function randomizeSample() {
  const sampleEl = document.getElementById("sampleSnippet");
  if (!filteredSamples.length || !sampleEl) return;

  const index = Math.floor(Math.random() * filteredSamples.length);
  sampleEl.selectedIndex = index;
  loadSelectedSample(index);
}

async function copySampleCode() {
  const code = document.getElementById("sampleCode")?.value || "";
  if (!code.trim()) {
    alert("Nothing to copy.");
    return;
  }

  try {
    await navigator.clipboard.writeText(code);
    alert("Code copied to clipboard.");
  } catch (error) {
    alert("Unable to copy. Please copy manually.");
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
