<?php

namespace App\Services;

use App\Models\Booking;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class BookingService
{
    private const CACHE_TTL_USER_BOOKINGS = 300;  // 5 minutes
    private const CACHE_TTL_BOOKING = 600;        // 10 minutes
    private const CACHE_TAG_BOOKINGS = 'bookings';
    private const CACHE_TAG_USER = 'user-bookings';

    /**
     * Get user's bookings - CACHED
     * 
     * Cache Strategy:
     * - Key: bookings:user:{userId}:page-{page}
     * - Tags: ['user-bookings', 'user-bookings-{userId}']
     * - TTL: 5m (user bookings don't change often)
     * - Per-user cache: user can't see other user's bookings
     */
    public function getUserBookings(int $userId, int $page = 1): Collection
    {
        $cacheKey = "bookings:user:{$userId}:page-{$page}";

        return Cache::tags([self::CACHE_TAG_USER, "user-bookings-{$userId}"])
            ->remember(
                $cacheKey,
                self::CACHE_TTL_USER_BOOKINGS,
                fn() => Booking::where('user_id', $userId)
                    ->with(['room' => function ($q) {
                        $q->select(['id', 'name', 'price']);
                    }])
                    ->select(['id', 'room_id', 'check_in', 'check_out', 'status', 'created_at'])
                    ->orderBy('check_in', 'desc')
                    ->get()
            );
    }

    /**
     * Get single booking - CACHED
     * 
     * Cache Strategy:
     * - Key: bookings:id:{bookingId}
     * - Tags: ['bookings', 'booking-{bookingId}']
     * - TTL: 10m
     */
    public function getBookingById(int $bookingId): ?Booking
    {
        $cacheKey = "bookings:id:{$bookingId}";

        return Cache::tags([self::CACHE_TAG_BOOKINGS, "booking-{$bookingId}"])
            ->remember(
                $cacheKey,
                self::CACHE_TTL_BOOKING,
                fn() => Booking::with(['room', 'user'])
                    ->select(['id', 'room_id', 'user_id', 'check_in', 'check_out', 'status', 'created_at'])
                    ->find($bookingId)
            );
    }

    /**
     * ===== INVALIDATION METHODS =====
     */

    public function invalidateUserBookings(int $userId): void
    {
        Cache::tags(["user-bookings-{$userId}"])->flush();
        Log::info("Cache invalidated for user {$userId} bookings");
    }

    public function invalidateBooking(int $bookingId, int $userId): void
    {
        Cache::tags(["booking-{$bookingId}"])->flush();
        $this->invalidateUserBookings($userId);
        Log::info("Cache invalidated for booking {$bookingId}");
    }

    public function invalidateAllBookings(): void
    {
        Cache::tags([self::CACHE_TAG_BOOKINGS])->flush();
        Log::info("Cache invalidated for all bookings");
    }
}
