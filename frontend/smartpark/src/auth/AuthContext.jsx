import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { getToken, setToken } from '../api/client';
import { authService, parkingSessionService, vehicleService } from '../api/services';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  // Restore session: a stored token is valid if it can reach a protected endpoint.
  useEffect(() => {
    let cancelled = false;
    async function restore() {
      if (!getToken()) {
        setReady(true);
        return;
      }
      try {
        const vehicles = await vehicleService.list();
        if (!cancelled) {
          const email = parseEmail(getToken());
          setUser({ email, vehicles });
        }
      } catch {
        setToken(null);
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setReady(true);
      }
    }
    restore();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authService.login({ email, password });
    setToken(res.token);
    setUser({ id: res.id, name: res.name, email: res.email, role: res.role ?? 'USER' });
    return res;
  }, []);

  const signup = useCallback(async (name, email, password) => {
    const res = await authService.signup({ name, email, password });
    return res;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const activeSession = useCallback(async () => {
    const sessions = await parkingSessionService.history();
    return (sessions ?? []).find((s) => s.status === 'ACTIVE') ?? null;
  }, []);

  const value = useMemo(
    () => ({ user, ready, login, signup, logout, activeSession }),
    [user, ready, login, signup, logout, activeSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function parseEmail(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
