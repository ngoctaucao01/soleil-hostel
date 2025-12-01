# 🚀 QUICK START - Test Suite Execution

## 30-Second Setup

```bash
cd c:\Users\Admin\myProject\soleil-hostel\backend
php artisan test
```

✅ That's it! All 44 tests will run automatically.

---

## Common Commands

### Run All Tests

```bash
php artisan test
```

### Run Specific Test File

```bash
# Auth tests
php artisan test tests/Feature/Auth/AuthenticationTest.php

# Booking overlap tests
php artisan test tests/Feature/Booking/ConcurrentBookingTest.php

# Policy tests
php artisan test tests/Feature/Booking/BookingPolicyTest.php
```

### Run with Coverage Report

```bash
php artisan test --coverage
```

### Run with Testdox (Readable Output)

```bash
php artisan test --testdox
```

### Run Single Test

```bash
php artisan test tests/Feature/Auth/AuthenticationTest.php --filter=test_login_success_with_valid_credentials
```

---

## What Gets Tested

### ✅ Authentication (15 tests)

- Login success/failure ✓
- Token expiration ✓
- Token refresh ✓
- Logout (single & all devices) ✓
- Rate limiting ✓
- Multi-device auth ✓

### ✅ Booking Overlap (14 tests)

- Single booking ✓
- Double-booking prevention ✓
- Concurrent requests ✓
- Date validation ✓
- XSS sanitization ✓
- Database consistency ✓

### ✅ Authorization (15 tests)

- Owner-only access ✓
- 403 Forbidden responses ✓
- 401 Unauthorized responses ✓
- Rate limiting ✓
- Overlap prevention on update ✓

---

## Test Database

- **Type**: SQLite `:memory:` (in-memory, ultra-fast)
- **Auto-Reset**: After each test (RefreshDatabase trait)
- **Migrations**: Automatically run before tests
- **Factories**: Pre-configured with relationships

---

## Expected Output

```
   PASS  Tests\Feature\Auth\AuthenticationTest
  ✓ login success with valid credentials
  ✓ login fails with invalid email
  ...
  ✓ login rate limiting

   PASS  Tests\Feature\Booking\ConcurrentBookingTest
  ✓ single booking success
  ✓ double booking same dates prevented
  ...
  ✓ database consistency after operations

   PASS  Tests\Feature\Booking\BookingPolicyTest
  ✓ owner can view own booking
  ✓ non owner cannot view other booking
  ...
  ✓ update non existent booking returns 404

Tests: 44 passed (XXX assertions)
```

---

## Troubleshooting

### ❌ "Database connection refused"

→ Make sure you're in `backend/` directory
→ Check `phpunit.xml` uses `:memory:` database

### ❌ "Undefined method user()" in factory

→ Already fixed - enhanced UserFactory with `->user()` and `->admin()` methods

### ❌ "Tests folder not found"

→ Ensure you're running from `backend/` directory, not project root

### ❌ "Permission denied" on MacOS/Linux

→ Run `chmod +x vendor/bin/phpunit` first

---

## Integration with GitHub Actions

Push your code to `main` or `develop` branch:

```bash
git add .
git commit -m "Add comprehensive test suite"
git push origin develop
```

✅ Tests automatically run in GitHub Actions
✅ Results posted as PR comments
✅ Coverage reports generated

---

## Files Created/Modified

### Created (5 files):

- ✅ `tests/Feature/Auth/AuthenticationTest.php`
- ✅ `tests/Feature/Booking/ConcurrentBookingTest.php`
- ✅ `tests/Feature/Booking/BookingPolicyTest.php`
- ✅ `database/factories/BookingFactory.php`
- ✅ `.github/workflows/tests.yml`

### Enhanced (4 files):

- ✅ `database/factories/UserFactory.php` (added role states)
- ✅ `tests/TestCase.php` (added RefreshDatabase)
- ✅ `phpunit.xml` (optimized for testing)
- ✅ `app/Models/User.php` (added role to fillable)

---

## Key Testing Patterns

### Creating Test Data

```php
// Create user
$user = User::factory()->admin()->create();

// Create booking
$booking = Booking::factory()
    ->forRoom($room)
    ->confirmed()
    ->create();
```

### Making API Requests

```php
$response = $this->actingAs($user, 'sanctum')
    ->postJson('/api/bookings', $data);

$response->assertStatus(201);
```

### Checking Authorization

```php
$response = $this->actingAs($otherUser, 'sanctum')
    ->getJson("/api/bookings/{$booking->id}");

$response->assertStatus(403); // Forbidden
```

---

## Coverage Target

- **Current Target**: >95% core logic
- **Run**: `php artisan test --coverage`
- **Expected**: 95%+ coverage on:
  - Auth controller
  - Booking creation service
  - Booking policy
  - Models

---

## Performance

- **Execution Time**: ~5-10 seconds (44 tests)
- **Database**: In-memory SQLite (no disk I/O)
- **Parallelization**: Can run multiple test files in parallel

---

## Next Steps

1. Run tests locally: `php artisan test`
2. Verify all pass ✅
3. Commit to version control
4. Push to GitHub
5. Monitor CI/CD workflow
6. Add more tests as features evolve

---

**Status**: ✅ **READY FOR IMMEDIATE USE**
