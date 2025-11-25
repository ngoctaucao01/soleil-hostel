import api from './api';
import { setCsrfToken, clearCsrfToken } from '../utils/csrf';

/**
 * httpOnly Cookie Authentication Response Format
 *
 * Response DOES NOT include plaintext token.
 * Token stored only in httpOnly cookie (XSS safe).
 * CSRF token returned for X-XSRF-TOKEN header.
 */
export interface HttpOnlyAuthResponse {
  success: boolean;
  message: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
  csrf_token: string;
  expires_in_minutes: number;
  expires_at: string;
  token_type: 'short_lived' | 'long_lived';
}

export interface LoginPayload {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

/**
 * Legacy Response Format (old Bearer token endpoints)
 *
 * DEPRECATED: Use HttpOnlyAuthResponse instead
 * Kept for backward compatibility during transition.
 */
export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: number;
      name: string;
      email: string;
    };
    access_token: string;
    token_type: string;
  };
}

class AuthService {
  /**
   * Login user with httpOnly Cookie
   *
   * ========== httpOnly Cookie Flow ==========
   * 1. POST /api/auth/login-httponly with credentials
   * 2. Backend returns user + csrf_token (NO plaintext token)
   * 3. Browser automatically stores token in httpOnly cookie
   * 4. Axios interceptor adds X-XSRF-TOKEN header for CSRF protection
   *
   * Security:
   * - ✅ Token in httpOnly cookie (XSS cannot access)
   * - ✅ No plaintext token in response body
   * - ✅ CSRF token in sessionStorage (temporary)
   * - ✅ XSS cannot steal token
   */
  async loginHttpOnly(payload: LoginPayload): Promise<HttpOnlyAuthResponse> {
    const response = await api.post<HttpOnlyAuthResponse>('/auth/login-httponly', {
      email: payload.email,
      password: payload.password,
      remember_me: payload.remember_me ?? false,
    });

    // ========== Save CSRF Token ==========
    // Not in httpOnly cookie (XSS can access sessionStorage)
    // But httpOnly cookie is protected by browser
    // Next requests will include cookie automatically
    if (response.data.csrf_token) {
      setCsrfToken(response.data.csrf_token);
    }

    // ========== Token already in httpOnly cookie ==========
    // Browser automatically includes in all requests
    // JavaScript CANNOT access it (that's the point!)

    return response.data;
  }

  /**
   * Register new user with httpOnly Cookie
   *
   * Creates new user + returns httpOnly cookie token
   */
  async registerHttpOnly(payload: RegisterPayload): Promise<HttpOnlyAuthResponse> {
    const response = await api.post<HttpOnlyAuthResponse>('/auth/register', {
      name: payload.name,
      email: payload.email,
      password: payload.password,
      password_confirmation: payload.password_confirmation,
    });

    if (response.data.csrf_token) {
      setCsrfToken(response.data.csrf_token);
    }

    return response.data;
  }

  /**
   * Logout user
   *
   * ========== Logout Flow ==========
   * 1. POST /api/auth/logout-httponly
   * 2. Backend marks token as revoked
   * 3. Backend clears httpOnly cookie
   * 4. Frontend clears sessionStorage
   * 5. Frontend clears user state
   */
  async logoutHttpOnly(): Promise<void> {
    try {
      await api.post('/auth/logout-httponly', {});
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // ========== Frontend Cleanup ==========
      clearCsrfToken();
      sessionStorage.clear();
      localStorage.clear();  // Clear any remaining data from old auth
    }
  }

  /**
   * Get current user from httpOnly cookie token
   *
   * ========== Me Flow ==========
   * 1. GET /api/auth/me-httponly
   * 2. Browser sends httpOnly cookie automatically
   * 3. Backend validates + returns user + token metadata
   */
  async getMeHttpOnly() {
    const response = await api.get<{
      success: boolean;
      user: {
        id: number;
        name: string;
        email: string;
      };
      token: {
        name: string;
        type: 'short_lived' | 'long_lived';
        expires_at: string;
        expires_in_minutes: number;
        last_used_at: string | null;
      };
    }>('/auth/me-httponly');

    return response.data;
  }

  /**
   * ========== LEGACY METHODS (Deprecated) ==========
   * Keep for backward compatibility during transition to httpOnly cookies
   */

  /**
   * DEPRECATED: Use loginHttpOnly instead
   */
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', payload);

    if (response.data.data.access_token) {
      localStorage.setItem('access_token', response.data.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }

    return response.data;
  }

  /**
   * DEPRECATED: Use loginHttpOnly instead
   */
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', payload);

    if (response.data.data.access_token) {
      localStorage.setItem('access_token', response.data.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }

    return response.data;
  }

  /**
   * DEPRECATED: Use logoutHttpOnly instead
   */
  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout', {});
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
    }
  }

  /**
   * DEPRECATED: Use getMeHttpOnly instead
   */
  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  /**
   * DEPRECATED: httpOnly cookies handled by browser
   */
  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  /**
   * Check if user is authenticated via httpOnly cookie
   *
   * Cannot directly check httpOnly cookie from JavaScript.
   * Instead, check if user is in context state or try to fetch /me.
   */
  isAuthenticated(): boolean {
    // httpOnly cookie managed by browser automatically
    // Check context state instead
    return true; // Will be validated in AuthContext
  }

  /**
   * DEPRECATED: Token refresh handled by Axios interceptor
   */
  async refreshToken(): Promise<string> {
    const response = await api.post<{ success: boolean; data: { access_token: string } }>('/auth/refresh', {});

    if (response.data.data.access_token) {
      localStorage.setItem('access_token', response.data.data.access_token);
    }

    return response.data.data.access_token;
  }
}

export default new AuthService();
