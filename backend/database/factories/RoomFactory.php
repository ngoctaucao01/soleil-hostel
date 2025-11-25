<?php

namespace Database\Factories;

use App\Models\Room;
use Illuminate\Database\Eloquent\Factories\Factory;

class RoomFactory extends Factory
{
    protected $model = Room::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->word . ' Room',
            'description' => $this->faker->sentence(10),
            'price' => $this->faker->randomFloat(2, 20, 200),
            'max_guests' => $this->faker->numberBetween(1, 8),
            'status' => $this->faker->randomElement(['available', 'booked', 'maintenance']),
        ];
    }
}
