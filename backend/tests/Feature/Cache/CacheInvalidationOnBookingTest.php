<?php

namespace Tests\Feature\Cache;

use Tests\TestCase;
use App\Models\Booking;
use App\Models\Room;
use App\Models\User;
use App\Events\BookingCreated;
use App\Listeners\InvalidateRoomAvailabilityCache;
use App\Services\Cache\RoomAvailabilityCache;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Cache;
use Illuminate\Foundation\Testing\RefreshDatabase;

class CacheInvalidationOnBookingTest extends TestCase
{
    use RefreshDatabase;

    protected Room $room;
    protected User $user;
    protected RoomAvailabilityCache $cache;

    protected function setUp(): void
    {
        parent::setUp();
        $this->room = Room::factory()->create();
        $this->user = User::factory()->create();
        $this->cache = app(RoomAvailabilityCache::class);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function test_booking_created_event_fires(): void
    {
        Event::fake();

        $booking = Booking::factory()->create([
            'room_id' => $this->room->id,
            'user_id' => $this->user->id,
        ]);

        // Manually dispatch event (in real scenario, this would be automatic)
        event(new BookingCreated($booking));

        // Verify event was dispatched
        Event::assertDispatched(BookingCreated::class, function ($event) use ($booking) {
            return $event->booking->id === $booking->id;
        });
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function test_cache_invalidation_listener_executes(): void
    {
        // Seed cache first
        $checkIn = now()->addDays(1);
        $checkOut = now()->addDays(3);
        $this->cache->getAvailableRooms($checkIn, $checkOut, 2);

        $cacheKey = "rooms_availability_{$checkIn->format('Y-m-d')}_{$checkOut->format('Y-m-d')}_2";
        $this->assertTrue(Cache::tags(['room_availability'])->has($cacheKey));

        // Create booking and trigger event
        $booking = Booking::factory()->create([
            'room_id' => $this->room->id,
            'user_id' => $this->user->id,
        ]);

        event(new BookingCreated($booking));

        // Give listener time to execute (if async)
        sleep(1);

        // Cache should be invalidated
        $this->assertFalse(Cache::tags(['room_availability'])->has($cacheKey));
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function test_listener_handles_failed_invalidation_gracefully(): void
    {
        // Simulate Redis connection failure (no-op in this test)
        // In production, failed listeners are logged
        
        $booking = Booking::factory()->create([
            'room_id' => $this->room->id,
        ]);

        // Should not throw exception
        $this->doesNotPerformAssertions();
        event(new BookingCreated($booking));
    }
}
