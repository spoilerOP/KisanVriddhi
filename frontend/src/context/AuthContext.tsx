import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

interface User {
  id?: number;
  username: string;
  role: string;
  farmer_id?: string | null;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (payload: any) => Promise<void>;
  register: (authPayload: any, profilePayload: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshMe = async () => {
    try {
      const data = await api.getMe();
      if (data) {
        setUser({
          username: data.username,
          role: data.role,
          farmer_id: data.farmer_id,
          name: data.name
        });
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshMe();
  }, []);

  const login = async (payload: any) => {
    const data = await api.login(payload);
    setUser({
      username: payload.username,
      role: data.role,
      farmer_id: data.farmer_id,
      name: data.name
    });
  };

  const register = async (authPayload: any, profilePayload: any) => {
    const data = await api.register(authPayload, profilePayload);
    setUser({
      username: authPayload.username,
      role: data.role,
      farmer_id: data.farmer_id,
      name: data.name
    });
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshMe }}>
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
