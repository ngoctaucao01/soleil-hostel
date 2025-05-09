<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Room;

class RoomsTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $rooms = [
            [
                'name' => 'Deluxe Single Room',
                'description' => 'Comfortable single room with city view',
                'price' => 100.00,
                'capacity' => 1,
                'amenities' => json_encode(['WiFi', 'TV', 'Air Conditioning', 'Mini Bar']),
            ],
            [
                'name' => 'Deluxe Double Room',
                'description' => 'Spacious double room with balcony',
                'price' => 150.00,
                'capacity' => 2,
                'amenities' => json_encode(['WiFi', 'TV', 'Air Conditioning', 'Mini Bar', 'Balcony']),
            ],
            [
                'name' => 'Family Suite',
                'description' => 'Large suite perfect for families',
                'price' => 250.00,
                'capacity' => 4,
                'amenities' => json_encode(['WiFi', 'TV', 'Air Conditioning', 'Mini Bar', 'Kitchen', 'Living Room']),
            ],
            [
                'name' => 'Executive Suite',
                'description' => 'Luxurious suite with separate living area',
                'price' => 300.00,
                'capacity' => 2,
                'amenities' => json_encode(['WiFi', 'TV', 'Air Conditioning', 'Mini Bar', 'Living Room', 'Work Desk', 'Premium Toiletries']),
            ],
            [
                'name' => 'Standard Twin Room',
                'description' => 'Comfortable room with two single beds',
                'price' => 120.00,
                'capacity' => 2,
                'amenities' => json_encode(['WiFi', 'TV', 'Air Conditioning']),
            ],
        ];

        foreach ($rooms as $room) {
            Room::create($room);
        }
    }
}
