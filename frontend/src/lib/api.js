const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

/**
 * Make an authenticated API request
 */
async function request(endpoint, options = {}) {
  const token = localStorage.getItem("smartshield_token");

  const config = {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  };

  const res = await fetch(`${API_BASE}${endpoint}`, config);

  let data;
  try {
    data = await res.json();
  } catch (err) {
    data = {};
  }

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("smartshield_token");
        localStorage.removeItem("smartshield_user");
        const path = window.location.pathname;
        if (path !== "/login" && path !== "/signup") {
          window.location.href = "/login";
        }
      }
    }
    throw new Error(data.error || "Request failed");
  }

  return data;
}

export const api = {
  // Auth
  login: (email, password) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (email, password) =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  // Dashboard
  getStats: () => request("/dashboard/stats"),
  getAlerts: () => request("/dashboard/alerts"),
  getBlockedIPs: () => request("/dashboard/blocked-ips"),
  getTraffic: () => request("/dashboard/traffic"),

  // Admin
  setDefence: (mode) =>
    request("/dashboard/set-defence", {
      method: "POST",
      body: JSON.stringify({ mode }),
    }),
};
