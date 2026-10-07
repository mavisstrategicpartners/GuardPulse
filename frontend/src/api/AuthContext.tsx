import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from "react";
import type { Customer } from "../types";
import {
  fetchCurrentCustomer,
  getStoredCustomerToken,
  loginCustomer,
  logoutCustomer,
  registerCustomer,
  clearStoredCustomerToken,
} from "./client";

interface AuthContextValue {
  customer: Customer | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: { full_name: string; email: string; phone?: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  setCustomer: (customer: Customer | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!getStoredCustomerToken()) {
      setCustomer(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const me = await fetchCurrentCustomer();
      setCustomer(me);
    } catch {
      // Token missing/expired/revoked (e.g. account deleted by an admin, or password was
      // reset elsewhere) — quietly drop back to logged-out rather than showing an error.
      clearStoredCustomerToken();
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const me = await loginCustomer(email, password);
    setCustomer(me);
  }, []);

  const register = useCallback(
    async (payload: { full_name: string; email: string; phone?: string; password: string }) => {
      const me = await registerCustomer(payload);
      setCustomer(me);
    },
    []
  );

  const logout = useCallback(async () => {
    await logoutCustomer();
    setCustomer(null);
  }, []);

  const value: AuthContextValue = { customer, loading, login, register, logout, refresh, setCustomer };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}