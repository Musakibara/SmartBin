<?php

namespace Database\Seeders;

use App\Models\Alert;
use App\Models\Bin;
use App\Models\Notification;
use App\Models\Prediction;
use App\Models\Report;
use App\Models\Sensor;
use App\Models\SensorReading;
use Illuminate\Database\Seeder;

class DataSeeder extends Seeder
{
    public function run(): void
    {
        // ============================================================
        // 1. Bennes (24)
        // ============================================================
        $bins = Bin::factory(24)->create();

        // ============================================================
        // 2. Capteurs, lectures, prédictions par benne
        // ============================================================
        foreach ($bins as $bin) {
            // 4 capteurs par benne
            Sensor::factory()->create(['bin_id' => $bin->id, 'type' => 'ULTRASONIC',  'model' => 'HC-SR04']);
            Sensor::factory()->create(['bin_id' => $bin->id, 'type' => 'WEIGHT',      'model' => 'HX711']);
            Sensor::factory()->create(['bin_id' => $bin->id, 'type' => 'TEMPERATURE', 'model' => 'DS18B20']);
            Sensor::factory()->create(['bin_id' => $bin->id, 'type' => 'BATTERY',     'model' => 'MAX17048']);

            // 48 lectures par benne
            SensorReading::factory(48)->create(['bin_id' => $bin->id]);

            // 1 prédiction par benne
            Prediction::factory()->create(['bin_id' => $bin->id]);
        }

        // ============================================================
        // 3. Alertes (60% des bennes, 2 alertes chacune)
        // ============================================================
        foreach ($bins as $bin) {
            if (fake()->boolean(60)) {
                Alert::factory(2)->create(['bin_id' => $bin->id]);
            }
        }

        // ============================================================
        // 4. Notifications (70% des alertes)
        // ============================================================
        $alerts = Alert::all();
        foreach ($alerts as $alert) {
            if (fake()->boolean(70)) {
                Notification::factory()->create(['alert_id' => $alert->id]);
            }
        }

        // ============================================================
        // 5. Rapports (sans utilisateur)
        // ============================================================
        $types = ['OPERATIONAL', 'PERFORMANCE', 'STRATEGIC', 'ALERT'];
        for ($i = 0; $i < 6; $i++) {
            $start = fake()->dateTimeBetween('-3 months', '-1 month');
            $end = (clone $start)->modify('+1 month');

            Report::create([
                'type'         => fake()->randomElement($types),
                'period_start' => $start->format('Y-m-d'),
                'period_end'   => $end->format('Y-m-d'),
                'generated_by' => null,
                'file_path'    => 'reports/' . fake()->uuid() . '.pdf',
                'summary'      => fake()->paragraph(),
            ]);
        }

        $this->command->info(sprintf(
            'Seeded: %d bins, %d sensors, %d readings, %d predictions, %d alerts, %d notifications, %d reports',
            Bin::count(),
            Sensor::count(),
            SensorReading::count(),
            Prediction::count(),
            Alert::count(),
            Notification::count(),
            Report::count()
        ));
    }
}
