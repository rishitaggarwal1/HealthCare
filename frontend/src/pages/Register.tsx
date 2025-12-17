import { useState } from "react";
import { api } from "../api/client";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setErr(null);
    try {
      await api.post("/api/auth/register", { name, email, password });
      window.location.href = "/login";
    } catch (e: any) {
      setErr(e?.response?.data || e.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow p-6">
        <h1 className="text-2xl font-bold">Create account</h1>
        <p className="text-sm text-slate-500 mt-1">Register to continue</p>

        {err && <div className="mt-4 text-sm text-red-600">{String(err)}</div>}

        <div className="mt-5 space-y-3">
          <input className="w-full border rounded-xl p-3" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="w-full border rounded-xl p-3" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="w-full border rounded-xl p-3" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button className="w-full bg-blue-600 text-white rounded-xl py-3 font-semibold" onClick={submit}>
            Register
          </button>
          <a className="text-sm text-blue-700" href="/login">Already have an account? Login</a>
        </div>
      </div>
    </div>
  );
}
