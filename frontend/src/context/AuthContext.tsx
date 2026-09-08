import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: { email: string; password: string }) => Promise<void>;
  register: (data: { name: string; email: string; password: string; role?: User['role']; networkCode?: string; partnerName?: string; advertiserId?: string; advertiserName?: string }) => Promise<void>;
  registerUserByAdmin: (data: { name: string; email: string; password: string; role?: User['role']; networkCode?: string; partnerName?: string; advertiserId?: string; advertiserName?: string; status?: 'active' | 'deactivated'; mustChangePassword?: boolean }) => Promise<User>;
  changePassword: (data: { currentPassword?: string; newPassword: string }) => Promise<void>;
  updateCurrentUser: (user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isPartnerScoped: boolean;
  isAdvertiserScoped: boolean;
  activeNetworkCode: string;
  setActiveNetworkCode: (code: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [adminSelectedNetwork, setAdminSelectedNetwork] = useState<string>('ALL');

  useEffect(() => {
    async function initAuth() {
      const token = localStorage.getItem('gam_auth_token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const currentUser = await api.getMe();
        setUser(currentUser);
      } catch (err) {
        console.warn('Session expired or invalid, logging out:', err);
        localStorage.removeItem('gam_auth_token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    initAuth();
  }, []);

  const login = async (data: { email: string; password: string }) => {
    const res = await api.login(data);
    localStorage.setItem('gam_auth_token', res.token);
    setUser(res.user);
  };

  const register = async (data: { name: string; email: string; password: string; role?: User['role']; networkCode?: string; partnerName?: string; advertiserId?: string; advertiserName?: string }) => {
    const res = await api.register(data);
    localStorage.setItem('gam_auth_token', res.token);
    setUser(res.user);
  };

  // Admin registers a user without overwriting their own admin session
  const registerUserByAdmin = async (data: {
    name: string;
    email: string;
    password: string;
    role?: User['role'];
    networkCode?: string;
    partnerName?: string;
    advertiserId?: string;
    advertiserName?: string;
    status?: 'active' | 'deactivated';
    mustChangePassword?: boolean;
  }): Promise<User> => {
    const res = await api.register(data);
    return res.user;
  };

  const changePassword = async (data: { currentPassword?: string; newPassword: string }) => {
    const res = await api.changePassword(data);
    if (res.user) {
      setUser(res.user);
    } else if (user) {
      setUser({ ...user, mustChangePassword: false });
    }
  };

  const updateCurrentUser = (updated: User) => {
    setUser(updated);
  };

  const logout = () => {
    localStorage.removeItem('gam_auth_token');
    setUser(null);
    setAdminSelectedNetwork('ALL');
  };

  const isAdmin = Boolean(user && user.role === 'admin');
  const isPartnerScoped = Boolean(user && user.role !== 'admin' && user.networkCode && user.networkCode !== 'ALL');
  const isAdvertiserScoped = Boolean(
    user &&
    user.role !== 'admin' &&
    user.advertiserName &&
    user.advertiserName !== 'All Advertisers' &&
    user.advertiserId !== 'ALL'
  );
  const activeNetworkCode = isPartnerScoped ? (user?.networkCode || 'ALL') : adminSelectedNetwork;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        registerUserByAdmin,
        changePassword,
        updateCurrentUser,
        logout,
        isAuthenticated: Boolean(user),
        isAdmin,
        isPartnerScoped,
        isAdvertiserScoped,
        activeNetworkCode,
        setActiveNetworkCode: (code: string) => {
          if (isAdmin) {
            setAdminSelectedNetwork(code);
          }
        }
      }}
    >
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
