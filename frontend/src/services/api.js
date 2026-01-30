// frontend/src/services/api.js
/*const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

let inMemoryAccessToken = null; // store access token in memory

export function setAccessToken(token) {
  inMemoryAccessToken = token;
}

export function getAccessToken() {
  return inMemoryAccessToken; 
}

export function clearAccessToken() {
  inMemoryAccessToken = null;
}

async function fetchWithAuth(url, options = {}) {
  const headers = new Headers(options.headers || {});
  if (inMemoryAccessToken) headers.set("Authorization", `Bearer ${inMemoryAccessToken}`);
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
    credentials: "include", // important: send cookies
  });

  if (res.status === 401 && !url.startsWith("/api/auth/refresh") && !url.startsWith("/api/auth/login")) {
    // try to refresh
    const refreshed = await tryRefresh();
    if (refreshed) {
      // retry original request once with new token
      const headers2 = new Headers(options.headers || {});
      if (inMemoryAccessToken) headers2.set("Authorization", `Bearer ${inMemoryAccessToken}`);
      const retried = await fetch(`${API_BASE}${url}`, { ...options, headers: headers2, credentials: "include" });
      return retried;
    }
  }
  return res; // return original response (caller decides to parse JSON) if not 401 or refresh failed
}

async function tryRefresh() {
  try {
    const r = await fetch(`${API_BASE}/api/auth/refresh`, { method: "POST", credentials: "include" });
    if (!r.ok) return false;
    const data = await r.json();
    if (data?.accessToken) {
      setAccessToken(data.accessToken);
      return true;
    }
    return false;
  } catch (err) {
    console.error("Refresh failed", err);
    return false;
  }
}

export default {
  get: (path) => fetchWithAuth(path, { method: "GET" }),
  post: (path, body) => fetchWithAuth(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
  put: (path, body) => fetchWithAuth(path, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
  delete: (path) => fetchWithAuth(path, { method: "DELETE" }),
  setAccessToken,
  getAccessToken,
  clearAccessToken,
}; */
// Handles API requests with JWT authentication, token refresh, and error handling.

/**Migration instructions (what to change in your forms)
On login/register success: backend should return { accessToken, user }
OR at least accessToken + backend sets refresh cookie. In your frontend handlers call:
setAuth({ token: data.accessToken, user: data.user });
This sets in-memory token and stores user in localStorage.
Ensure fetch calls or api calls use credentials: "include" so refresh cookie is sent.
Remove any code that stores refresh tokens in localStorage — refresh tokens must be httpOnly cookies only.

On logout: call api.clearAccessToken() + your setAuth({}) to clear user state.
In your components, use the api service for requests, e.g.:
const res = await api.get("/api/protected"); **/

// frontend/src/services/api.js
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
let inMemoryAccessToken = null;

export const setAccessToken = (token) => { inMemoryAccessToken = token; };
export const getAccessToken = () => inMemoryAccessToken;
export const clearAccessToken = () => { inMemoryAccessToken = null; };

async function fetchWithAuth(url, options = {}) {
  const headers = new Headers(options.headers || {});
  if (inMemoryAccessToken) headers.set("Authorization", `Bearer ${inMemoryAccessToken}`);

  let res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
    credentials: "include",
  });

  // Check for 401 and try one refresh attempt
  if (res.status === 401 && !url.includes("/auth/refresh")) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      headers.set("Authorization", `Bearer ${inMemoryAccessToken}`);
      res = await fetch(`${API_BASE}${url}`, { ...options, headers, credentials: "include" });
      } else {
    // If refresh fails, we don't want to throw a big error yet, 
    // just let the original 401 go through so useAuth can handle it.
    return res;
    }
  }

  // Consistent parsing: Return data if OK, else throw
  const data = await res.json().catch(() => ({})); 
  if (!res.ok) {
    const error = new Error(data.message || "API Error");
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}

async function tryRefresh() {
  try {
    const r = await fetch(`${API_BASE}/api/auth/refresh`, { 
      method: "POST", 
      credentials: "include" 
    });
    if (!r.ok) return false;
    const data = await r.json();
    if (data?.accessToken) {
      setAccessToken(data.accessToken);
      // NOTE: We don't update User here because api.js shouldn't 
      // depend on React state. useAuth handles that.
      return true;
    }
    return false;
  } catch (err) {
    console.error(err);
    return false;
  }
}

export default {
  get: (path) => fetchWithAuth(path, { method: "GET" }),
  post: (path, body) => fetchWithAuth(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
  put: (path, body) => fetchWithAuth(path, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
  delete: (path) => fetchWithAuth(path, { method: "DELETE" }),
  setAccessToken, 
  getAccessToken,
  clearAccessToken,
};