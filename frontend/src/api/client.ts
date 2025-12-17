import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing = false;
let queue: Array<(t: string) => void> = [];

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;

    if (err.response?.status === 401 && !original.__isRetry) {
      original.__isRetry = true;

      if (refreshing) {
        return new Promise((resolve) => {
          queue.push((t) => {
            original.headers.Authorization = `Bearer ${t}`;
            resolve(api(original));
          });
        });
      }

      refreshing = true;
      try {
        const refreshToken = localStorage.getItem("refresh_token");
        const sessionId = localStorage.getItem("session_id");
        if (!refreshToken || !sessionId) throw err;

        const r = await axios.post(`${API_BASE}/api/auth/refresh`, {
          refreshToken,
          sessionId,
        });

        const newAccess = r.data.accessToken as string;
        localStorage.setItem("access_token", newAccess);

        queue.forEach((cb) => cb(newAccess));
        queue = [];

        original.headers.Authorization = `Bearer ${newAccess}`;
        return api(original);
      } catch (e) {
        localStorage.clear();
        window.location.href = "/login";
        throw e;
      } finally {
        refreshing = false;
      }
    }

    throw err;
  }
);
