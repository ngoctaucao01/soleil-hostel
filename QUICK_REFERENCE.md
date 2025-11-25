# 🚀 HTML Purifier Quick Reference Card

**For**: Soleil Hostel developers  
**Status**: Production Ready ✅  
**Updated**: November 24, 2025

---

## Install

```bash
composer require ezyang/htmlpurifier:^4.19
```

---

## 3 Ways to Use

### Way 1️⃣: Model Auto-Purify (Recommended)

```php
use App\Traits\Purifiable;

class Booking extends Model {
    use Purifiable;
    protected array $purifiable = ['guest_name', 'special_notes'];
}

// Automatically purified on save ✅
Booking::create(['guest_name' => '<b>John</b><script>xss</script>']);
// Stored as: <b>John</b>
```

### Way 2️⃣: FormRequest Purify

```php
class StoreReviewRequest extends FormRequest {
    public function validated() {
        return $this->purify(['title', 'content']);
    }
}
```

### Way 3️⃣: Service Layer

```php
use App\Services\HtmlPurifierService;

$clean = HtmlPurifierService::purify($userInput);
$plain = HtmlPurifierService::plaintext($userInput);
```

---

## Safe in Blade

```blade
{{-- ✅ SAFE --}}
@purify($content)           {{-- Render as HTML --}}
@purifyPlain($text)         {{-- Render as plain text --}}
{{ $content }}              {{-- Auto-escaped (safest) --}}

{{-- ❌ DANGEROUS (only if already purified) --}}
{!! $content !!}            {{-- Raw HTML - verify it's purified! --}}
```

---

## What Gets Stripped

| Input | Output | Reason |
|-------|--------|--------|
| `<b>text</b><script>xss</script>` | `<b>text</b>` | Script tags always blocked |
| `<a href="javascript:alert()">` | `<a>` | Bad protocols blocked |
| `<img onerror="alert()">` | `<img>` | Event handlers blocked |
| `<p style="color:red">` | `<p>` | Styles blocked |
| `<i>italic</i>` | `<i>italic</i>` | Safe tags preserved |
| `<b>bold</b>` | `<b>bold</b>` | Safe tags preserved |

---

## Test It

```bash
# Run all HTML Purifier tests
php artisan test tests/Feature/Security/HtmlPurifierXssTest.php

# Result: 48/48 PASSING ✅
```

---

## Configuration

Edit `config/purifier.php` to:
- Allow more/fewer tags
- Change whitelist per environment
- Configure cache directory

Default whitelist:
- **Formatting**: `b`, `i`, `strong`, `em`
- **Links**: `a` (http/https/mailto only)
- **Images**: `img`
- **Structure**: `p`, `br`, `blockquote`, `div`
- **Lists**: `ul`, `ol`, `li`

---

## Common Patterns

### Pattern: Validate + Purify in FormRequest

```php
class CreatePostRequest extends FormRequest {
    public function rules() {
        return ['title' => 'required|max:200', 'body' => 'required'];
    }
    
    public function validated() {
        return $this->purify(['title', 'body']);
    }
}
```

### Pattern: Batch Import

```php
foreach ($rows as $row) {
    $clean = HtmlPurifierService::purify($row['content']);
    Post::create(['content' => $clean]);
}
```

### Pattern: Display Review with HTML

```blade
<div class="review">
    <h3>@purify($review->title)</h3>
    <p>@purify($review->content)</p>
</div>
```

---

## FAQ Quick Answers

**Q: Is `<script>` blocked?**  
A: Yes, always.

**Q: Can I use `<button>`?**  
A: No. Edit config/purifier.php to add it.

**Q: Can I use inline CSS?**  
A: No. Use CSS classes instead.

**Q: Is `<a href="...">`safe?**  
A: Only if href is http, https, or mailto.

**Q: Do I need to purify twice?**  
A: No. FormRequest OR model trait is enough.

**Q: What if I forget to purify?**  
A: Model Purifiable trait catches it on save.

---

## When to Purify

✅ **DO purify**:
- User input in forms
- Comments/reviews/feedback
- User-generated HTML content
- Any untrusted input

❌ **DON'T purify**:
- Admin-written static content
- Database IDs/numbers
- Already-purified data
- System-generated HTML

---

## Debug & Monitor

**Check for XSS attempts:**
```bash
tail -f storage/logs/laravel.log | grep "XSS content detected"
```

**Manual purification test:**
```php
HtmlPurifierService::purify('<b>Test</b><script>bad</script>');
// Returns: <b>Test</b>
```

---

## Performance

- **First call**: 8.57s (cache generation)
- **Cached calls**: <1ms
- **Memory**: ~2MB per instance
- **Production**: Cache enabled (fast ✅)
- **Development**: Cache disabled (flexible ✅)

---

## Docs

- **Full guide**: `HTML_PURIFIER_GUIDE.md`
- **Comparison**: `COMPARISON_REGEX_VS_PURIFIER.md`
- **Checklist**: `IMPLEMENTATION_CHECKLIST.md`
- **Examples**: `ReviewController.php`, `BookingControllerExample.php`

---

## One-Liner Examples

```php
// Purify in controller
$clean = HtmlPurifierService::purify(request('content'));

// Auto-purify model
class Post extends Model { use Purifiable; protected array $purifiable = ['title']; }

// Blade safe rendering
@purify($post->content)

// Check if has HTML
if (HtmlPurifierService::isHtml($input)) { ... }

// Plain text only
$text = HtmlPurifierService::plaintext($html);
```

---

**Need help?** Check `HTML_PURIFIER_GUIDE.md` or ask the team.

**Status**: ✅ Production Ready - 48/48 tests passing
