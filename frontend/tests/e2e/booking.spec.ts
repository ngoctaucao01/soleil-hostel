import { test, expect, Page, Browser, Response } from '@playwright/test'

/**
 * E2E Test: Successful Booking Flow
 *
 * User journey:
 * 1. Navigate to booking page
 * 2. Select room type (2-person room)
 * 3. Enter check-in/check-out dates
 * 4. Fill guest information
 * 5. Submit booking
 * 6. Verify success message
 * 7. Verify booking appears in admin
 */
test.describe('🏨 Booking Flow', () => {
  let page: Page

  test.beforeEach(async ({ browser }: { browser: Browser }) => {
    page = await browser.newPage()
    // Set user agent to test as mobile and desktop
    await page.goto('/')
  })

  test('✅ User successfully books a room', async () => {
    // Step 1: Navigate to booking page
    await page.goto('/booking')
    await expect(page).toHaveTitle(/Soleil Hostel|Booking/i)

    // Step 2: Wait for room list to load
    await page.waitForLoadState('networkidle')
    const roomCards = page.locator('[data-testid="room-card"]')
    await expect(roomCards.first()).toBeVisible({ timeout: 10000 })

    // Step 3: Select first available room
    const firstRoom = roomCards.first()
    const roomPrice = await firstRoom.locator('[data-testid="room-price"]').textContent()
    expect(roomPrice).toBeTruthy()

    // Step 4: Click on room to open booking modal
    await firstRoom.click()
    await page.waitForSelector('[data-testid="booking-modal"]', { timeout: 5000 })

    // Step 5: Set check-in date (tomorrow)
    const checkInInput = page.locator('input[name="check_in"]')
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const checkInDate = tomorrow.toISOString().split('T')[0]

    await checkInInput.fill(checkInDate)
    await expect(checkInInput).toHaveValue(checkInDate)

    // Step 6: Set check-out date (day after tomorrow)
    const checkOutInput = page.locator('input[name="check_out"]')
    const dayAfter = new Date()
    dayAfter.setDate(dayAfter.getDate() + 2)
    const checkOutDate = dayAfter.toISOString().split('T')[0]

    await checkOutInput.fill(checkOutDate)
    await expect(checkOutInput).toHaveValue(checkOutDate)

    // Step 7: Fill guest information
    const guestName = page.locator('input[name="guest_name"]')
    const guestEmail = page.locator('input[name="guest_email"]')
    const guestPhone = page.locator('input[name="guest_phone"]')

    await guestName.fill('John Doe')
    await guestEmail.fill(`test-${Date.now()}@example.com`)
    await guestPhone.fill('+84912345678')

    await expect(guestName).toHaveValue('John Doe')
    await expect(guestEmail).toHaveValue(/test-\d+@example\.com/)
    await expect(guestPhone).toHaveValue('+84912345678')

    // Step 8: Submit booking
    const submitButton = page.locator('button[type="submit"]:has-text("Book Now")')
    await expect(submitButton).toBeEnabled()

    // Intercept API response to verify success
    const responsePromise = page.waitForResponse(
      (response: Response) =>
        response.url().includes('/api/bookings') &&
        response.request().method() === 'POST' &&
        response.status() === 201
    )

    await submitButton.click()
    const response = await responsePromise
    expect(response.status()).toBe(201)

    // Step 9: Verify success message
    await page.waitForSelector('[data-testid="success-message"]', { timeout: 10000 })
    const successMessage = page.locator('[data-testid="success-message"]')
    await expect(successMessage).toContainText(/booking.*success|successfully/i)

    // Step 10: Verify booking reference number is displayed
    const bookingRef = page.locator('[data-testid="booking-reference"]')
    await expect(bookingRef).toBeVisible()
    const refNumber = await bookingRef.textContent()
    expect(refNumber).toMatch(/[A-Z0-9]{8,}/) // Booking reference format

    // Step 11: Verify email confirmation sent (check in network tab)
    await page.waitForResponse(
      (response: Response) =>
        response.url().includes('/api/notifications/email') || response.url().includes('/mails')
    )
  })

  test('❌ Booking fails when room already booked', async () => {
    // This tests concurrent booking prevention (pessimistic locking)
    const bookingDate = new Date()
    bookingDate.setDate(bookingDate.getDate() + 5)
    const bookingDateStr = bookingDate.toISOString().split('T')[0]

    // First booking attempt
    await page.goto('/booking')
    const roomCards = page.locator('[data-testid="room-card"]')
    await expect(roomCards.first()).toBeVisible()

    await roomCards.first().click()
    const checkInInput = page.locator('input[name="check_in"]')
    const checkOutInput = page.locator('input[name="check_out"]')

    const checkOutDate = new Date(bookingDate)
    checkOutDate.setDate(checkOutDate.getDate() + 1)

    await checkInInput.fill(bookingDateStr)
    await checkOutInput.fill(checkOutDate.toISOString().split('T')[0])

    // Fill guest info
    await page.locator('input[name="guest_name"]').fill('Test User 1')
    await page.locator('input[name="guest_email"]').fill(`test1-${Date.now()}@example.com`)
    await page.locator('input[name="guest_phone"]').fill('+84912345671')

    // Submit first booking
    const submitButton = page.locator('button[type="submit"]:has-text("Book Now")')
    await submitButton.click()

    // Wait for success
    await page.waitForSelector('[data-testid="success-message"]', { timeout: 10000 })

    // Attempt second booking for same room/dates (should fail)
    const page2 = await page.context().newPage()
    await page2.goto('/booking')

    const roomCards2 = page2.locator('[data-testid="room-card"]')
    await expect(roomCards2.first()).toBeVisible()
    await roomCards2.first().click()

    const checkInInput2 = page2.locator('input[name="check_in"]')
    const checkOutInput2 = page2.locator('input[name="check_out"]')

    await checkInInput2.fill(bookingDateStr)
    await checkOutInput2.fill(checkOutDate.toISOString().split('T')[0])

    await page2.locator('input[name="guest_name"]').fill('Test User 2')
    await page2.locator('input[name="guest_email"]').fill(`test2-${Date.now()}@example.com`)
    await page2.locator('input[name="guest_phone"]').fill('+84912345672')

    // Submit second booking (should fail)
    const submitButton2 = page2.locator('button[type="submit"]:has-text("Book Now")')

    // Intercept error response
    const errorResponsePromise = page2.waitForResponse(
      (response: Response) => response.url().includes('/api/bookings') && response.status() === 409 // Conflict: room already booked
    )

    await submitButton2.click()

    try {
      const errorResponse = await errorResponsePromise
      expect(errorResponse.status()).toBe(409)
    } catch {
      // If 409 not received, check for 422 (validation error)
      const validationResponse = await page2.waitForResponse(
        (response: Response) =>
          response.url().includes('/api/bookings') &&
          (response.status() === 422 || response.status() === 400)
      )
      expect([422, 400]).toContain(validationResponse.status())
    }

    // Verify error message shown
    await page2.waitForSelector('[data-testid="error-message"]', { timeout: 10000 })
    const errorMessage = page2.locator('[data-testid="error-message"]')
    await expect(errorMessage).toContainText(/booked|unavailable|not available/i)

    await page2.close()
  })

  test('⚡ Booking page loads under 2 seconds', async () => {
    const startTime = Date.now()
    await page.goto('/booking', { waitUntil: 'networkidle' })
    const loadTime = Date.now() - startTime

    expect(loadTime).toBeLessThan(2000) // Must load in <2 seconds

    // Verify all critical elements are visible
    await expect(page.locator('[data-testid="room-card"]').first()).toBeVisible({ timeout: 1000 })
  })

  test('🎯 Rate limiting works (max 3 bookings per minute)', async () => {
    // This tests rate limiting
    const baseDate = new Date()
    baseDate.setDate(baseDate.getDate() + 10)

    for (let i = 0; i < 4; i++) {
      await page.goto('/booking')

      const roomCards = page.locator('[data-testid="room-card"]')
      await expect(roomCards.first()).toBeVisible()

      const currentDate = new Date(baseDate)
      currentDate.setDate(currentDate.getDate() + i)
      const nextDate = new Date(currentDate)
      nextDate.setDate(nextDate.getDate() + 1)

      await page.locator('[data-testid="room-card"]').first().click()
      await page.locator('input[name="check_in"]').fill(currentDate.toISOString().split('T')[0])
      await page.locator('input[name="check_out"]').fill(nextDate.toISOString().split('T')[0])
      await page.locator('input[name="guest_name"]').fill(`User ${i}`)
      await page.locator('input[name="guest_email"]').fill(`user${i}-${Date.now()}@example.com`)
      await page.locator('input[name="guest_phone"]').fill(`+8491234567${i}`)

      const response = await page.waitForResponse(
        (r: Response) => r.url().includes('/api/bookings') && r.request().method() === 'POST'
      )

      if (i < 3) {
        expect(response.status()).toBe(201) // First 3 should succeed
      } else {
        expect(response.status()).toBe(429) // 4th should be rate limited
      }
    }
  })
})
