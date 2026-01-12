// ---------------- SCROLL TO EDITOR ----------------
document.getElementById("startBtn").addEventListener("click", () => {
  document.getElementById("editor").scrollIntoView({ behavior: "smooth" });
});

// ---------------- MAIN EXPLAIN BUTTON ----------------
document.getElementById("explainBtn").addEventListener("click", () => {
  const language = document.getElementById("language").value;
  const code = document.getElementById("codeInput").value;
  const explanationBox = document.getElementById("explanation");
  const flowchartBox = document.getElementById("flowchart");

  if (!code.trim()) {
    alert("Please write or paste some code first.");
    return;
  }

  // ---------- LINE BY LINE EXPLANATION ----------
  const lines = code.split("\n");
  explanationBox.innerHTML = "";

  lines.forEach((line, index) => {
    const cleanLine = line.trim();
    const explanation = explainLine(cleanLine, language);

    const block = document.createElement("div");
    block.style.marginBottom = "14px";

    block.innerHTML = `
      <strong>Line ${index + 1}:</strong>
      <code>${cleanLine || "(empty line)"}</code>
      <div>${explanation}</div>
      <hr/>
    `;

    explanationBox.appendChild(block);
  });

  // ---------- FLOWCHART ----------
  const chart = generateFlowchart(code);

  if (!chart) {
    flowchartBox.innerHTML =
      "<p class='placeholder'>No control flow detected.</p>";
    return;
  }

  flowchartBox.innerHTML = `<div class="mermaid">${chart}</div>`;
  mermaid.init(undefined, document.querySelectorAll(".mermaid"));
});

// ---------------- EXPLANATION LOGIC ----------------
function explainLine(line, language) {
  if (line === "") {
    return `
      <b>What it does:</b> This is an empty line.<br/>
      <b>Why needed:</b> Improves readability.<br/>
      <b>If removed:</b> Code still works but looks messy.
    `;
  }

  if (line.startsWith("//") || line.startsWith("#")) {
    return `
      <b>What it does:</b> This is a comment.<br/>
      <b>Why needed:</b> Helps humans understand code.<br/>
      <b>If removed:</b> Program still works, readability decreases.
    `;
  }

  if (language === "javascript") {
    if (line.includes("for")) {
      return `
        <b>What it does:</b> Starts a loop.<br/>
        <b>Why needed:</b> Repeats a task automatically.<br/>
        <b>If removed:</b> Repetition will not occur.
      `;
    }
    if (line.startsWith("if")) {
      return `
        <b>What it does:</b> Checks a condition.<br/>
        <b>Why needed:</b> Controls decision making.<br/>
        <b>If removed:</b> Code may run incorrectly.
      `;
    }
    if (line.includes("console.log")) {
      return `
        <b>What it does:</b> Prints output to console.<br/>
        <b>Why needed:</b> Shows results/debugging.<br/>
        <b>If removed:</b> No output shown.
      `;
    }
    if (line.includes("let ") || line.includes("const ") || line.includes("var ")) {
      return `
        <b>What it does:</b> Declares a variable.<br/>
        <b>Why needed:</b> Stores data.<br/>
        <b>If removed:</b> Errors due to undefined variables.
      `;
    }
    if (line === "}") {
      return `
        <b>What it does:</b> Ends a code block.<br/>
        <b>Why needed:</b> Defines scope.<br/>
        <b>If removed:</b> Syntax error.
      `;
    }
  }

  if (language === "python") {
    if (line.startsWith("for")) {
      return `
        <b>What it does:</b> Loops over a sequence.<br/>
        <b>Why needed:</b> Avoids repetitive code.<br/>
        <b>If removed:</b> Loop logic breaks.
      `;
    }
    if (line.startsWith("if")) {
      return `
        <b>What it does:</b> Checks a condition.<br/>
        <b>Why needed:</b> Controls flow.<br/>
        <b>If removed:</b> Wrong execution.
      `;
    }
    if (line.includes("print")) {
      return `
        <b>What it does:</b> Displays output.<br/>
        <b>Why needed:</b> Shows result to user.<br/>
        <b>If removed:</b> No output visible.
      `;
    }
  }

  if (language === "php") {
    if (line.startsWith("$")) {
      return `
        <b>What it does:</b> Declares a variable.<br/>
        <b>Why needed:</b> Stores value.<br/>
        <b>If removed:</b> Undefined variable error.
      `;
    }
    if (line.startsWith("if")) {
      return `
        <b>What it does:</b> Checks a condition.<br/>
        <b>Why needed:</b> Controls logic.<br/>
        <b>If removed:</b> Logic failure.
      `;
    }
    if (line.includes("echo")) {
      return `
        <b>What it does:</b> Outputs text.<br/>
        <b>Why needed:</b> Displays result.<br/>
        <b>If removed:</b> No output.
      `;
    }
  }

  return `
    <b>What it does:</b> Part of program logic.<br/>
    <b>Why needed:</b> Supports execution.<br/>
    <b>If removed:</b> Program behavior may change.
  `;
}

// ---------------- FLOWCHART GENERATION ----------------
function generateFlowchart(code) {
  const lines = code.split("\n").map(l => l.trim());
  const hasLoop = lines.some(l => l.startsWith("for") || l.startsWith("while"));
  const hasIf = lines.some(l => l.startsWith("if"));

  if (!hasLoop && !hasIf) return null;

  if (hasIf && !hasLoop) {
    return `
flowchart TD
  A([Start])
  A --> B{Condition?}
  B -- True --> C[Execute Code]
  B -- False --> D[Skip Code]
  C --> E([End])
  D --> E
`;
  }

  return `
flowchart TD
  A([Start])
  A --> B[Initialize]
  B --> C{Condition?}
  C -- Yes --> D[Execute Loop Body]
  D --> B
  C -- No --> E([End])
`;
}
// ---------------- TYPEWRITER EFFECT ----------------
const words = ["JavaScript", "Python", "PHP"];
let wordIndex = 0;
let charIndex = 0;
let isDeleting = false;

const typingElement = document.getElementById("typing-text");

function typeEffect() {
  const currentWord = words[wordIndex];

  if (!isDeleting) {
    typingElement.textContent = currentWord.substring(0, charIndex + 1);
    charIndex++;
  } else {
    typingElement.textContent = currentWord.substring(0, charIndex - 1);
    charIndex--;
  }

  if (charIndex === currentWord.length) {
    isDeleting = true;
    setTimeout(typeEffect, 1000);
    return;
  }

  if (charIndex === 0 && isDeleting) {
    isDeleting = false;
    wordIndex = (wordIndex + 1) % words.length;
  }

  setTimeout(typeEffect, isDeleting ? 60 : 100);
}

typeEffect();
// ---------------- HAMBURGER MENU ----------------
const hamburger = document.getElementById("hamburger");
const navLinks = document.getElementById("navLinks");

hamburger.addEventListener("click", () => {
  navLinks.classList.toggle("active");
});
