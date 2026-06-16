<?php

namespace App\Http\Controllers;

use App\Models\Bin;
use App\Models\Sensor;
use App\Models\SensorReading;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SensorController extends Controller
{
    private const TYPE_MAP = [
        'ULTRASONIC'   => 'Ultrason',
        'WEIGHT'       => 'Poids',
        'TEMPERATURE'  => 'Température',
        'BATTERY'      => 'Batterie',
    ];

    public function index(): Response
    {
        $sensors = Sensor::with('bin')->get()->map(function (Sensor $sensor) {
            $bin = $sensor->bin;
            if (!$bin) return null;

            $latestReading = SensorReading::where('bin_id', $bin->id)
                ->latest('created_at')
                ->first();

            $minutesSinceLastReading = $latestReading
                ? $latestReading->created_at->diffInMinutes(now())
                : 9999;

            $status = $bin->battery_level < 20
                ? 'error'
                : ($minutesSinceLastReading > 1440 ? 'offline' : 'online');

            $lastValue = match ($sensor->type) {
                'ULTRASONIC'  => ($latestReading?->fill_level ?? 0) . '%',
                'WEIGHT'      => round(($latestReading?->distance ?? 50) / 2, 1) . 'kg',
                'TEMPERATURE' => ($bin->fill_level > 70 ? 32 : 24) . '°C',
                'BATTERY'     => $bin->battery_level . '%',
                default       => '—',
            };

            $history = SensorReading::where('bin_id', $bin->id)
                ->latest('created_at')
                ->take(8)
                ->get()
                ->reverse()
                ->map(function (SensorReading $r) {
                    return [
                        'time'  => $r->created_at->format('H\h'),
                        'value' => (int) round($r->fill_level ?? $r->distance / 2),
                    ];
                })->values();

            return [
                'id'          => $sensor->id,
                'displayId'   => 'SNS-' . strtoupper(substr($sensor->id, 0, 6)),
                'binId'       => $bin->code,
                'binName'     => $bin->name ?? $bin->code,
                'type'        => self::TYPE_MAP[$sensor->type] ?? $sensor->type,
                'status'      => $status,
                'battery'     => (int) round($bin->battery_level),
                'lastReading' => $latestReading
                    ? $latestReading->created_at->diffForHumans()
                    : 'Jamais',
                'lastValue'   => $lastValue,
                'signal'      => $minutesSinceLastReading < 60 ? 90
                    : ($minutesSinceLastReading < 360 ? 70
                        : ($minutesSinceLastReading < 1440 ? 40 : 15)),
                'location'    => $bin->location,
                'history'     => $history,
            ];
        })->filter()->values();

        $bins = Bin::select('id', 'code', 'name')->get()->map(fn($b) => [
            'id'   => $b->id,
            'code' => $b->code,
            'name' => $b->name ?? $b->code,
        ]);

        return Inertia::render('Sensors/Index', [
            'sensors' => $sensors,
            'bins'    => $bins,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'bin_id' => 'required|uuid|exists:bins,id',
            'type'   => 'required|string|in:ULTRASONIC,WEIGHT,TEMPERATURE,BATTERY',
            'model'  => 'required|string|max:100',
            'status' => 'nullable|in:ACTIVE,INACTIVE',
        ]);

        Sensor::create([
            'bin_id' => $validated['bin_id'],
            'type'   => $validated['type'],
            'model'  => $validated['model'],
            'status' => $validated['status'] ?? 'ACTIVE',
        ]);

        return redirect()->back();
    }

    public function update(Request $request, string $id): RedirectResponse
    {
        $sensor = Sensor::findOrFail($id);

        $validated = $request->validate([
            'type'   => 'required|string|in:ULTRASONIC,WEIGHT,TEMPERATURE,BATTERY',
            'model'  => 'required|string|max:100',
            'status' => 'nullable|in:ACTIVE,INACTIVE',
        ]);

        $sensor->update($validated);

        return redirect()->back();
    }

    public function destroy(string $id): RedirectResponse
    {
        $sensor = Sensor::findOrFail($id);
        $sensor->delete();

        return redirect()->back();
    }
}
