import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Customer } from "../types";
import {
  clearStoredAuthToken,
  errorStatus,
  fetchMe,
  getStoredAuthToken,
  loginCustomer,
  logoutCustomer,
  registerCustomer,
  storeAuthToken,
  updateProfile as updateProfileRequest,
} from "./client";

interface AuthContextValue {
  user: Customer | null;
  /** True only while we check a saved login when the site first opens. */
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: { full_name: string; email: string; phone?: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (payload: { full_name: string; phone: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Customer | null>(null);
  const [loading, setLoading] = useState<boolean>(() => getStoredAuthToken() !== null);

  // Restore a saved login on first load.
  useEffect(() => {
    if (!getStoredAuthToken()) return;
    let cancelled = false;
    fetchMe()
      .then((me) => {
        if (!cancelled) setUser(me);
      })
      .catch((err) => {
        // Only a 401 means the saved login is no longer valid (expired, or the account was deleted).
        // A network hiccup shouldn't log someone out.
        if (errorStatus(err) === 401) clearStoredAuthToken();
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await loginCustomer(email, password);
    storeAuthToken(result.token);
    setUser(result.customer);
  }, []);

  const register = useCallback(
    async (payload: { full_name: string; email: string; phone?: string; password: string }) => {
      const result = await registerCustomer(payload);
      storeAuthToken(result.token);
      setUser(result.customer);
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await logoutCustomer();
    } catch {
      // Even if the server can't be reached, log out on this device.
    }
    clearStoredAuthToken();
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (payload: { full_name: string; phone: string }) => {
    const updated = await updateProfileRequest(payload);
    setUser(updated);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, updateProfile }),
    [user, loading, login, register, logout, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}