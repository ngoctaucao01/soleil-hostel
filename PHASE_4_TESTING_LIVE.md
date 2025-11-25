# 🧪 Phase 4 Testing - LIVE EXECUTION GUIDE

**Date**: November 23, 2025  
**Status**: 🟢 BOTH SERVERS RUNNING & BROWSER OPEN  
**Backend**: http://127.0.0.1:8000 ✅  
**Frontend**: http://localhost:5173 ✅  

---

## ✅ Current Status

```
✅ Backend Server:     RUNNING on http://127.0.0.1:8000
✅ Frontend Server:    RUNNING on http://localhost:5173
✅ Browser:            OPEN to http://localhost:5173
✅ Ready for Testing:  YES

Next Step: Follow the testing steps below
```

---

## 📋 Phase 4 Testing Execution Plan

### TEST 1: Login & Verify httpOnly Cookie (15 min)

**Step 1.1**: Navigate to Login Page
```
Browser URL: http://localhost:5173/login
(or click Login link if available)
```

**Step 1.2**: Enter Test Credentials
```
Email:    test@example.com
Password: password
Click: Login button
```

**Expected**: 
- ✅ Page redirects to dashboard/home
- ✅ No errors in console
- ✅ Logged in successfully

**Step 1.3**: Open DevTools
```
Press F12 (or Ctrl+Shift+I)
Go to: Application tab
Left sidebar: Cookies
Select: http://localhost:5173
```

**Expected to See**:
```
Cookie Name:     soleil_token
Value:           (long UUID string like: 550e8400-e29b-41d4-a716-446655440000)
Domain:          localhost
Path:            /
Expires:         (some date/time in future)
HttpOnly:        ✓ (checked)
Secure:          (unchecked OK for localhost)
SameSite:        Strict
```

✅ **VERIFICATION CHECKPOINT 1**: If you see all above → httpOnly cookie is working!

---

### TEST 2: Verify localStorage is Empty (10 min)

**Step 2.1**: In DevTools (still have it open)
```
Left sidebar: Local Storage
Click: http://localhost:5173
```

**Expected to See**:
```
EMPTY storage (no 'access_token', no 'token', no 'user')

OR

Only app configuration keys (like 'theme', 'language', etc)
NO authentication tokens should exist
```

✅ **VERIFICATION CHECKPOINT 2**: If localStorage is empty → XSS protection working!

---

### TEST 3: Verify sessionStorage has CSRF Token (10 min)

**Step 3.1**: In DevTools (still open)
```
Left sidebar: Session Storage
Click: http://localhost:5173
```

**Expected to See**:
```
Key: csrf_token
Value: (looks like a token hash/string)

This is TEMPORARY - cleared when you close the browser
```

✅ **VERIFICATION CHECKPOINT 3**: If csrf_token exists → CSRF protection ready!

---

### TEST 4: Test XSS Protection (JavaScript Cannot Access Token) (10 min)

**Step 4.1**: Open DevTools Console
```
Press F12
Click: Console tab (bottom of DevTools)
```

**Step 4.2**: Run These Commands One By One

**Command 1**: Check localStorage for token
```javascript
localStorage.getItem('access_token')
```
**Expected Output**: `null` ✅

**Command 2**: Check localStorage for token (alternate name)
```javascript
localStorage.getItem('token')
```
**Expected Output**: `null` ✅

**Command 3**: Check sessionStorage for CSRF (this should exist!)
```javascript
sessionStorage.getItem('csrf_token')
```
**Expected Output**: `"token_value_here"` ✅

**Command 4**: Check document.cookie
```javascript
document.cookie
```
**Expected Output**: Does NOT show token values (httpOnly prevents it) ✅

✅ **VERIFICATION CHECKPOINT 4**: All above return expected values → XSS is prevented!

---

### TEST 5: Verify CSRF Token Header in API Requests (15 min)

**Step 5.1**: Keep DevTools Open
```
Click: Network tab
Make sure "Recording" is active (red dot or button)
```

**Step 5.2**: Trigger an API Request
```
Navigate to any page that makes an API call
Examples:
  - Click on "Bookings" or "Dashboard"
  - Make any data fetch from backend
```

**Step 5.3**: Check Request Headers
```
In Network tab:
1. Find a POST/PUT/PATCH/DELETE request (not GET)
2. Click on it
3. Scroll down to: Request Headers
```

