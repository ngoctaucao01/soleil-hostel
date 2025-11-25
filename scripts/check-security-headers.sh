#!/bin/bash

# Security Headers Verification Script
# 
# Kiểm tra tất cả security headers có present không
# So sánh với tiêu chuẩn 2025
# Hiển thị grade (F → A+)

TARGET_URL="${1:-https://localhost:8000}"
COLOR_RED='\033[0;31m'
COLOR_GREEN='\033[0;32m'
COLOR_YELLOW='\033[1;33m'
COLOR_NC='\033[0m' # No Color

echo "================================================"
echo "Security Headers Verification"
echo "Target: $TARGET_URL"
echo "================================================"
echo ""

# Fetch headers
HEADERS=$(curl -sI "$TARGET_URL" 2>/dev/null)

if [ -z "$HEADERS" ]; then
    echo -e "${COLOR_RED}✗ Could not connect to $TARGET_URL${COLOR_NC}"
    exit 1
fi

# Test each header
declare -A REQUIRED_HEADERS=(
    ["Strict-Transport-Security"]="max-age="
    ["X-Frame-Options"]="DENY"
    ["X-Content-Type-Options"]="nosniff"
    ["Referrer-Policy"]="strict-origin"
    ["Permissions-Policy"]="camera"
    ["Cross-Origin-Opener-Policy"]="same-origin"
    ["Cross-Origin-Embedder-Policy"]="require-corp"
    ["Cross-Origin-Resource-Policy"]="same-origin"
    ["Content-Security-Policy"]="default-src"
)

PASSED=0
FAILED=0

echo "Checking headers..."
echo ""

for HEADER in "${!REQUIRED_HEADERS[@]}"; do
    EXPECTED="${REQUIRED_HEADERS[$HEADER]}"
    VALUE=$(echo "$HEADERS" | grep -i "^$HEADER:" | cut -d' ' -f2-)
    
    if [ -z "$VALUE" ]; then
        echo -e "${COLOR_RED}✗ $HEADER${COLOR_NC} (MISSING)"
        ((FAILED++))
    elif echo "$VALUE" | grep -qi "$EXPECTED"; then
        echo -e "${COLOR_GREEN}✓ $HEADER${COLOR_NC}"
        echo "  → $VALUE"
        ((PASSED++))
    else
        echo -e "${COLOR_YELLOW}⚠ $HEADER${COLOR_NC} (PRESENT but unexpected value)"
        echo "  → $VALUE"
        ((FAILED++))
    fi
done

echo ""
echo "================================================"

# Calculate grade
TOTAL=$((PASSED + FAILED))
PERCENTAGE=$((PASSED * 100 / TOTAL))

if [ $PERCENTAGE -eq 100 ]; then
    GRADE="A+"
    COLOR=$COLOR_GREEN
elif [ $PERCENTAGE -ge 90 ]; then
    GRADE="A"
    COLOR=$COLOR_GREEN
elif [ $PERCENTAGE -ge 80 ]; then
    GRADE="B"
    COLOR=$COLOR_GREEN
elif [ $PERCENTAGE -ge 70 ]; then
    GRADE="C"
    COLOR=$COLOR_YELLOW
else
    GRADE="F"
    COLOR=$COLOR_RED
fi

echo -e "Grade: ${COLOR}$GRADE${COLOR_NC} ($PASSED/$TOTAL headers)"
echo "Percentage: ${PERCENTAGE}%"
echo "================================================"

# Return exit code based on grade
if [ "$PERCENTAGE" -ge 90 ]; then
    exit 0
else
    exit 1
fi
