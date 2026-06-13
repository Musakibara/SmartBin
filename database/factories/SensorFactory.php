<?php

namespace Database\Factories;

use App\Models\Bin;
use App\Models\Sensor;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Sensor>
 */
class SensorFactory extends Factory
{
    protected $model = Sensor::class;

    private static array $sensorTypes = [
        ['ULTRASONIC', 'HC-SR04'],
        ['WEIGHT', 'HX711'],
        ['TEMPERATURE', 'DS18B20'],
        ['BATTERY', 'MAX17048'],
    ];

    public function definition(): array
    {
        $type = fake()->randomElement(self::$sensorTypes);

        return [
            'bin_id' => Bin::factory(),
            'type' => $type[0],
            'model' => $type[1],
            'status' => fake()->randomElement(['ACTIVE', 'INACTIVE']),
        ];
    }
}