**Expected to See**:
```
Cookie: soleil_token=<UUID>
X-XSRF-TOKEN: <csrf_token_value>

Both headers should be present!
```

**Step 5.4**: Check GET Requests
```
Find a GET request in Network tab
Click on it
Scroll to: Request Headers
```

**Expected to See**:
```
Cookie: soleil_token=<UUID>
(NO X-XSRF-TOKEN header - GET requests don't need it)
```

✅ **VERIFICATION CHECKPOINT 5**: CSRF token header present on non-GET requests → CSRF protection working!

---

### TEST 6: Verify API Responses (10 min)

**Step 6.1**: In Network Tab
```
Look at the responses from API requests
```

**Expected to See**:
```
Status: 200 OK (for successful requests)
Response: Contains data (bookings, user info, etc)

NOT:
  ❌ 401 Token Expired (unless testing expiration)
  ❌ 403 Forbidden (CSRF mismatch would cause this)
  ❌ 500 Server Error
```

✅ **VERIFICATION CHECKPOINT 6**: API requests returning 200 OK → Backend accepting requests correctly!

---

### TEST 7: Test Logout (10 min)

**Step 7.1**: Click Logout Button
```
Navigate to a page with logout option
Click: Logout button
Expected: Redirects to /login
```

**Step 7.2**: Verify Cookies Cleared
```
DevTools still open
Go to: Application → Cookies → http://localhost:5173
```

**Expected**:
```
soleil_token cookie GONE (or marked as expired/removed)
```

**Step 7.3**: Verify sessionStorage Cleared
```
Go to: Application → Session Storage → http://localhost:5173
```

**Expected**:
```
csrf_token key GONE
Session storage is empty
```

**Step 7.4**: Verify localStorage Still Empty
```
Go to: Application → Local Storage → http://localhost:5173
```

**Expected**:
```
Still empty (never had tokens in first place) ✓
```

✅ **VERIFICATION CHECKPOINT 7**: Logout clears cookies & sessionStorage → Logout working!

---

### TEST 8: Test Login Again (5 min)

**Step 8.1**: Login Again
```
You should be redirected to /login
Enter credentials again and login
```

**Step 8.2**: Verify New Cookie Created
```
DevTools → Application → Cookies
```

**Expected**:
```
New soleil_token cookie with different UUID
New expiration time
HttpOnly flag still ✓
```

✅ **VERIFICATION CHECKPOINT 8**: Can login again and get new token → Full cycle working!

---

## 🎯 Summary Checklist

Print or copy this checklist and mark as you go:

```
BROWSER TESTING - PHASE 4 COMPLETE CHECKLIST

SERVERS RUNNING:
  [✓] Backend on http://127.0.0.1:8000
  [✓] Frontend on http://localhost:5173

LOGIN TEST:
  [ ] Can navigate to /login
  [ ] Can enter credentials
  [ ] Can click Login
  [ ] Redirects to dashboard after login
  [ ] No console errors

TEST 1 - httpOnly Cookie:
  [ ] Cookie named "soleil_token" exists
  [ ] Has UUID value
  [ ] HttpOnly: ✓ checked
  [ ] SameSite: Strict
  [ ] Has expiration time

TEST 2 - localStorage Empty:
  [ ] NO 'access_token' key
  [ ] NO 'token' key
  [ ] NO 'user' key
  [ ] Storage is empty or only has app config

TEST 3 - sessionStorage CSRF Token:
  [ ] Key 'csrf_token' exists
  [ ] Has token value
  [ ] Not empty

TEST 4 - XSS Protection (Console):
  [ ] localStorage.getItem('access_token') → null
  [ ] localStorage.getItem('token') → null
  [ ] sessionStorage.getItem('csrf_token') → has value
  [ ] document.cookie → no token values visible

TEST 5 - CSRF Header:
  [ ] POST/PUT/PATCH/DELETE requests have X-XSRF-TOKEN header
  [ ] GET requests have Cookie header
  [ ] All requests have soleil_token cookie

TEST 6 - API Responses:
  [ ] API requests return 200 OK
  [ ] No 401/403 errors
  [ ] Data received correctly
  [ ] No CSRF validation errors

TEST 7 - Logout:
  [ ] Logout button works
  [ ] Redirects to /login
  [ ] soleil_token cookie removed
  [ ] sessionStorage cleared
  [ ] localStorage still empty

TEST 8 - Login Again:
  [ ] Can login successfully
  [ ] New cookie created
  [ ] New CSRF token
  [ ] Different UUID than before

OVERALL STATUS:
  [ ] ALL TESTS PASSED ✅
  [ ] Ready for Phase 5 Deployment ✅
```

