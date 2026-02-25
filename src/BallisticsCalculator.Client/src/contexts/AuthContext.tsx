import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { loginUser, registerUser } from '../services/api';
import type { AuthUser, LoginRequest, RegisterRequest } from '../types';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (request: LoginRequest) => Promise<void>;
  register: (request: RegisterRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function loadUserFromStorage(): AuthUser | null {
  try {
    const raw = localStorage.getItem('auth_user');
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(loadUserFromStorage);

  useEffect(() => {
    if (user) {
      localStorage.setItem('auth_token', user.token);
      localStorage.setItem('auth_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }
  }, [user]);

  async function login(request: LoginRequest) {
    const resp = await loginUser(request);
    setUser({ userId: resp.userId, email: resp.email, token: resp.token });
  }

  async function register(request: RegisterRequest) {
    const resp = await registerUser(request);
    setUser({ userId: resp.userId, email: resp.email, token: resp.token });
  }

  function logout() {
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: user !== null, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
