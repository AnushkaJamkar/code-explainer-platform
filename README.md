# Code Explainer Platform

A web-based platform that helps beginners understand programming code **line by line** with clear explanations and visual flowcharts.

## ✨ Features
- Language selection (JavaScript, Python, PHP)
- Line-by-line code explanation
- Explanation includes:
  - What the line does
  - Why it is needed
  - What happens if removed
- Automatic flowchart generation for logic
- Responsive design (mobile-friendly)
- Clean and beginner-focused UI

## 🛠 Technologies Used
- HTML5
- CSS3
- JavaScript
- Mermaid.js (for flowcharts)

## 🚀 Live Demo
👉 https://code-explainer-platform.vercel.app



## 📌 Project Use Case
This project is designed for students and beginner programmers who want to understand how code works internally rather than just memorizing syntax.

## 🔮 Future Scope
- AI-based explanations
- Support for more languages
- Backend integration
- Code execution support

## 👩‍💻 Author
**Anushka Jamkar**

## AI Insights Setup (Free + Deploy Friendly)

The project now supports two AI modes:

1. `AI_PROVIDER=mock` (recommended for college demo)
- No paid API required.
- Works in local and deployed environments.
- Returns structured JSON insights with code smells + refactoring suggestions.

2. `AI_PROVIDER=openai_compat`
- Works with OpenRouter, LocalAI, or any OpenAI-compatible API.
- Configure `AI_API_URL`, `AI_MODEL`, and `AI_API_KEY`.

### Quick start

1. Copy `backend/.env.example` to `backend/.env`.
2. Keep `AI_PROVIDER=mock` for free usage.
3. Start backend and frontend as usual.

### Security note

- Do not commit real API keys.
- Keep `backend/.env` private.
