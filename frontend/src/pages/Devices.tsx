import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";

type Sess = {
  id: string;
  deviceName: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  expiresAt: string;
};

export default function Devices() {
  const { logout } = useAuth();
  const [sessions, setSessions] = useState<Sess[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    setErr(null);
    const r = await api.get("/api/auth/sessions");
    setSessions(r.data);
  };

  useEffect(() => {
    load().catch((e) => setErr(e?.response?.data || e.message));
  }, []);

  const revoke = async (id: string) => {
    await api.delete(`/api/auth/sessions/${id}`);
    const current = localStorage.getItem("session_id");
    if (current === id) logout(); // revoked current device -> logout UI
    else load();
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Your Devices</h1>
          <button onClick={logout} className="text-sm font-semibold text-red-600">Logout</button>
        </div>

        {err && <div className="mt-4 text-sm text-red-600">{String(err)}</div>}

        <div className="mt-6 space-y-3">
          {sessions.map(s => (
            <div key={s.id} className="bg-white rounded-2xl shadow p-4 flex items-start justify-between gap-4">
              <div>
                <div className="font-semibold">{s.deviceName}</div>
                <div className="text-sm text-slate-500">{s.ipAddress}</div>
                <div className="text-xs text-slate-400 mt-1 break-all">{s.userAgent}</div>
                <div className="text-xs text-slate-400 mt-1">
                  Created: {new Date(s.createdAt).toLocaleString()} • Expires: {new Date(s.expiresAt).toLocaleString()}
                </div>
              </div>
              <button onClick={() => revoke(s.id)} className="text-sm font-semibold text-red-600">
                Remove
              </button>
            </div>
          ))}
          {sessions.length === 0 && (
            <div className="text-slate-500">No active sessions.</div>
          )}
        </div>
      </div>
    </div>
  );
}
