import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getJson, postJson } from '../lib/http-client';

export interface ProfessorIdentity {
  id: string;
  email: string;
}

type AuthState =
  | { status: 'loading'; professor: null }
  | { status: 'unauthenticated'; professor: null }
  | { status: 'authenticated'; professor: ProfessorIdentity };

type AuthContextValue = AuthState & {
  login(email: string, password: string): Promise<void>;
  logout(): Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading', professor: null });

  useEffect(() => {
    let active = true;
    getJson<ProfessorIdentity>('/auth/me')
      .then((professor) => {
        if (active) setState({ status: 'authenticated', professor });
      })
      .catch(() => {
        if (active) setState({ status: 'unauthenticated', professor: null });
      });
    return () => { active = false; };
  }, []);

  async function login(email: string, password: string): Promise<void> {
    const professor = await postJson<ProfessorIdentity>('/auth/login', { email, password });
    setState({ status: 'authenticated', professor });
  }

  async function logout(): Promise<void> {
    await postJson<void>('/auth/logout');
    setState({ status: 'unauthenticated', professor: null });
  }

  return <AuthContext.Provider value={{ ...state, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('AuthProvider is missing');
  return context;
}
