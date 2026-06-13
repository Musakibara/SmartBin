<?php

namespace Database\Factories;

use App\Models\Alert;
use App\Models\Notification;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Notification>
 */
class NotificationFactory extends Factory
{
    protected $model = Notification::class;

    public function definition(): array
    {
        return [
            'alert_id' => Alert::factory(),
            'channel' => fake()->randomElement(['EMAIL', 'TELEGRAM']),
            'recipient' => fake()->safeEmail(),
            'message' => fake()->sentence(),
            'status' => fake()->randomElement(['PENDING', 'SENT', 'FAILED']),
            'sent_at' => fake()->optional(0.7)->dateTimeBetween('-24 hours'),
        ];
    }
}
