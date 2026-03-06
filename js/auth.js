// ================= AUTO REDIRECT IF LOGGED IN =================
document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
  
    // If already logged in and on auth pages, redirect
    if (token && (window.location.pathname.includes("login") || window.location.pathname.includes("register"))) {
      window.location.href = "index.html";
    }
  });
  
  
  // ================= LOGIN =================
  // ================= LOGIN =================
async function login() {
    const errorDiv = document.getElementById("authError");
    errorDiv.innerText = "";
  
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
  
    if (!email || !password) {
      errorDiv.innerText = "Please fill all fields.";
      return;
    }
  
    try {
      const response = await apiFetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });
  
      const data = await response.json().catch(() => ({}));
  
      if (!response.ok) {
        throw new Error(data.message || "Invalid email or password");
      }
  
      // 🔥 Store token
      localStorage.setItem("token", data.token);
  
      // 🔥 Always store user (backend now returns it)
      localStorage.setItem("user", JSON.stringify(data.user));
  
      // Small delay for smoother UX
      setTimeout(() => {
        window.location.href = "index.html";
      }, 300);
  
    } catch (error) {
      errorDiv.innerText = error.message;
    }
  }
  
  // ================= REGISTER =================
  async function register() {
    const errorDiv = document.getElementById("authError");
    errorDiv.innerText = "";
  
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
  
    if (!name || !email || !password) {
      errorDiv.innerText = "Please fill all fields.";
      return;
    }
  
    if (password.length < 6) {
      errorDiv.innerText = "Password must be at least 6 characters.";
      return;
    }
  
    try {
      const response = await apiFetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name, email, password })
      });
  
      const data = await response.json().catch(() => ({}));
  
      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }
  
      // Success
      window.location.href = "login.html";
  
    } catch (error) {
      errorDiv.innerText = error.message;
    }
  }
