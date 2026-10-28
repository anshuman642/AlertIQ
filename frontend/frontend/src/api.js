const API_BASE_URL = import.meta.env.VITE_API_URL || "";

async function request(path, options = {}) {
  const token = localStorage.getItem("alertiq_token");
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch (error) {
    throw new Error("AlertIQ backend se connection nahi ho raha. VS Code mein backend server start karke dobara try karein.");
  }

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await response.json().catch(() => null) : null;
  if (!response.ok) {
    const message = Array.isArray(data?.detail)
      ? data.detail.map((error) => error.msg).join(" ")
      : data?.detail || (
        !isJson
          ? `Backend ne unexpected response diya (HTTP ${response.status}). VS Code ke backend terminal mein error check karein.`
          : "The request could not be completed."
      );
    throw new Error(message);
  }

  if (!isJson || data === null) {
    throw new Error("Backend ka response read nahi ho saka. Backend terminal mein error check karein.");
  }

  return data;
}

export function register(payload) {
  return request("/api/v1/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function login(payload) {
  return request("/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function getHistory(limit = 100) {
  return request(`/api/v1/history?limit=${limit}`);
}

export function analyzeContent(payload) {
  return request("/api/v1/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function analyzeImage(image, description) {
  const body = new FormData();
  body.append("image", image);
  body.append("description", description);

  return request("/api/v1/analyze-image", {
    method: "POST",
    body,
  });
}

export function clearSession() {
  localStorage.removeItem("alertiq_token");
  localStorage.removeItem("alertiq_user");
}

export function saveSession(data) {
  localStorage.setItem("alertiq_token", data.token);
  localStorage.setItem("alertiq_user", JSON.stringify(data.user));
}

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("alertiq_user") || "null");
  } catch {
    return null;
  }
}
