# ✅ Developer Integration Checklist

**For**: Soleil Hostel team  
**Purpose**: Update your existing code to use HTML Purifier  
**Time to complete**: 15-30 minutes per controller

---

## Before You Start

- ✅ Read `QUICK_REFERENCE.md` (2 min)
- ✅ Read `HTML_PURIFIER_GUIDE.md` section "Usage Patterns" (5 min)
- ✅ Run tests to ensure they pass: `php artisan test HtmlPurifierXssTest` (20 sec)

---

## For Each Controller You Update

### Step 1: Find controllers with user input

```bash
# Search for common patterns
grep -r "request(" backend/app/Http/Controllers/*.php
grep -r "Input::" backend/app/Http/Controllers/*.php
grep -r "->input(" backend/app/Http/Controllers/*.php
```

**Common controllers that need updates:**
- [ ] BookingController
- [ ] ReviewController
- [ ] ContactController
- [ ] [Your custom controller 1]
- [ ] [Your custom controller 2]
- [ ] [Your custom controller 3]

### Step 2: For each controller method

#### 2a. Find FormRequest usage

```php
// In controller method signature:
public function store(StoreBookingRequest $request) {
    // ✅ Good: Using FormRequest
}

// NOT using FormRequest:
public function store(Request $request) {
    // ❌ Should use typed FormRequest
}
```

**Action**: If not using FormRequest, create one!

#### 2b. Add `validated()` method to FormRequest

```php
// File: app/Http/Requests/StoreBookingRequest.php

class StoreBookingRequest extends FormRequest {
    public function rules() {
        return [
            'guest_name' => 'required|string|max:255',
            'special_notes' => 'nullable|string|max:1000',
            // ... other rules
        ];
    }

    // ✅ ADD THIS METHOD:
    public function validated(): array {
        return $this->purify(['guest_name', 'special_notes']);
    }
}
```

**Note**: Replace `['guest_name', 'special_notes']` with your HTML fields.

#### 2c. In controller method, use `$request->validated()`

```php
public function store(StoreBookingRequest $request) {
    // ✅ Good: Data is automatically purified
    $validated = $request->validated();
    
    Booking::create($validated);
}

// ❌ Bad: Bypasses purification
public function store(Request $request) {
    $data = $request->all();  // NO PURIFICATION!
    Booking::create($data);
}
```

### Step 3: Update Model

```php
// File: app/Models/Booking.php

use App\Traits\Purifiable;

class Booking extends Model {
    use Purifiable;
    
    // ✅ ADD THIS:
    protected array $purifiable = [
        'guest_name',
        'special_notes',
        // List all text fields that might have HTML
    ];
}
```

### Step 4: Update Blade Templates

Find templates that render user input:

```blade
{{-- ❌ DON'T DO THIS (without verification) --}}
{!! $booking->guest_name !!}

{{-- ✅ DO THIS INSTEAD --}}
@purify($booking->guest_name)

{{-- ✅ OR THIS (safest - no HTML at all) --}}
{{ $booking->guest_name }}
```

### Step 5: Test Your Changes

```bash
# 1. Create test data with HTML
# In tinker: 
# Booking::create(['guest_name' => '<b>Test</b><script>xss</script>'])

# 2. Verify it's stored safely:
# Booking::latest()->first()->guest_name
# Should show: <b>Test</b>

# 3. Run tests
php artisan test tests/Feature/Security/HtmlPurifierXssTest.php

# 4. Check logs for warnings
tail storage/logs/laravel.log | grep XSS
```

---

## Checklist Template

Copy this for each controller:

```
Controller: ___________________

Existing FormRequests:
- [ ] StoreRequest - Added validated() with purify()
- [ ] UpdateRequest - Added validated() with purify()
- [ ] DestroyRequest - (skip if no HTML input)

Model Updates:
- [ ] Added `use Purifiable;`
- [ ] Added `protected array $purifiable = [...];`

Controller Updates:
- [ ] Using $request->validated() (not $request->all())
- [ ] No direct access to $request->input()
- [ ] No use of old SecurityHelper class

Blade Templates:
- [ ] Replaced {!! !! with @purify() or {{ }}
- [ ] No raw HTML rendering without @purify

Testing:
- [ ] Ran test suite - all passing
- [ ] Manually tested with HTML input
- [ ] Verified HTML is stripped

Status: ✅ COMPLETE
```

---

## Common Issues & Fixes

### Issue: "Call to undefined method purify()"

**Cause**: FormRequestPurifyMacro not registered

**Fix**: Verify `AppServiceProvider.php` has:
```php
FormRequestPurifyMacro::register();
```

### Issue: Content being stripped but shouldn't be

**Cause**: Tag not in whitelist

**Fix**: Add to `config/purifier.php`:
```php
'HTML.AllowedElements' => [
    'b', 'i', 'strong', 'em',  // Existing
    'u', 'code',               // ADD new tags
]
```

### Issue: "Class SecurityHelper not found"

**Cause**: Still importing deleted SecurityHelper

**Fix**: Remove these lines:
```php
// DELETE:
use App\Helpers\SecurityHelper;

// DELETE any calls:
SecurityHelper::sanitizeInput($input);
SecurityHelper::containsSuspiciousPatterns($input);
```

### Issue: Tests failing

**Cause**: Usually cache issues

**Fix**: Clear caches:
```bash
php artisan config:clear
php artisan cache:clear
php artisan test
```

---

## Validation vs Purification

**Important distinction:**

```php
class MyRequest extends FormRequest {
    public function rules() {
        // VALIDATION: Is the input VALID?
        return [
            'title' => 'required|string|max:200',
        ];
    }
    
    public function validated() {
        // PURIFICATION: Is the input SAFE?
        return $this->purify(['title']);
    }
}
```

- **Validation** checks: Is this the right format/length?
- **Purification** checks: Is this safe to display?

**You need BOTH:**
1. Validation in `rules()`
2. Purification in `validated()`

---

## Quick Purification Syntax

### Selective Fields

```php
// Purify only specific fields
$this->purify(['title', 'content']);
```

### All String Fields

```php
// Purify all validated string fields automatically
$this->purifyAll();
```

### Direct Service Use

```php
use App\Services\HtmlPurifierService;

$clean = HtmlPurifierService::purify($html);
$text = HtmlPurifierService::plaintext($html);
$hasHtml = HtmlPurifierService::isHtml($input);
```

---

## Estimated Time per Controller

| Controller Type | Lines Changed | Time |
|-----------------|---------------|------|
| Simple (1-2 methods) | 10-20 | 5 min |
| Medium (3-5 methods) | 30-50 | 15 min |
| Complex (6+ methods) | 50+ | 30 min |

**Total for 3 controllers**: ~45 minutes

---

## Rollout Plan

### Phase 1: Core Controllers
- [ ] BookingController
- [ ] ReviewController
- [ ] ContactController

### Phase 2: Supporting Controllers
- [ ] [Controller 4]
- [ ] [Controller 5]

### Phase 3: Verification
- [ ] All tests passing
- [ ] Staging deployment successful
- [ ] Production ready

---

## Questions?

**Quick Reference**: `QUICK_REFERENCE.md`  
**Full Guide**: `HTML_PURIFIER_GUIDE.md`  
**Examples**: `ReviewController.php`  
**Migration Patterns**: `BookingControllerExample.php`

---

## Sign-Off

- [ ] I've read the documentation
- [ ] I understand the 3 usage patterns
- [ ] I can identify which fields need purification
- [ ] I'm ready to update my controllers

**Ready to start!** ✅

