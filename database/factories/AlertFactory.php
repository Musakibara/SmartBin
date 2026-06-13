<?php

namespace Database\Factories;

use App\Models\Alert;
use App\Models\Bin;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Alert>
 */
class AlertFactory extends Factory
{
    protected $model = Alert::class;

    private static array $alertTypes = [
        ['BIN_FULL', 'HIGH', 'Cette benne a atteint sa capacité maximale.'],
        ['BIN_FULL', 'CRITICAL', 'Débordement imminent !'],
        ['BATTERY_LOW', 'MEDIUM', 'Niveau de batterie critique.'],
        ['SENSOR_ERROR', 'HIGH', 'Capteur ultrason défectueux.'],
        ['OVERFLOW_RISK', 'MEDIUM', 'Risque de débordement détecté.'],
        ['BATTERY_LOW', 'HIGH', 'Batterie presque vide, maintenance requise.'],
        ['SENSOR_ERROR', 'LOW', 'Lecture capteur anormale.'],
        ['OVERFLOW_RISK', 'CRITICAL', 'Prédiction de débordement dans moins de 2h.'],
    ];

    public function definition(): array
    {
        $alert = fake()->randomElement(self::$alertTypes);

        return [
            'bin_id' => Bin::factory(),
            'type' => $alert[0],
            'message' => $alert[2] . ' (Benne ' . fake()->word() . ')',
            'severity' => $alert[1],
            'status' => fake()->randomElement(['PENDING', 'RESOLVED']),
            'created_at' => fake()->dateTimeBetween('-72 hours'),
        ];
    }
}
