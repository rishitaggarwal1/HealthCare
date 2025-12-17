import { useEffect, useState } from "react";
import { api } from "../api/client";

export default function Admin() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.get("/api/admin/stats").then(r => setData(r.data));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Admin</h1>
      <pre className="mt-4 bg-slate-100 p-4 rounded-xl">{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
