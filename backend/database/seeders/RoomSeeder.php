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
                'capacity' => 2,
                'amenities' => ['WiFi', 'TV', 'Mini Bar', 'Air Conditioning']
            ],
            [
                'name' => 'Suite Room',
                'description' => 'Luxury suite with separate living area',
                'price' => 250.00,
                'capacity' => 4,
                'amenities' => ['WiFi', 'TV', 'Mini Bar', 'Air Conditioning', 'Jacuzzi', 'Living Room']
            ],
            [
                'name' => 'Standard Room',
                'description' => 'Comfortable room for single occupancy',
                'price' => 100.00,
                'capacity' => 1,
                'amenities' => ['WiFi', 'TV', 'Air Conditioning']
            ]
        ];

        foreach ($rooms as $room) {
            Room::create($room);
        }
    }
}
