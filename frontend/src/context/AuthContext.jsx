// AuthContext (stretch: user accounts).
// Owns the logged-in `user` and JWT `token`. Exposes login/signup/logout and
// restores the session on load: if a token is in localStorage, it calls
// GET /auth/me to confirm it's still valid before trusting it.
import { createContext, useContext, useEffect, useState } from 'react';
import * as api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // On mount: if we have a stored token, verify it and load the user.
  useEffect(() => {
    let cancelled = false;
    async function restore() {
      if (!api.getStoredToken()) {
        setAuthLoading(false);
        return;
      }
      try {
        const me = await api.getMe();
        if (!cancelled) setUser(me);
      } catch {
        // Token expired or invalid — drop it.
        api.setAuthToken(null);
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    }
    restore();
    return () => {
      cancelled = true;
    };
  }, []);

  async function login(credentials) {
    const { token, user: u } = await api.login(credentials);
    api.setAuthToken(token);
    setUser(u);
    return u;
  }

  async function signup(credentials) {
    const { token, user: u } = await api.signup(credentials);
    api.setAuthToken(token);
    setUser(u);
    return u;
  }

  function logout() {
    api.setAuthToken(null);
    setUser(null);
  }

  const value = { user, authLoading, login, signup, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
