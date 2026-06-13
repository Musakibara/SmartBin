<?php

namespace Database\Factories;

use App\Models\Bin;
use App\Models\SensorReading;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SensorReading>
 */
class SensorReadingFactory extends Factory
{
    protected $model = SensorReading::class;

    public function definition(): array
    {
        $fillLevel = fake()->numberBetween(0, 100);

        return [
            'bin_id' => Bin::factory(),
            'distance' => fake()->randomFloat(2, 10, 200),
            'fill_level' => $fillLevel,
            'detected_presence' => fake()->boolean(30),
            'created_at' => fake()->dateTimeBetween('-7 days'),
        ];
    }
}
