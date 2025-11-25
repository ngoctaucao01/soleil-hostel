# 🔐 SECURITY HEADERS - QUICK START GUIDE

## ✅ Implementation Complete (14/14 Tests Passing)

### What Was Deployed

1. **SecurityHeaders Middleware** (`app/Http/Middleware/SecurityHeaders.php`)
   - 9 critical security headers
   - Automatic nonce generation per request
   - Dev vs production CSP switching

2. **Security Configuration** (`config/security-headers.php`)
   - Flexible per-environment settings
   - CSP reporting configuration

3. **Vite Plugin** (`vite-plugin-csp-nonce.js`)
   - Automatic nonce injection into production bundles
   - Works with React/Vite seamlessly

4. **CSP Violation Reporting** (`CspViolationReportController`)
   - Receives browser violation reports
   - Logs for debugging

5. **Blade Integration**
   - `@nonce` directive for templates
   - `csp_nonce()` helper function

6. **Verification Scripts**
   - Bash: `scripts/check-security-headers.sh`
   - PowerShell: `scripts/check-security-headers.ps1`

7. **Comprehensive Tests** (14 tests, all passing ✅)
   - Verify all 9 headers present
   - Check header values
   - Test nonce generation
   - Test violation reporting

---

## 🚀 Usage

### For Development

No changes needed! Development environment automatically:
- Allows `localhost:5173` (Vite dev server)
- Allows `unsafe-eval` and `unsafe-inline`
- Enables fast hot reload
- CSP reporting disabled by default

```bash
npm run dev          # Frontend (Vite dev)
php artisan serve    # Backend (Laravel dev)
```

### For Inline Scripts

Use the `@nonce` directive in Blade:

```blade
<script nonce="@nonce">
  console.log('This script is protected by CSP nonce');
</script>

<style nonce="@nonce">
  body { background: white; }
</style>
```

Or use the helper function:

```blade
<script nonce="{{ csp_nonce() }}">
  // Script content
</script>
```

### For React Components

The Vite plugin automatically injects nonce into React bundle. No changes needed in React code.

### Check Headers Locally

**Linux/Mac**:
```bash
bash scripts/check-security-headers.sh http://localhost:8000
```

**Windows PowerShell**:
```powershell
powershell -ExecutionPolicy Bypass -File scripts/check-security-headers.ps1 -Url "http://localhost:8000"
```

**Expected Output**:
```
✓ Strict-Transport-Security
✓ X-Frame-Options
✓ X-Content-Type-Options
✓ Referrer-Policy
✓ Permissions-Policy
✓ Cross-Origin-Opener-Policy
✓ Cross-Origin-Embedder-Policy
✓ Cross-Origin-Resource-Policy
✓ Content-Security-Policy

Grade: A+ (9/9 headers)
```

---

## 📋 Environment Variables

Add to `.env`:

```bash
# CSP Violation Reporting (optional, for debugging)
CSP_REPORTING=false          # Set to true to enable violation reports

# HSTS Configuration
HSTS_PRELOAD=false          # Set to true after DNS validates
HSTS_MAX_AGE=63072000       # 2 years (standard)

# Vite Dev Server
VITE_DEV_SERVER_HOST=localhost:5173

# Security Headers in Local Environment
SECURITY_HEADERS_LOCAL=true  # Set to false to disable in local dev
```

---

## 🧪 Run Tests

```bash
cd backend

# Run all security header tests
php artisan test tests/Feature/Security/SecurityHeadersTest.php

# Expected: 14 passed ✅
```

---

## 🔍 Monitor CSP Violations

Enable CSP violation reporting to catch configuration issues:

```bash
# .env
CSP_REPORTING=true
```

Browser will send violations to `POST /api/csp-violation-report`

Check logs:
```bash
tail -f storage/logs/laravel.log | grep "CSP Violation"
```

---

## 📖 Headers Explained (Short Version)

| Header | Purpose | Value |
|--------|---------|-------|
| **HSTS** | Force HTTPS | 2 years + preload |
| **X-Frame-Options** | Prevent clickjacking | DENY |
| **X-Content-Type-Options** | Prevent MIME sniffing | nosniff |
| **Referrer-Policy** | Control referrer | strict-origin-when-cross-origin |
| **Permissions-Policy** | Disable dangerous APIs | camera=(), microphone=(), etc |
| **COOP** | Prevent window takeover | same-origin |
| **COEP** | Prevent Spectre | require-corp |
| **CORP** | Control resource loading | same-origin |
| **CSP** | Prevent XSS | nonce-based strict-dynamic |

---

## 🎯 Security Grade

**Before**: F (No headers)  
**After**: ✅ A+ (All 9 critical headers)  
**Breakdown**:
- HSTS (Force HTTPS) ✅
- X-Frame-Options (Clickjacking) ✅
- X-Content-Type-Options (MIME sniffing) ✅
- Referrer-Policy (Privacy) ✅
- Permissions-Policy (API control) ✅
- COOP/COEP (Spectre) ✅
- CORP (Resource loading) ✅
- CSP (XSS prevention) ✅

---

## ⚠️ Common Issues

**Q: "Refused to execute inline script"**
- A: Add `nonce="@nonce"` to the `<script>` tag

**Q: "Refused to load stylesheet"**
- A: Add `nonce="@nonce"` to the `<style>` tag

**Q: "CSP violation for connect-src"**
- A: Check API URL, add to CSP allow-list if needed

**Q: "Vite HMR not working in dev"**
- A: Ensure `localhost:5173` is allowed in dev CSP (automatic)

---

## 📚 Resources

- **OWASP CSP Cheat Sheet**: https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html
- **securityheaders.com**: https://securityheaders.com (free header checker)
- **Mozilla Observatory**: https://observatory.mozilla.org (comprehensive audit)
- **MDN HTTP Headers**: https://developer.mozilla.org/en-US/docs/Web/HTTP
- **HSTS Preload**: https://hstspreload.org

---

## ✅ Checklist for Production

- [x] Middleware registered
- [x] All tests passing (14/14)
- [x] Config file created
- [x] Vite plugin integrated
- [x] Blade @nonce directive available
- [x] CSP violation endpoint ready
- [x] Documentation complete
- [ ] `.env` configured (CSP_REPORTING, HSTS_PRELOAD, etc)
- [ ] Tested in production-like environment
- [ ] Submitted to HSTS preload (optional)
- [ ] Monitoring alerts configured

---

## 🚀 Deploy to Production

1. **Build**: `npm run build && php artisan config:cache`
2. **Verify**: `bash scripts/check-security-headers.sh https://yourdomain.com`
3. **Monitor**: Check CSP violation logs for 24 hours
4. **Preload**: Submit to HSTS preload at https://hstspreload.org (optional)

---

**Status**: ✅ Production Ready  
**Tests**: 14/14 Passing  
**Grade**: A+ Secure  

**不要讓駭客進家裡。現在你的門已經鎖上了。🔐**
