function resolveApiBaseUrl() {
  const explicitBase =
    (typeof window.API_BASE_URL === "string" && window.API_BASE_URL.trim()) ||
    localStorage.getItem("API_BASE_URL") ||
    "";

  if (explicitBase) {
    return explicitBase.replace(/\/+$/, "");
  }

  const isFileProtocol = window.location.protocol === "file:";
  const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  if (isFileProtocol || isLocalhost) {
    return "http://localhost:5000";
  }

  return "https://code-explainer-platform.onrender.com";
}

function toApiUrl(path) {
  const base = resolveApiBaseUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

function apiFetch(path, options) {
  return fetch(toApiUrl(path), options);
}

window.resolveApiBaseUrl = resolveApiBaseUrl;
window.toApiUrl = toApiUrl;
window.apiFetch = apiFetch;
