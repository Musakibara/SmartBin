<?php

namespace Database\Factories;

use App\Models\Report;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Report>
 */
class ReportFactory extends Factory
{
    protected $model = Report::class;

    public function definition(): array
    {
        $start = fake()->dateTimeBetween('-3 months', '-1 month');
        $end = (clone $start)->modify('+1 month');

        return [
            'type' => fake()->randomElement(['OPERATIONAL', 'PERFORMANCE', 'STRATEGIC', 'ALERT']),
            'period_start' => $start->format('Y-m-d'),
            'period_end' => $end->format('Y-m-d'),
            'generated_by' => User::factory(),
            'file_path' => 'reports/' . fake()->uuid() . '.pdf',
            'summary' => fake()->paragraph(),
        ];
    }
}
