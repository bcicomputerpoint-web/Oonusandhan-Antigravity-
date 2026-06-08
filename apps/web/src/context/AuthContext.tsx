'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserSession } from '@onusandhan/types';

interface AuthContextType {
  user: UserSession | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  register: (
    name: string,
    email: string,
    password: string,
    role: string,
    institutionName?: string
  ) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth`;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  // Check user session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch(`${API_BASE}/me`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          // Send cookies
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            setUser(data.user);
          }
        }
      } catch (err) {
        console.error('Error fetching session:', err);
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        return { success: true, message: data.message || 'Login successful' };
      }
      return { success: false, message: data.message || 'Login failed' };
    } catch (err) {
      return { success: false, message: 'Server unreachable. Please verify backend is active.' };
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    role: string,
    institutionName?: string
  ) => {
    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role, institutionName }),
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        return { success: true, message: data.message || 'Registration successful' };
      }
      return { success: false, message: data.message || 'Registration failed' };
    } catch (err) {
      return { success: false, message: 'Server error' };
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_BASE}/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
