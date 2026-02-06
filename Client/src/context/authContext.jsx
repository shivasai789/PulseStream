import { useState, useCallback, useEffect } from "react";
import * as authApi from "../api/auth.js";
import { AuthContext } from "./authContext.js";

const STORAGE_TOKEN = "pulsestream_token";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_TOKEN));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userLoading, setUserLoading] = useState(
    !!localStorage.getItem(STORAGE_TOKEN)
  );

  const clearError = useCallback(() => setError(null), []);

  const persistAuth = useCallback((newToken, newUser) => {
    if (newToken) localStorage.setItem(STORAGE_TOKEN, newToken);
    else localStorage.removeItem(STORAGE_TOKEN);
    setToken(newToken);
    setUser(newUser ?? null);
  }, []);

  // When we have a token, fetch user from API
  useEffect(() => {
    if (!token) {
      setUserLoading(false);
      return;
    }
    let cancelled = false;
    authApi
      .getCurrentUser()
      .then((u) => {
        if (!cancelled) setUser(u);
      })
      .catch(() => {
        if (!cancelled) {
          setToken(null);
          setUser(null);
          localStorage.removeItem(STORAGE_TOKEN);
        }
      })
      .finally(() => {
        if (!cancelled) setUserLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const login = useCallback(
    async (email, password) => {
      setLoading(true);
      setError(null);
      try {
        const { token: newToken, user: newUser } = await authApi.login(
          email,
          password
        );
        persistAuth(newToken, newUser);
        return { ok: true };
      } catch (err) {
        const message = err?.data?.message || err?.message || "Login failed";
        setError(message);
        return { ok: false, message };
      } finally {
        setLoading(false);
      }
    },
    [persistAuth]
  );

  const register = useCallback(
    async (name, email, password, role) => {
      setLoading(true);
      setError(null);
      try {
        await authApi.register({ name, email, password, role });
        const result = await login(email, password);
        return result;
      } catch (err) {
        const message =
          err?.data?.message || err?.message || "Registration failed";
        setError(message);
        return { ok: false, message };
      } finally {
        setLoading(false);
      }
    },
    [login]
  );

  const logout = useCallback(() => {
    persistAuth(null, null);
  }, [persistAuth]);

  const value = {
    user,
    token,
    isAuthenticated: !!token,
    loading,
    userLoading,
    error,
    clearError,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
