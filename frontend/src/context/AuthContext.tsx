'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@/types';
import { api, clearStoredAuth, getStoredToken, getStoredUser, setStoredToken, setStoredUser } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User | null>;
  logout: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => null,
  logout: async () => {},
  isAdmin: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const initAuth = async () => {
      const token = getStoredToken();
      const cachedUser = getStoredUser();

      if (token && cachedUser) {
        setUser(cachedUser);
      } else {
        clearStoredAuth();
        setUser(null);
      }

      if (token) {
        try {
          const res = await api.getMe();
          if (res?.user) {
            setUser(res.user);
            setStoredUser(res.user);
          } else {
            clearStoredAuth();
            setUser(null);
          }
        } catch (err: any) {
          clearStoredAuth();
          setUser(null);
        }
      } else {
        clearStoredAuth();
        setUser(null);
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<User | null> => {
    const res = await api.login(email, password);
    if (res?.user) {
      setUser(res.user);
      return res.user;
    }
    return null;
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore errors on logout
    } finally {
      clearStoredAuth();
      setUser(null);
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAdmin: user?.role === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
