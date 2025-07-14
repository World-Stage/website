'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axiosClient from '@/lib/api/apiClient';

interface User {
  id: string;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  signup: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (token) {
          // Verify token is valid by making a request to get user info
          const response = await axiosClient.get('/auth/me');
          setUser(response.data);
        }
      } catch {
        // Token is invalid, remove it
        localStorage.removeItem('accessToken');
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (identifier: string, password: string) => {
    try {
      const response = await axiosClient.post('/auth/login', {
        username: identifier, // Can be username or email
        password
      });

      const { accessToken, user: userData } = response.data;
      
      // Store the access token
      localStorage.setItem('accessToken', accessToken);
      
      // Set user data
      setUser(userData);
      console.log(userData);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      throw new Error(errorMessage);
    }
  };

  const signup = async (username: string, email: string, password: string) => {
    try {
      const response = await axiosClient.post('/auth/register', {
        username,
        email,
        password
      });

      const { accessToken, user: userData } = response.data;
      
      // Store the access token
      localStorage.setItem('accessToken', accessToken);
      
      // Set user data
      setUser(userData);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Signup failed';
      throw new Error(errorMessage);
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    setUser(null);
  };

  const refreshToken = async () => {
    try {
      const response = await axiosClient.post('/auth/refresh');
      const { accessToken } = response.data;
      localStorage.setItem('accessToken', accessToken);
    } catch (error) {
      // Refresh failed, logout user
      logout();
      throw error;
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    signup,
    logout,
    refreshToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 