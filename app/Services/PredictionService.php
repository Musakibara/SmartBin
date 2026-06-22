<?php

namespace App\Services;

use App\Models\Bin;
use App\Models\Prediction;
use Illuminate\Support\Facades\Http;

class PredictionService
{
    private const AI_SERVICE_URL = 'http://127.0.0.1:8001/api/predict';

    public function generate(): int
    {
        $bins = Bin::whereIn('status', ['NORMAL', 'WARNING'])->get();
        $generated = 0;

        foreach ($bins as $bin) {
            $readings = $bin->sensorReadings()
                ->latest('created_at')
                ->take(24)
                ->get()
                ->reverse()
                ->values()
                ->map(fn ($r, $i) => [
                    'x' => $i * 0.5,
                    'y' => $r->fill_level,
                ]);

            if ($readings->count() < 2) {
                continue;
            }

            try {
                $response = Http::timeout(5)->post(self::AI_SERVICE_URL, [
                    'bin_id'      => $bin->id,
                    'readings'    => $readings,
                    'day_of_week' => (int) now()->dayOfWeek,
                    'hour_of_day' => (int) now()->hour,
                ]);
            } catch (\Exception $e) {
                continue;
            }

            if ($response->failed()) {
                continue;
            }

            $data = $response->json();

            Prediction::create([
                'bin_id'              => $bin->id,
                'predicted_fill_time' => $data['estimated_hours'] !== null
                    ? now()->addMinutes((float) $data['estimated_hours'] * 60)
                    : null,
                'fill_probability'    => ($data['confidence'] ?? 0) / 100,
                'risk_level'          => $data['risk_level'] ?? 'LOW',
                'recommendation'      => $data['recommendation'] ?? '',
                'created_at'          => now(),
            ]);

            $generated++;
        }

        return $generated;
    }

    public function cleanup(int $days = 30): int
    {
        return Prediction::where('created_at', '<', now()->subDays($days))->delete();
    }
}
