<?php

namespace Database\Seeders;

use App\Models\Alert;
use App\Models\Bin;
use App\Models\Notification;
use App\Models\Prediction;
use App\Models\Report;
use App\Models\Sensor;
use App\Models\SensorReading;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::factory()->create([
            'name' => 'Admin SmartBin',
            'email' => 'admin@smartbin.cm',
            'role' => 'ADMIN',
            'status' => 'ACTIVE',
            'last_active_at' => now(),
            'phone' => '+237 690 000 000',
        ]);

        User::factory()->create([
            'name' => 'Agent Terrain',
            'email' => 'agent@smartbin.cm',
            'role' => 'AGENT',
            'status' => 'ACTIVE',
            'last_active_at' => now()->subHours(2),
            'phone' => '+237 690 000 001',
        ]);

        User::factory()->create([
            'name' => 'Sarah Mbah',
            'email' => 'sarah@smartbin.cm',
            'role' => 'SUPERVISEUR',
            'status' => 'ACTIVE',
            'last_active_at' => now()->subMinutes(5),
            'phone' => '+237 690 000 002',
        ]);
        User::factory()->create([
            'name' => 'Jean Nkoulou',
            'email' => 'jean@smartbin.cm',
            'role' => 'OPERATEUR',
            'status' => 'ACTIVE',
            'last_active_at' => now()->subHours(2),
            'phone' => '+237 690 000 003',
        ]);
        User::factory()->create([
            'name' => 'Marie Onguéné',
            'email' => 'marie@smartbin.cm',
            'role' => 'TECHNICIEN',
            'status' => 'ACTIVE',
            'last_active_at' => now()->subMinute(),
            'phone' => '+237 690 000 004',
        ]);
        User::factory()->create([
            'name' => 'Esther Mengue',
            'email' => 'esther@smartbin.cm',
            'role' => 'SUPERVISEUR',
            'status' => 'SUSPENDED',
            'last_active_at' => now()->subDays(3),
            'phone' => '+237 690 000 005',
        ]);

        $systemUser = User::factory()->create([
            'name' => 'System IoT',
            'email' => 'system@smartbin.cm',
            'role' => 'AGENT',
            'status' => 'ACTIVE',
            'phone' => null,
        ]);
        $iotToken = $systemUser->createToken('arduino-bridge')->plainTextToken;
        $this->command->info("Token IoT (Arduino) : {$iotToken}");

        User::factory(9)->create();

        $bins = Bin::factory(24)->create();

        foreach ($bins as $bin) {
            Sensor::factory()->create([
                'bin_id' => $bin->id,
                'type' => 'ULTRASONIC',
                'model' => 'HC-SR04',
            ]);
            Sensor::factory()->create([
                'bin_id' => $bin->id,
                'type' => 'WEIGHT',
                'model' => 'HX711',
            ]);
            Sensor::factory()->create([
                'bin_id' => $bin->id,
                'type' => 'TEMPERATURE',
                'model' => 'DS18B20',
            ]);
            Sensor::factory()->create([
                'bin_id' => $bin->id,
                'type' => 'BATTERY',
                'model' => 'MAX17048',
            ]);

            SensorReading::factory(48)->create([
                'bin_id' => $bin->id,
            ]);

            Prediction::factory()->create([
                'bin_id' => $bin->id,
            ]);

            if (fake()->boolean(60)) {
                Alert::factory(2)->create([
                    'bin_id' => $bin->id,
                ]);
            }
        }

        $alerts = Alert::all();
        foreach ($alerts as $alert) {
            if (fake()->boolean(70)) {
                Notification::factory()->create([
                    'alert_id' => $alert->id,
                ]);
            }
        }

        Report::factory(6)->create();
    }
}
