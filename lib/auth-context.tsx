'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loginToDirectus, getAuthDetails, removeToken, clearAuthCookies } from './auth';

interface User {
  email: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in on initial load
    const checkAuth = async () => {
      try {
        const authDetails = getAuthDetails();
        if (authDetails) {
          // User has valid tokens in localStorage
          // We could fetch user details from Directus here if needed
          setUser({ email: 'authenticated' }); // Placeholder
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const authData = await loginToDirectus(email, password);

      if (authData?.data?.access_token) {
        setUser({ email });
        router.push('/');
        return true;
      } else {
        throw new Error('Login failed. Please check your credentials.');
      }
    } catch (error: unknown) {
      const errorMessage = (error instanceof Error) ? error.message : 'Login failed';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    // Clear Directus tokens from localStorage
    removeToken();

    // Clear HttpOnly cookies via API
    await clearAuthCookies();

    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, error }}>
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