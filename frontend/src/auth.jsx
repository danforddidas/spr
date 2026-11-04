
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const API = "/api";
const SESSION = "spr-session";
const TOKEN = "spr-token";

const Ctx = createContext(null);

export const useAuth = () => useContext(Ctx);

function getError(data) {
  if (typeof data === "string") return data;
  if (data?.detail) return data.detail;

  if (data && typeof data === "object") {
    const first = Object.values(data)[0];
    if (Array.isArray(first)) return first[0];
    if (typeof first === "string") return first;
  }

  return "Something went wrong. Please try again.";
}

async function apiRequest(endpoint, options = {}, token = null) {
  const headers = {
    ...(options.body instanceof FormData
      ? {}
      : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Token ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {A
    throw new Error(getError(data));
  }

  return data;
}

function formatUser(user) {
  return {
    ...user,
    name:
      user.full_name ||
      `${user.first_name || ""} ${user.last_name || ""}`.trim(),
    regNo: user.reg_number,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const start = useCallback((token, account) => {
    const safeUser = formatUser(account);

    localStorage.setItem(TOKEN, token);
    localStorage.setItem(SESSION, JSON.stringify(safeUser));

    setUser(safeUser);
  }, []);

  // Restore existing login session
  useEffect(() => {
    let active = true;

    async function restoreSession() {
      const token = localStorage.getItem(TOKEN);

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const account = await apiRequest("/auth/me/", {}, token);

        if (active) {
          setUser(formatUser(account));
        }
      } catch {
        localStorage.removeItem(TOKEN);
        localStorage.removeItem(SESSION);

        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    restoreSession();

    return () => {
      active = false;
    };
  }, []);

  // Registration
  const register = useCallback(async (data) => {
    try {
      const response = await apiRequest("/auth/register/", {
        method: "POST",
        body: JSON.stringify({
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          reg_number: data.reg_number,
          phone: data.phone || "",
          department: Number(data.department),
          course: Number(data.course),
          password: data.password,
        }),
      });

      start(response.token, response.user);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }, [start]);

  // Login
  const login = useCallback(async (identifier, password) => {
    try {
      const response = await apiRequest("/auth/login/", {
        method: "POST",
        body: JSON.stringify({
          identifier,
          password,
        }),
      });

      start(response.token, response.user);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }, [start]);

  // Logout
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN);
    localStorage.removeItem(SESSION);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      register,
      login,
      logout,
    }),
    [user, loading, register, login, logout]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
