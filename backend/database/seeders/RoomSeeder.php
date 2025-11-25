<?php

namespace Database\Seeders;

use App\Models\Room;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class RoomSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $rooms = [
            [
                'name' => 'Deluxe Room',
                'description' => 'Spacious room with city view',
                'price' => 150.00,
                'max_guests' => 2,
                'status' => 'available'
            ],
            [
                'name' => 'Suite Room',
                'description' => 'Luxury suite with separate living area',
                'price' => 250.00,
                'max_guests' => 4,
                'status' => 'available'
            ],
            [
                'name' => 'Standard Room',
                'description' => 'Comfortable room for single occupancy',
                'price' => 100.00,
                'max_guests' => 1,
                'status' => 'available'
            ]
        ];

        foreach ($rooms as $room) {
            Room::create($room);
        }
    }
}
