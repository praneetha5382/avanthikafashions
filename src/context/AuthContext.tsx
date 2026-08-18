'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  userPhone: string | null;
  isLoggedIn: boolean;
  login: (phone: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userPhone, setUserPhone] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const savedPhone = localStorage.getItem('userPhone');
    if (savedPhone) {
      setUserPhone(savedPhone);
      setIsLoggedIn(true);
    }
  }, []);

  const login = (phone: string) => {
    setUserPhone(phone);
    setIsLoggedIn(true);
    localStorage.setItem('userPhone', phone);
  };

  const logout = () => {
    setUserPhone(null);
    setIsLoggedIn(false);
    localStorage.removeItem('userPhone');
  };

  return (
    <AuthContext.Provider value={{ userPhone, isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
