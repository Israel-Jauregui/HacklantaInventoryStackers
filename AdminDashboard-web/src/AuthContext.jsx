import { createContext, useContext, useState, useCallback } from 'react';

/* ════════════════════════════════════════════
   MOCK ADMIN USERS
   In production, replace this with a real API
   call to your backend (e.g. Firebase Auth,
   Supabase, or your own /api/login endpoint).
════════════════════════════════════════════ */
const ADMIN_USERS = [
  {
    id: 'usr-001',
    email: 'j.lewis@atlantaga.gov',
    password: 'StreetsATL2026!',
    name: 'J. Lewis',
    role: 'Super Admin',
    district: 'District 6',
    initials: 'JL',
  },
  {
    id: 'usr-002',
    email: 'm.patel@atlantaga.gov',
    password: 'StreetsATL2026!',
    name: 'M. Patel',
    role: 'Editor',
    district: 'District 5',
    initials: 'MP',
  },
  {
    id: 'usr-003',
    email: 'r.williams@atlantaga.gov',
    password: 'StreetsATL2026!',
    name: 'R. Williams',
    role: 'Viewer',
    district: 'District 7',
    initials: 'RW',
  },
];

/* ════════════════════════════════════════════
   AUTH CONTEXT
════════════════════════════════════════════ */
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  /* Check sessionStorage so the session survives a page refresh
     but is cleared when the browser tab is closed.
     Swap to localStorage if you want persistent login. */
  const [user, setUser] = useState(() => {
    try {
      const saved = sessionStorage.getItem('streetsense_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [loginError, setLoginError] = useState('');
  const [isLoading,  setIsLoading]  = useState(false);

  /* ── LOGIN ── */
  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    setLoginError('');

    /* Simulate a network round-trip (remove when using a real API) */
    await new Promise((r) => setTimeout(r, 800));

    const match = ADMIN_USERS.find(
      (u) =>
        u.email.toLowerCase() === email.trim().toLowerCase() &&
        u.password === password
    );

    if (match) {
      /* Strip the password before storing */
      const { password: _pw, ...safeUser } = match;
      setUser(safeUser);
      try {
        sessionStorage.setItem('streetsense_user', JSON.stringify(safeUser));
      } catch {
        /* sessionStorage unavailable — continue without persistence */
      }
      setIsLoading(false);
      return true;
    } else {
      setLoginError('Invalid email or password. Please try again.');
      setIsLoading(false);
      return false;
    }
  }, []);

  /* ── LOGOUT ── */
  const logout = useCallback(() => {
    setUser(null);
    setLoginError('');
    try {
      sessionStorage.removeItem('streetsense_user');
    } catch {
      /* ignore */
    }
  }, []);

  const clearError = useCallback(() => setLoginError(''), []);

  return (
    <AuthContext.Provider value={{ user, login, logout, loginError, isLoading, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}

/* ── HOOK ── */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}
