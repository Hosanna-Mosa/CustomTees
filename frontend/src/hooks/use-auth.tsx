import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMe } from '@/lib/api';

type User = {
  _id: string;
  name: string;
  email: string;
  role: string;
  addresses?: any[];
};

type AuthContextValue = {
  token: string | null;
  isAuthenticated: boolean;
  user: User | null;
  login: (token: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem('token');
    if (stored) {
      setToken(stored);
    }
  }, []);

  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }
    getMe().then((res: any) => setUser(res.data || res)).catch(() => setUser(null));
  }, [token]);

  const value = useMemo<AuthContextValue>(() => ({
    token,
    isAuthenticated: Boolean(token),
    user,
    login: (newToken: string) => {
      localStorage.setItem('token', newToken);
      setToken(newToken);
    },
    logout: () => {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      navigate('/');
    },
  }), [token, user, navigate]);

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}


