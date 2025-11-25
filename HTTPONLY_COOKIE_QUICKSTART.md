# httpOnly Cookie Authentication - Quick Start Guide

## 🚀 5-Step Frontend Implementation

This guide walks you through the minimal changes needed to migrate from localStorage Bearer tokens to httpOnly cookies.

---

## Step 1: Update Axios Configuration (api.ts)

**File**: `frontend/src/api.ts` or `frontend/src/services/api.ts`

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.VITE_API_URL || 'http://localhost:8000/api',
  withCredentials: true,  // ⚡ CRITICAL: Send cookies with requests
});

/**
 * Request Interceptor: Add X-XSRF-TOKEN for CSRF protection
 * 
 * CSRF Token Flow:
 * 1. Login response contains csrf_token
 * 2. Save to sessionStorage
 * 3. Add X-XSRF-TOKEN header to non-GET requests
 */
api.interceptors.request.use((config) => {
  // Only add CSRF token for non-GET requests
  if (config.method && ['post', 'put', 'patch', 'delete'].includes(config.method)) {
    const csrfToken = sessionStorage.getItem('csrf_token');
    if (csrfToken) {
      config.headers['X-XSRF-TOKEN'] = csrfToken;
    }
  }

  return config;
});

/**
 * Response Interceptor: Handle 401 with automatic refresh
 * 
 * Token Expiration Flow:
 * 1. Protected endpoint returns 401
 * 2. Check if already retried (prevent infinite loop)
 * 3. Call /api/auth/refresh-httponly
 * 4. Retry original request
 * 5. If refresh also fails → logout + redirect
 */
