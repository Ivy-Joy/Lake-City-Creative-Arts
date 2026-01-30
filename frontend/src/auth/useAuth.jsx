// frontend/src/auth/useAuth.jsx
import { useState, useEffect, useCallback } from "react";
import api from "../services/api"; // must implement setAccessToken, clearAccessToken, post/get wrappers

const REFRESH_ENDPOINT = "/api/auth/refresh";
const ME_ENDPOINT = "/api/auth/me";
const LOGOUT_ENDPOINT = "/api/auth/logout";

/**
 * useAuth - production-ready auth hook
 *
 * - keeps `user` in state and localStorage (only the user object)
 * - keeps access token in memory via api.setAccessToken()
 * - relies on httpOnly refresh cookie for refresh flow (backend must set cookie)
 * - exposes: user, setAuth, logout, checkAuth, refresh, isAuthenticated, loading
 */
export default function useAuth() {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("lcc_user");
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      console.error("useAuth: failed to read lcc_user from localStorage", err);
      return null;
    }
  });

  const [loading, setLoading] = useState(true);

  // persist only user (not tokens)
  useEffect(() => {
    try {
      if (user) localStorage.setItem("lcc_user", JSON.stringify(user));
      else localStorage.removeItem("lcc_user");
    } catch (err) {
      console.error("useAuth: localStorage write failed", err);
    }
  }, [user]);

  // setAuth: called after successful login/register
  // - token: the short-lived access token (string) returned by backend
  // - user: user object returned by backend
  const setAuth = useCallback(({ token, user: newUser }) => {
    if (token) {
      api.setAccessToken(token); // store access token in memory
    }
    setUser(newUser ?? null);
  }, []);

  // logout: tell backend to revoke refresh cookie and clear client state
  const logout = useCallback(async () => {
    setLoading(true);
    try {
      // call backend to invalidate refresh token cookie (backend should clear cookie)
      await api.post(LOGOUT_ENDPOINT, {}); // credentials included by api wrapper
    } catch (err) {
      console.warn("useAuth.logout: backend logout failed", err);
      // Continue clearing local state regardless of error
    } finally {
      api.clearAccessToken();
      setUser(null);
      setLoading(false);
    }
  }, []);

  // try to call refresh endpoint to get a new access token (backend must read httpOnly cookie)
  /*const refresh = useCallback(async () => {
    try {
      const res = await api.post(REFRESH_ENDPOINT, {}); // api.post should include credentials
      // expecting { accessToken, user }
      if (!res.ok) {
        // if api.post returns fetch Response-like, handle accordingly
        // api.post may already parse JSON and return object — handle both cases:
        let data;
        try {
          data = await res.json();
        } catch {
          return null;
        }
        console.warn("useAuth.refresh: refresh failed", data);
        return null;
      }

      // if api.post returns parsed JSON (helper), it may be the data directly
      let data;
      try {
        // If res is a fetch Response object, parse JSON; otherwise assume it's data
        data = res.json ? await res.json() : res;
      } catch (err) {
        console.error("useAuth.refresh: error parsing refresh response", err);
        return null;
      }

      if (data?.accessToken) {
        api.setAccessToken(data.accessToken);
      }
      if (data?.user) {
        setUser(data.user);
      }
      return data?.accessToken ?? null;
    } catch (err) {
      console.error("useAuth.refresh error:", err);
      return null;
    }
  }, []);

  // checkAuth: used on app mount to restore session
  const checkAuth = useCallback(async () => {
    setLoading(true);
    try {
      // 1) If we already have an access token in memory via api, try /me
      //    Otherwise try to refresh using httpOnly cookie
      const access = api.getAccessToken ? api.getAccessToken() : null;
      if (access) {
        // If api wrapper exposes getAccessToken
        // call /me to validate access token and get user (api.get should attach Authorization header)
        const resp = await api.get(ME_ENDPOINT);
        if (resp.ok) {
          // resp may be Response or parsed JSON depending on api implementation
          const data = resp.json ? await resp.json() : resp;
          if (data?.user) {
            setUser(data.user);
            setLoading(false);
            return true;
          }
        } else if (resp.status === 401) {
          // Access expired — fallthrough to refresh
        } else {
          // other error — attempt refresh
        }
      }

      // 2) Attempt refresh (cookie-based)
      const newToken = await refresh();
      if (!newToken) {
        // no session
        api.clearAccessToken();
        setUser(null);
        setLoading(false);
        return false;
      }

      // 3) after successful refresh, call /me to get freshest user (optional)
      try {
        const resp2 = await api.get(ME_ENDPOINT);
        if (resp2.ok) {
          const data2 = resp2.json ? await resp2.json() : resp2;
          if (data2?.user) setUser(data2.user);
        }
      } catch (err) {
        console.warn("useAuth.checkAuth: failed to fetch /me after refresh", err);
      }

      setLoading(false);
      return true;
    } catch (err) {
      console.error("useAuth.checkAuth error:", err);
      api.clearAccessToken();
      setUser(null);
      setLoading(false);
      return false;
    }
  }, [refresh]); */

  // simplified refresh
  const refresh = useCallback(async () => {
    try {
      // api.post now returns the parsed data directly { accessToken, user }
      const data = await api.post(REFRESH_ENDPOINT, {}); 

      if (data?.accessToken) {
        api.setAccessToken(data.accessToken);
        if (data.user) setUser(data.user);
        return data.accessToken;
      }
      return null;
    } catch (err) {
      console.error(err);
      // This catches the "Refresh token not recognized" 401 error
      console.warn("useAuth.refresh: session invalid or expired");
      return null;
    }
  }, []);

  // simplified checkAuth
  const checkAuth = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Try to refresh immediately on mount
      const newToken = await refresh();
      
      if (!newToken) {
        api.clearAccessToken();
        setUser(null);
      } else {
        // 2. If refresh worked, get fresh user data
        const data = await api.get(ME_ENDPOINT);
        if (data?.user) setUser(data.user);
      }
    } catch (err) {
      console.error("useAuth.checkAuth error:", err);
      api.clearAccessToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  // run once on mount
  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isAuthenticated = Boolean(user);

  return {
    user,
    setAuth,
    logout,
    checkAuth,
    refresh,
    isAuthenticated,
    loading,
  };
}
