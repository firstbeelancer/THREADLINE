import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export interface AuthUser {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  oauth_provider: string | null;
  created_at: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, display_name: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

function getStoredToken(): string | null {
  return localStorage.getItem('access_token');
}

function setStoredToken(token: string): void {
  localStorage.setItem('access_token', token);
}

function setStoredRefresh(token: string): void {
  localStorage.setItem('refresh_token', token);
}

function getStoredRefresh(): string | null {
  return localStorage.getItem('refresh_token');
}

function clearTokens(): void {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getStoredToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: 'Bearer ' + token } : {}),
    ...(options.headers || {}),
  };
  return fetch(API_URL + path, { ...options, headers, credentials: 'include' });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMe = useCallback(async (): Promise<boolean> => {
    const token = getStoredToken();
    if (!token) return false;

    try {
      const res = await apiFetch('/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        return true;
      }

      if (res.status === 401) {
        const refresh_token = getStoredRefresh();
        if (!refresh_token) return false;

        const refreshRes = await fetch(API_URL + '/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token }),
          credentials: 'include',
        });

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          setStoredToken(refreshData.access_token);
          const meRes = await apiFetch('/me');
          if (meRes.ok) {
            const meData = await meRes.json();
            setUser(meData.user);
            return true;
          }
        }

        clearTokens();
        return false;
      }
    } catch {
      // Network error
    }
    return false;
  }, []);

  useEffect(() => {
    fetchMe().finally(() => setIsLoading(false));
  }, [fetchMe]);

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    const res = await fetch(API_URL + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Login failed');
    }

    const data = await res.json();
    setStoredToken(data.access_token);
    setStoredRefresh(data.refresh_token);
    setUser(data.user);
  }, []);

  const register = useCallback(async (email: string, password: string, display_name: string): Promise<void> => {
    const res = await fetch(API_URL + '/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, display_name }),
      credentials: 'include',
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Registration failed');
    }

    const data = await res.json();
    setStoredToken(data.access_token);
    setStoredRefresh(data.refresh_token);
    setUser(data.user);
  }, []);

  const loginWithGoogle = useCallback(async (idToken: string): Promise<void> => {
    const res = await fetch(API_URL + '/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_token: idToken }),
      credentials: 'include',
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Google login failed');
    }

    const data = await res.json();
    setStoredToken(data.access_token);
    setStoredRefresh(data.refresh_token);
    setUser(data.user);
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    const refresh_token = getStoredRefresh();
    try {
      await fetch(API_URL + '/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token }),
        credentials: 'include',
      });
    } catch {
      // Ignore logout errors
    }
    clearTokens();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
  return ctx;
}
