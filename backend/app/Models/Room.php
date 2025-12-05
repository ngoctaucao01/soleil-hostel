<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

class Room extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'price',
        'max_guests',
        'status',
    ];
    
    protected $casts = [
        'price' => 'decimal:2',
    ];

    /**
     * Get the bookings for the room.
     */
    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    /**
     * Get active bookings for the room (for availability checking).
     */
    public function activeBookings(): HasMany
    {
        return $this->bookings()
            ->whereIn('status', Booking::ACTIVE_STATUSES);
    }

    // ===== SCOPES =====

    /**
     * Scope: Load common relationships to prevent N+1
     * 
     * Loads bookings count + latest booking for availability display
     * Usage: Room::withCommonRelations()->get()
     */
    public function scopeWithCommonRelations(Builder $query): Builder
    {
        return $query
            ->selectColumns()
            ->withCount('activeBookings');
    }

    /**
     * Scope: Select only commonly needed columns
     * 
     * Usage: Room::selectColumns()->get()
     */
    public function scopeSelectColumns(Builder $query): Builder
    {
        return $query->select([
            'rooms.id',
            'rooms.name',
            'rooms.description',
            'rooms.price',
            'rooms.max_guests',
            'rooms.status',
            'rooms.created_at',
            'rooms.updated_at',
        ]);
    }

    /**
     * Scope: Only active rooms
     * 
     * Usage: Room::active()->get()
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', 'active');
    }
}

