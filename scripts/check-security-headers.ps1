# Security Headers Verification Script (PowerShell)
#
# Kiểm tra tất cả security headers có present không
# So sánh với tiêu chuẩn 2025
# Hiển thị grade (F → A+)

param(
    [string]$Url = "https://localhost:8000"
)

$requiredHeaders = @{
    "Strict-Transport-Security" = "max-age="
    "X-Frame-Options" = "DENY"
    "X-Content-Type-Options" = "nosniff"
    "Referrer-Policy" = "strict-origin"
    "Permissions-Policy" = "camera"
    "Cross-Origin-Opener-Policy" = "same-origin"
    "Cross-Origin-Embedder-Policy" = "require-corp"
    "Cross-Origin-Resource-Policy" = "same-origin"
    "Content-Security-Policy" = "default-src"
}

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Security Headers Verification" -ForegroundColor Cyan
Write-Host "Target: $Url" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Fetch headers
try {
    $response = Invoke-WebRequest -Uri $Url -SkipCertificateCheck -ErrorAction Stop
    $headers = $response.Headers
} catch {
    Write-Host "✗ Could not connect to $Url" -ForegroundColor Red
    exit 1
}

$passed = 0
$failed = 0

Write-Host "Checking headers..." -ForegroundColor White
Write-Host ""

foreach ($header in $requiredHeaders.Keys) {
    $expected = $requiredHeaders[$header]
    $value = $headers[$header]
    
    if ([string]::IsNullOrEmpty($value)) {
        Write-Host "✗ $header" -ForegroundColor Red -NoNewline
        Write-Host " (MISSING)"
        $failed++
    } elseif ($value -match $expected) {
        Write-Host "✓ $header" -ForegroundColor Green
        Write-Host "  → $value"
        $passed++
    } else {
        Write-Host "⚠ $header" -ForegroundColor Yellow -NoNewline
        Write-Host " (PRESENT but unexpected value)"
        Write-Host "  → $value"
        $failed++
    }
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan

# Calculate grade
$total = $passed + $failed
$percentage = [math]::Round(($passed / $total) * 100)

if ($percentage -eq 100) {
    $grade = "A+"
    $gradeColor = "Green"
} elseif ($percentage -ge 90) {
    $grade = "A"
    $gradeColor = "Green"
} elseif ($percentage -ge 80) {
    $grade = "B"
    $gradeColor = "Green"
} elseif ($percentage -ge 70) {
    $grade = "C"
    $gradeColor = "Yellow"
} else {
    $grade = "F"
    $gradeColor = "Red"
}

Write-Host "Grade: " -NoNewline
Write-Host $grade -ForegroundColor $gradeColor -NoNewline
Write-Host " ($passed/$total headers)"
Write-Host "Percentage: ${percentage}%"
Write-Host "================================================" -ForegroundColor Cyan

if ($percentage -ge 90) {
    exit 0
} else {
    exit 1
}