api.interceptors.response.use(
  (response) => {
    // Success - return as-is
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Only retry on 401 Unauthorized, and only once
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // ========== REFRESH TOKEN ==========
        // Browser automatically sends httpOnly cookie
        // Backend returns new csrf_token + refreshed token in new cookie
        const refreshResponse = await api.post('/auth/refresh-httponly');

        // Update CSRF token from refresh response
        if (refreshResponse.data.csrf_token) {
          sessionStorage.setItem('csrf_token', refreshResponse.data.csrf_token);
        }

        // ========== RETRY ORIGINAL REQUEST ==========
        // Now with new token in httpOnly cookie
        return api(originalRequest);
      } catch (refreshError) {
        // ========== REFRESH FAILED ==========
        // Token is invalid/expired/revoked - force logout
        sessionStorage.clear();
        localStorage.clear();  // Clear any remaining data

        // Redirect to login
        window.location.href = '/login';

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

---

## Step 2: Update useAuth Hook

**File**: `frontend/src/hooks/useAuth.tsx` or `frontend/src/context/AuthContext.tsx`

```typescript
import { createContext, useContext, useState, useCallback } from 'react';
import api from '../api';

interface User {
  id: number;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  me: () => Promise<User | null>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * LOGIN - Get httpOnly cookie
   * 
   * Flow:
   * 1. POST /api/auth/login-httponly with credentials
   * 2. Backend returns user + csrf_token (NOT plaintext token!)
   * 3. Browser automatically stores token in httpOnly cookie
   * 4. Save csrf_token to sessionStorage for CSRF header
   * 5. Save user to state
   */
  const login = useCallback(
    async (email: string, password: string, rememberMe: boolean = false) => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.post('/auth/login-httponly', {
          email,
          password,
          remember_me: rememberMe, // false = short_lived (1h), true = long_lived (30d)
        });

        // ========== Save CSRF Token ==========
        // Not in httpOnly cookie (XSS can't steal)
        // Browser will auto-send in next requests
        if (response.data.csrf_token) {
          sessionStorage.setItem('csrf_token', response.data.csrf_token);
        }

        // ========== Save User ==========
        setUser(response.data.user);

        // ========== Token already in httpOnly cookie ==========
        // Browser automatically includes in all requests
        // JavaScript CANNOT access it (that's the point!)

        return response.data;
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || 'Login failed';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * LOGOUT - Revoke token + clear state
   * 
   * Flow:
   * 1. POST /api/auth/logout-httponly
   * 2. Backend marks token as revoked
   * 3. Backend clears httpOnly cookie
   * 4. Frontend clears sessionStorage
   * 5. Frontend clears user state
   */
  const logout = useCallback(async () => {
    setLoading(true);

    try {
      // Backend revokes token + clears cookie
      await api.post('/auth/logout-httponly');

      // Frontend cleanup
      sessionStorage.clear();
      localStorage.clear();
      setUser(null);
      setError(null);
    } catch (err) {
      console.error('Logout error:', err);
      // Even if API call fails, clear local state
      sessionStorage.clear();
      localStorage.clear();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * ME - Get current user from token
   * 
   * Flow:
   * 1. GET /api/auth/me-httponly
   * 2. Browser sends httpOnly cookie automatically
   * 3. Backend validates + returns user + token metadata
   */
  const me = useCallback(async (): Promise<User | null> => {
    try {
      const response = await api.get('/auth/me-httponly');

      setUser(response.data.user);
      return response.data.user;
    } catch (err) {
      setUser(null);
      throw err;
    }
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    error,
    login,
    logout,
    me,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
```

---

## Step 3: Update Login Form Component

**File**: `frontend/src/components/LoginForm.tsx` or wherever login is handled

```typescript
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export function LoginForm() {
  const { login, loading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, checked, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (error) clearError();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      // ========== LOGIN WITH httpOnly COOKIE ==========
      await login(formData.email, formData.password, formData.rememberMe);

      // ✅ Token stored in httpOnly cookie (browser managed)
      // ✅ CSRF token saved to sessionStorage
      // ✅ Axios interceptor will auto-add X-XSRF-TOKEN header
      // ✅ XSS cannot access token

      // Redirect on success
      navigate('/dashboard');
    } catch (err) {
      // Error already set in context, will display below
      console.error('Login error:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <h1>Login</h1>

      {error && <div className="error-message">{error}</div>}

      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          disabled={loading}
          required
          autoComplete="email"
        />
      </div>

      <div className="form-group">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          disabled={loading}
          required
          autoComplete="current-password"
        />
      </div>

      <div className="form-group">
        <label htmlFor="rememberMe">
          <input
            id="rememberMe"
            type="checkbox"
            name="rememberMe"
            checked={formData.rememberMe}
            onChange={handleChange}
            disabled={loading}
          />
          Remember me (30 days)
        </label>
      </div>

      <button type="submit" disabled={loading} className="submit-button">
        {loading ? 'Logging in...' : 'Login'}
      </button>

      <p className="forgot-password">
        <a href="/forgot-password">Forgot password?</a>
      </p>
    </form>
  );
}
```

---

## Step 4: Update Protected Routes

**File**: `frontend/src/components/ProtectedRoute.tsx` or `frontend/src/components/PrivateRoute.tsx`

```typescript
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, me } = useAuth();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // On component mount, validate token
    const validateToken = async () => {
      if (!user && !loading) {
        try {
          // ========== VALIDATE TOKEN FROM COOKIE ==========
          // Browser sends httpOnly cookie automatically
          // Returns 401 if token expired/revoked
          // Axios interceptor will handle refresh
          await me();
        } catch (err) {
          console.error('Token validation failed:', err);
          // me() hook will handle redirect via interceptor
        }
      }

      setInitialized(true);
    };

    validateToken();
  }, [user, loading, me]);

  // Still loading token validation
  if (!initialized || loading) {
    return (
      <div className="loading-page">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // No user = not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // User authenticated, render children
  return <>{children}</>;
}
```

---

## Step 5: Remove Old localStorage Code

**CRITICAL**: Search entire codebase for and DELETE:

```bash
# Search for localStorage
grep -r "localStorage" frontend/src/

# Results should be EMPTY (no token storage in localStorage)
```

Delete any lines like:
```typescript
❌ localStorage.setItem('token', response.data.token)
❌ localStorage.getItem('token')
❌ const token = localStorage.getItem('access_token')
❌ localStorage.setItem('access_token', ...)
❌ localStorage.removeItem('token')
❌ if (localStorage.getItem('token')) { ... }
```

---

## Step 6: Add CSRF Token Pre-fetch (Optional)

**File**: `frontend/src/main.tsx` or `frontend/src/App.tsx`

```typescript
import { useEffect } from 'react';
import api from './api';

/**
 * Pre-fetch CSRF token before login for faster login experience
 * (Optional optimization - not required)
 */
function App() {
  useEffect(() => {
    // Pre-fetch CSRF token on app load
    api
      .get('/auth/csrf-token')
      .then((response) => {
        sessionStorage.setItem('csrf_token', response.data.csrf_token);
      })
      .catch((err) => {
        console.warn('Failed to pre-fetch CSRF token:', err);
        // Not critical - will get fresh token on login
      });
  }, []);

  return (
    // ... rest of app
  );
}

export default App;
```

---

## Browser DevTools Verification

After login, verify in Chrome DevTools:

### Application Tab → Cookies
```
✅ soleil_token cookie visible
✅ HttpOnly flag: YES (cannot access via JS)
✅ Secure flag: YES (production only)
✅ SameSite: Strict
```

### Application Tab → Local Storage
```
❌ NO 'token' key
❌ NO 'access_token' key
❌ NO 'bearer_token' key
```

### Application Tab → Session Storage
```
✅ csrf_token key present (temporary, cleared on browser close)
```

### Network Tab
```
✅ POST /api/auth/login-httponly
   Response Headers:
   - Set-Cookie: soleil_token=<uuid>; HttpOnly; Secure; SameSite=Strict

✅ POST /api/bookings (protected endpoint)
   Request Headers:
   - Cookie: soleil_token=<uuid>  (auto-included by browser)
   - X-XSRF-TOKEN: <csrf_token>   (added by Axios interceptor)

   No "Authorization: Bearer <token>" header!
```

### Console - Verify XSS Protection
```javascript
// In DevTools console, try to access token:

// ❌ This will return empty (httpOnly cookie not included)
document.cookie
// Result: "csrf_token=abc123" (only sessionStorage, no httpOnly)

// ❌ This will be empty (we removed it)
localStorage.getItem('token')
// Result: null

// ✅ This works (sessionStorage is accessible)
sessionStorage.getItem('csrf_token')
// Result: "xyz789..."
```

---

## Testing

### Manual Test Sequence

```bash
# 1. Open application in browser
http://localhost:3000/login

# 2. Check DevTools Cookies before login
# Should NOT have soleil_token

# 3. Fill form + click Login
email: test@example.com
password: password123

# 4. Check DevTools Cookies after login
# Should have soleil_token (HttpOnly flag)

# 5. Navigate to protected page
# Should work (httpOnly cookie sent automatically)

# 6. Check DevTools Storage
Application → Cookies: ✅ soleil_token (HttpOnly)
Application → Local Storage: ❌ No token
Application → Session Storage: ✅ csrf_token

# 7. Open protected page in new tab (same browser)
# Should still work (httpOnly cookie shared)

# 8. Logout
# Check DevTools Cookies: soleil_token should be gone

# 9. Try to access protected page
# Should redirect to /login
```

### Automated Test

```typescript
// src/__tests__/auth.integration.test.ts

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '../components/LoginForm';
import { AuthProvider } from '../hooks/useAuth';

test('login stores token in httpOnly cookie (not localStorage)', async () => {
  render(
    <AuthProvider>
      <LoginForm />
    </AuthProvider>
  );

  // Fill + submit
  await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
  await userEvent.type(screen.getByLabelText(/password/i), 'password123');
  await userEvent.click(screen.getByText(/login/i));

  // Verify NO localStorage token
  expect(localStorage.getItem('token')).toBeNull();
  expect(localStorage.getItem('access_token')).toBeNull();

  // Verify sessionStorage has CSRF token
  expect(sessionStorage.getItem('csrf_token')).toBeTruthy();
});
```

---

## Troubleshooting

### Issue: 401 Unauthorized on Every Request

**Symptom**: Even after login, protected endpoints return 401

**Solution**:
1. Check DevTools Network: Is `soleil_token` cookie sent?
   - If NO: Verify `withCredentials: true` in axios
   - If YES: Verify backend is checking the right cookie name

2. Check cookie domain:
   - Frontend: `localhost:3000`
   - Backend: `localhost:8000`
   - Need same domain OR use `Domain=.localhost`

**Fix**:
```typescript
// api.ts
axios.create({
  baseURL: 'http://localhost:8000/api',
  withCredentials: true,  // ⚡ CRITICAL
});

// .env
VITE_API_URL=http://localhost:8000/api
```

### Issue: CSRF Token Mismatch

**Symptom**: POST requests fail with 419 TokenMismatchException

**Solution**:
1. Verify X-XSRF-TOKEN header is sent:
   - Chrome DevTools → Network → POST request → Request Headers
   - Should show `X-XSRF-TOKEN: <value>`

2. Verify token is fresh:
   - CSRF token from login response (not old)
   - Check sessionStorage after login

**Fix**:
```typescript
// api.ts - Ensure interceptor adds header
api.interceptors.request.use((config) => {
  const csrfToken = sessionStorage.getItem('csrf_token');
  if (csrfToken && config.method !== 'get') {
    config.headers['X-XSRF-TOKEN'] = csrfToken;  // ⚡ Must match key
  }
  return config;
});
```

### Issue: Infinite Redirect Loop

**Symptom**: Keeps redirecting to /login

**Solution**:
1. Check if refresh endpoint is working:
   - Chrome DevTools → Network → filter `/refresh-httponly`
   - Should return 200 with new csrf_token

2. Check if retry flag is set:
   - Without `originalRequest._retry`, will infinite loop

**Fix**:
```typescript
// api.ts
if (error.response?.status === 401 && !originalRequest._retry) {
  originalRequest._retry = true;  // ⚡ Prevent loop
  // ... refresh logic ...
}
```

---

## Success Checklist

- [ ] Login endpoint works: `POST /api/auth/login-httponly`
- [ ] httpOnly cookie set in browser
- [ ] CSRF token in response + saved to sessionStorage
- [ ] Protected endpoints work (auto-send cookie)
- [ ] 401 triggers automatic refresh + retry
- [ ] Logout revokes token + clears cookie
- [ ] No tokens in localStorage
- [ ] No tokens in plaintext responses
- [ ] XSS simulation cannot access token via JavaScript

---

## Next Steps

1. Implement the 6 steps above
2. Run tests: `npm test`
3. Manual browser testing
4. Verify DevTools (see "Browser DevTools Verification" section)
5. Deploy to production (set `SESSION_SECURE_COOKIE=true` in .env)

---

## Questions?

Refer to:
- [Full httpOnly Implementation Guide](./HTTPONLY_COOKIE_IMPLEMENTATION.md)
- [Backend Implementation](./HTTPONLY_COOKIE_COMPLETE.md)
- [Token Expiration Documentation](./TOKEN_EXPIRATION_IMPLEMENTATION.md)