---

## 🚨 Common Issues & Quick Fixes

### Issue: "Cannot access http://localhost:5173"
**Solution**:
```
Check terminal output for frontend server
Make sure you see: "VITE v... ready"
Try accessing the port shown in terminal
```

### Issue: "Login page shows but cannot login"
**Solution**:
```
Check browser console (F12 → Console tab)
Look for error messages
Check backend server logs (first terminal)
May need test user in database
```

### Issue: "401 Unauthorized when accessing API"
**Solution**:
```
This means token validation failed
Reasons:
  1. CSRF token missing (check sessionStorage)
  2. Token expired (should auto-refresh)
  3. Backend token validation issue
  
Try: Logout and login again to get fresh tokens
```

### Issue: "419 Forbidden (CSRF mismatch)"
**Solution**:
```
This means X-XSRF-TOKEN header mismatch
Fix:
  1. Clear browser storage: localStorage.clear()
  2. Logout and login again
  3. This resets CSRF token
```

### Issue: "localStorage has 'access_token' (security concern)"
**Solution**:
```
This should NOT happen with Phase 3 implementation
Check:
  1. Are you using useAuth().loginHttpOnly()?
  2. Or are you still using legacy authService.login()?
  
Fix:
  1. Verify Login.tsx uses loginHttpOnly()
  2. Verify Register.tsx uses registerHttpOnly()
  3. Clear localStorage manually: localStorage.clear()
```

---

## 📝 Testing Notes & Screenshots

**Space for your observations**:

```
Date Tested: November 23, 2025

Backend Server Status: ___________________
Frontend Server Status: ___________________

Login Test Result: ___________________
Cookie Verification: ___________________
XSS Protection Test: ___________________
CSRF Protection Test: ___________________
API Request Test: ___________________
Logout Test: ___________________

Any Errors Encountered: ___________________
___________________
___________________

Overall Assessment: ___________________

Ready for Phase 5: [ ] YES   [ ] NO
```

---

## ✅ When All Tests Pass

Once you've completed all 8 tests and everything is working:

1. ✅ Mark Phase 4 as complete
2. ✅ Document any issues found
3. ✅ Proceed to Phase 5: Production Deployment

**Next Steps After Testing**:
```
1. Run backend tests:
   cd backend
   php artisan test

2. Run database migration:
   cd backend
   php artisan migrate

3. Build frontend:
   cd frontend
   npm run build

4. Commit changes:
   git add .
   git commit -m "Phase 4: Browser Testing Complete - All Tests Passed"

5. Deploy to staging/production
```

---

## 🎯 Success Criteria

**Phase 4 is COMPLETE when**:
- ✅ Can login successfully
- ✅ httpOnly cookie visible in DevTools (HttpOnly ✓)
- ✅ localStorage is empty (no tokens)
- ✅ sessionStorage has csrf_token
- ✅ XSS test: tokens inaccessible via JavaScript
- ✅ CSRF test: X-XSRF-TOKEN header present
- ✅ API requests return 200 OK
- ✅ Logout clears all authentication data
- ✅ Can login again and repeat cycle

**All above = Ready for Phase 5!**

---

## 🚀 Ready to Test?

**You have**:
- ✅ Backend running
- ✅ Frontend running
- ✅ Browser open to http://localhost:5173
- ✅ This testing guide

**Start with TEST 1**: Go to /login and enter test credentials

**Report back when**:
- You've completed all 8 tests
- All checkboxes are checked
- Everything works or if you found issues

Then we move to **Phase 5: Production Deployment** 🎉

---

**Testing Status**: READY TO BEGIN  
**Both Servers**: RUNNING ✅  
**Browser**: OPEN ✅  
**Testing Guide**: THIS DOCUMENT ✅  

**GO TEST!** 🧪

Let me know when you've completed the testing and we'll move to Phase 5 deployment! 🚀
