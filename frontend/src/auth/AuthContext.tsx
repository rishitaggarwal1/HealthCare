import { createContext, useContext, useMemo, useState } from "react";

type AuthState = {
  token: string | null;
  role: string | null;
  isAuthed: boolean;
  setAuth: (token: string, role: string, refresh: string, sessionId: string) => void;
  logout: () => void;
};

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState(localStorage.getItem("access_token"));
  const [role, setRole] = useState(localStorage.getItem("role"));

  const value = useMemo<AuthState>(() => ({
    token,
    role,
    isAuthed: !!token,
    setAuth: (t, r, refresh, sessionId) => {
      localStorage.setItem("access_token", t);
      localStorage.setItem("refresh_token", refresh);
      localStorage.setItem("session_id", sessionId);
      localStorage.setItem("role", r);
      setToken(t);
      setRole(r);
    },
    logout: () => {
      localStorage.clear();
      setToken(null);
      setRole(null);
      window.location.href = "/login";
    },
  }), [token, role]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
}
