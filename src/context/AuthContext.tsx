import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService, LoginPayload, RegisterPayload } from '../services/api/authService';
import { chatService } from '../services/api/chatService';
import { wsClient } from '../services/websocket/WebSocketClient';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  updateProfile: (displayName: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Restore session
    const session = authService.getCurrentSession();
    if (session) {
      setUser(session.user);
      setToken(session.token);
      chatService.setUserId(session.user.id);
      wsClient.connect(session.token);
    }
    setIsLoading(false);
  }, []);

  const login = async (payload: LoginPayload) => {
    const res = await authService.login(payload);
    setUser(res.user);
    setToken(res.token);
    chatService.setUserId(res.user.id);
    wsClient.connect(res.token);
  };

  const register = async (payload: RegisterPayload) => {
    const res = await authService.register(payload);
    setUser(res.user);
    setToken(res.token);
    chatService.setUserId(res.user.id);
    wsClient.connect(res.token);
  };

  const logout = () => {
    authService.logout();
    wsClient.disconnect();
    setUser(null);
    setToken(null);
  };

  const updateProfile = async (displayName: string) => {
    if (!user) return;
    const updated = await authService.updateProfile(user.id, { displayName });
    setUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
