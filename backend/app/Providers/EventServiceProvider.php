<?php

namespace App\Providers;

use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Listeners\SendEmailVerificationNotification;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;
use Illuminate\Database\Events\QueryExecuted;
use App\Events\BookingCreated;
use App\Events\BookingUpdated;
use App\Events\BookingDeleted;
use App\Listeners\InvalidateRoomAvailabilityCache;
use App\Listeners\InvalidateCacheOnBookingUpdated;
use App\Listeners\InvalidateCacheOnBookingDeleted;
use App\Listeners\QueryDebuggerListener;

class EventServiceProvider extends ServiceProvider
{
    /**
     * The event listener mappings for the application.
     *
     * @var array<class-string, array<int, class-string>>
     */
    protected $listen = [
        Registered::class => [
            SendEmailVerificationNotification::class,
        ],

        // ========== QUERY DEBUGGING ==========
        QueryExecuted::class => [
            QueryDebuggerListener::class,  // ← Track N+1 queries
        ],

        // ========== BOOKING EVENTS ==========
        BookingCreated::class => [
            InvalidateRoomAvailabilityCache::class,  // ← Auto-invalidate cache
        ],

        BookingUpdated::class => [
            InvalidateCacheOnBookingUpdated::class,  // ← Auto-invalidate cache on update
        ],

        BookingDeleted::class => [
            InvalidateCacheOnBookingDeleted::class,  // ← Auto-invalidate cache on delete
        ],
    ];

    /**
     * Determine if events and listeners should be automatically discovered.
     */
    public function shouldDiscoverEvents(): bool
    {
        return false;
    }
}
