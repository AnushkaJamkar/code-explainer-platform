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

async function apiFetch(path, options = {}) {
  const controller = new AbortController();
  const timeoutMs = Number(window.API_TIMEOUT_MS || 15000);
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(toApiUrl(path), {
      ...options,
      signal: options.signal || controller.signal
    });

    return response;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(`API request timed out after ${timeoutMs / 1000} seconds`);
    }

    throw new Error(
      `Unable to reach backend at ${resolveApiBaseUrl()}. ` +
      "Make sure the backend server is running and CORS/API base URL are correct."
    );
  } finally {
    window.clearTimeout(timeoutId);
  }
}

window.resolveApiBaseUrl = resolveApiBaseUrl;
window.toApiUrl = toApiUrl;
window.apiFetch = apiFetch;
