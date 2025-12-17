import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import type { JSX } from "react";

export function RoleRoute({ role, children }: { role: string; children: JSX.Element }) {
  const a = useAuth();
  if (!a.isAuthed) return <Navigate to="/login" replace />;
  if (a.role !== role) return <Navigate to="/" replace />;
  return children;
}
