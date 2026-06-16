<?php

namespace App\Http\Controllers;

use App\Models\Alert;
use App\Models\Bin;
use App\Models\Notification;
use App\Models\Prediction;
use App\Models\SensorReading;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MonitoringController extends Controller
{
    public function index(Request $request): Response
    {
        // ============================================================
        // Bennes
        // ============================================================
        $bins = Bin::all()->map(fn(Bin $bin) => [
            'id'          => $bin->code,
            'name'        => $bin->name ?? $bin->code,
            'location'    => $bin->location,
            'fillLevel'   => (int) round($bin->fill_level),
            'status'      => strtolower($bin->status),
            'lastUpdate'  => $bin->last_update?->diffForHumans() ?? 'N/A',
            'lat'         => (float) $bin->latitude,
            'lng'         => (float) $bin->longitude,
            'battery'     => (int) round($bin->battery_level),
            'temperature' => 24,
        ]);

        // ============================================================
        // Alertes récentes (non résolues)
        // ============================================================
        $alerts = Alert::with('bin')
            ->where('status', 'PENDING')
            ->latest('created_at')
            ->take(10)
            ->get()
            ->map(fn(Alert $alert) => [
                'id'       => $alert->id,
                'bin'      => $alert->bin?->code ?? 'N/A',
                'message'  => $alert->message ?? $alert->type,
                'severity' => strtolower($alert->severity),
                'status'   => strtolower($alert->status),
                'time'     => $alert->created_at?->diffForHumans() ?? 'N/A',
            ]);

        // ============================================================
        // Prédictions
        // ============================================================
        $predictions = Prediction::with('bin')
            ->latest('created_at')
            ->take(10)
            ->get()
            ->map(fn(Prediction $p) => [
                'id'             => $p->id,
                'bin'            => $p->bin?->code ?? 'N/A',
                'message'        => $p->recommendation ?? 'Débordement prévu',
                'priority'       => strtolower($p->risk_level),
                'estimatedHours' => $p->predicted_fill_time
                    ? max(1, now()->diffInHours($p->predicted_fill_time))
                    : 6,
            ]);

        // ============================================================
        // Activité récente (alertes + notifications + lectures)
        // ============================================================
        $recentAlerts = Alert::with('bin')
            ->latest('created_at')
            ->take(3)
            ->get()
            ->map(fn(Alert $a) => [
                'action' => 'Nouvelle alerte',
                'detail' => ($a->bin?->code ?? 'N/A') . ' — ' . ($a->message ?? $a->type),
                'time'   => $a->created_at?->diffForHumans() ?? 'N/A',
            ]);

        $recentNotifications = Notification::with('alert.bin')
            ->latest('sent_at')
            ->take(3)
            ->get()
            ->map(fn(Notification $n) => [
                'action' => 'Notification ' . ($n->status === 'SENT' ? 'envoyée' : 'échouée'),
                'detail' => $n->message ?? ($n->alert?->bin?->code ?? 'N/A') . ' — ' . $n->channel,
                'time'   => $n->sent_at?->diffForHumans() ?? 'N/A',
            ]);

        $recentReadings = SensorReading::with('bin')
            ->latest('created_at')
            ->take(3)
            ->get()
            ->map(fn(SensorReading $r) => [
                'action' => 'Lecture capteur',
                'detail' => ($r->bin?->code ?? 'N/A') . ' — ' . (int) round($r->fill_level ?? 0) . '%',
                'time'   => $r->created_at?->diffForHumans() ?? 'N/A',
            ]);

        $activity = collect()
            ->merge($recentAlerts)
            ->merge($recentNotifications)
            ->merge($recentReadings)
            ->sortByDesc(fn($a) => $a['time'])
            ->take(10)
            ->values();

        // ============================================================
        // Historique remplissage 24h
        // ============================================================
        $latestReadingDate = SensorReading::max('created_at');
        $fillLevelHistory = collect();

        if ($latestReadingDate) {
            $latestReadingDate = Carbon::parse($latestReadingDate);
            $startDate = $latestReadingDate->copy()->subHours(24);
            $readings = SensorReading::where('created_at', '>=', $startDate)
                ->where('created_at', '<=', $latestReadingDate)
                ->get(['created_at', 'fill_level']);

            $fillLevelHistory = $readings
                ->groupBy(fn($r) => (int) floor($r->created_at->hour / 4) * 4)
                ->map(fn($g, $slot) => [
                    'time'  => str_pad((string) $slot, 2, '0', STR_PAD_LEFT) . ':00',
                    'value' => (int) round($g->avg('fill_level')),
                ])
                ->sortBy('time')
                ->values();
        }

        // Fallback : 6 tranches si aucune lecture trouvée
        if ($fillLevelHistory->isEmpty()) {
            $fillLevelHistory = collect(range(0, 20, 4))->map(fn($h) => [
                'time'  => str_pad((string) $h, 2, '0', STR_PAD_LEFT) . ':00',
                'value' => (int) round(Bin::avg('fill_level') ?: 50),
            ]);
        }

        return Inertia::render('Monitoring/Index', [
            'bins'             => $bins,
            'alerts'           => $alerts,
            'predictions'      => $predictions,
            'activity'         => $activity,
            'fillLevelHistory' => $fillLevelHistory,
        ]);
    }
}
