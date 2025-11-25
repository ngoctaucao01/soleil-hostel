import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService, { LoginPayload, RegisterPayload, HttpOnlyAuthResponse } from '../services/auth';
import { clearCsrfToken } from '../utils/csrf';

export interface User {
  id: number;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  loginHttpOnly: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  registerHttpOnly: (name: string, email: string, password: string, passwordConfirmation: string) => Promise<void>;
  logoutHttpOnly: () => Promise<void>;
  me: () => Promise<User | null>;
  clearError: () => void;

  // Legacy methods (deprecated - kept for backward compatibility)
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, passwordConfirmation: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider - Manages authentication state with httpOnly cookies
 *
 * ========== httpOnly Cookie Authentication ==========
 * - Token stored in httpOnly cookie (XSS safe)
 * - CSRF token in sessionStorage (temporary, for X-XSRF-TOKEN header)
 * - Browser automatically sends httpOnly cookie
 * - Axios interceptor handles 401 refresh + retry
 * - Logout clears both token + sessionStorage
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Validate token on mount by calling /me endpoint
  useEffect(() => {
    const validateToken = async () => {
      try {
        // ========== VALIDATE TOKEN FROM COOKIE ==========
        // Browser sends httpOnly cookie automatically
        // Returns 401 if token expired/revoked
        const meResponse = await authService.getMeHttpOnly();
        setUser(meResponse.user);
        setError(null);
      } catch (err: any) {
        // No valid token, user not authenticated
        setUser(null);
        console.warn('Token validation failed:', err?.response?.status);
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, []);

  /**
   * LOGIN with httpOnly Cookie
   *
   * ========== Flow ==========
   * 1. POST /api/auth/login-httponly with credentials
   * 2. Backend returns user + csrf_token (NO plaintext token)
   * 3. Browser automatically stores token in httpOnly cookie
   * 4. Save CSRF token to sessionStorage for X-XSRF-TOKEN header
   * 5. Axios interceptor handles automatic refresh on 401
   */
  const loginHttpOnly = useCallback(async (email: string, password: string, rememberMe: boolean = false) => {
    setLoading(true);
    setError(null);

    try {
      const response = await authService.loginHttpOnly({
        email,
        password,
        remember_me: rememberMe,
      });

      // ========== Save User ==========
      setUser(response.user);
      setError(null);

      // ========== Token already in httpOnly cookie ==========
      // Browser automatically includes in all requests
      // JavaScript CANNOT access it (that's the point!)
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Login failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * REGISTER with httpOnly Cookie
   */
  const registerHttpOnly = useCallback(
    async (name: string, email: string, password: string, passwordConfirmation: string) => {
      setLoading(true);
      setError(null);

      try {
        const response = await authService.registerHttpOnly({
          name,
          email,
          password,
          password_confirmation: passwordConfirmation,
        });

        setUser(response.user);
        setError(null);
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || 'Registration failed';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * LOGOUT with httpOnly Cookie
   *
   * ========== Flow ==========
   * 1. POST /api/auth/logout-httponly
   * 2. Backend marks token as revoked
   * 3. Backend clears httpOnly cookie
   * 4. Frontend clears sessionStorage
   * 5. Frontend clears user state
   */
  const logoutHttpOnly = useCallback(async () => {
    setLoading(true);

    try {
      // Backend revokes token + clears cookie
      await authService.logoutHttpOnly();

      // Frontend cleanup
      setUser(null);
      clearCsrfToken();
      setError(null);
    } catch (err) {
      console.error('Logout error:', err);
      // Even if API call fails, clear local state
      setUser(null);
      clearCsrfToken();
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * ME - Get current user from token
   *
   * ========== Flow ==========
   * 1. GET /api/auth/me-httponly
   * 2. Browser sends httpOnly cookie automatically
   * 3. Backend validates + returns user + token metadata
   */
  const me = useCallback(async (): Promise<User | null> => {
    try {
      const meResponse = await authService.getMeHttpOnly();
      setUser(meResponse.user);
      return meResponse.user;
    } catch (err) {
      setUser(null);
      throw err;
    }
  }, []);

  /**
   * ========== LEGACY METHODS (Deprecated) ==========
   * Keep for backward compatibility during transition to httpOnly cookies
   */

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await authService.login({ email, password });
      setUser(response.data.user);
      setError(null);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Login failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string, passwordConfirmation: string) => {
      setLoading(true);
      setError(null);

      try {
        const response = await authService.register({
          name,
          email,
          password,
          password_confirmation: passwordConfirmation,
        });

        setUser(response.data.user);
        setError(null);
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || 'Registration failed';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const logout = useCallback(async () => {
    setLoading(true);

    try {
      await authService.logout();
      setUser(null);
      setError(null);
    } catch (err) {
      console.error('Logout error:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        error,
        loginHttpOnly,
        registerHttpOnly,
        logoutHttpOnly,
        me,
        clearError,
        // Legacy
        login,
        register,
        logout,
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
