import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from "react";
import type { Customer } from "../types";
import {
  fetchCurrentCustomer,
  getStoredCustomerToken,
  loginCustomer,
  logoutCustomer,
  registerCustomer,
  updateCustomerProfile,
  clearStoredCustomerToken,
} from "./client";

interface AuthContextValue {
  user: Customer | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: { full_name: string; email: string; phone?: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (payload: { full_name: string; phone?: string }) => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!getStoredCustomerToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const me = await fetchCurrentCustomer();
      setUser(me);
    } catch {
      // Token missing/expired/revoked (e.g. account deleted by an admin, or password was
      // reset elsewhere) — quietly drop back to logged-out rather than showing an error.
      clearStoredCustomerToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const me = await loginCustomer(email, password);
    setUser(me);
  }, []);

  const register = useCallback(
    async (payload: { full_name: string; email: string; phone?: string; password: string }) => {
      const me = await registerCustomer(payload);
      setUser(me);
    },
    []
  );

  const logout = useCallback(async () => {
    await logoutCustomer();
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (payload: { full_name: string; phone?: string }) => {
    const updated = await updateCustomerProfile(payload);
    setUser(updated);
  }, []);

  const value: AuthContextValue = { user, loading, login, register, logout, updateProfile, refresh };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}