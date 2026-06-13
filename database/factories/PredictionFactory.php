<?php

namespace Database\Factories;

use App\Models\Bin;
use App\Models\Prediction;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Prediction>
 */
class PredictionFactory extends Factory
{
    protected $model = Prediction::class;

    public function definition(): array
    {
        $probability = fake()->randomFloat(2, 0.3, 0.99);
        $risk = match (true) {
            $probability >= 0.8 => 'HIGH',
            $probability >= 0.5 => 'MEDIUM',
            default => 'LOW',
        };

        return [
            'bin_id' => Bin::factory(),
            'predicted_fill_time' => fake()->dateTimeBetween('+1 hour', '+48 hours'),
            'fill_probability' => $probability,
            'risk_level' => $risk,
            'recommendation' => match ($risk) {
                'HIGH' => 'Intervention urgente requise dans les 2 heures.',
                'MEDIUM' => 'Planifier une collecte dans les 12 heures.',
                default => 'Surveillance normale.',
            },
            'created_at' => fake()->dateTimeBetween('-24 hours'),
        ];
    }
}
