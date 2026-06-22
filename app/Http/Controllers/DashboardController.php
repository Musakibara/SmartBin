<?php

namespace App\Http\Controllers;

use App\Models\Alert;
use App\Models\Bin;
use App\Models\Notification;
use App\Models\Prediction;
use App\Models\Sensor;
use App\Models\SensorReading;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        // ============================================================
        // KPI 1 : Nombre total de bennes déployées
        // ============================================================
        $totalBins = Bin::count();

        // ============================================================
        // KPI 2 : Capteurs actifs (statut = 'ACTIVE')
        // ============================================================
        $activeSensors = Sensor::where('status', 'ACTIVE')->count();

        // ============================================================
        // KPI 3 : Niveau de remplissage moyen (toutes les lectures)
        // ============================================================
        $averageFillLevel = round(SensorReading::avg('fill_level') ?? 0);

        // ============================================================
        // KPI 4 : Alertes en attente (non résolues)
        // ============================================================
        $criticalAlerts = Alert::where('status', 'PENDING')->count();

        // ============================================================
        // KPI 5 : Prédictions à risque HIGH (débordement imminent)
        // ============================================================
        $predictedOverflows = Prediction::where('risk_level', 'HIGH')->count();

        // ============================================================
        // KPI 6 : Notifications envoyées avec succès
        // ============================================================
        $notificationsSent = Notification::where('status', 'SENT')->count();

        // ============================================================
        // Bennes : transformation des champs
        // La BD stocke en snake_case, le frontend attend du camelCase
        // Les ENUMs sont en UPPERCASE dans la BD, le frontend attend
        // du lowercase.
        // ============================================================
        $bins = Bin::all()->map(function (Bin $bin) {
            return [
                'id'          => $bin->code,
                'name'        => $bin->name ?? $bin->code,
                'location'    => $bin->location,
                'fillLevel'   => $bin->fill_level,
                'status'      => strtolower($bin->status),
                'lastUpdate'  => $bin->last_update
                    ? $bin->last_update->diffForHumans()
                    : 'N/A',
                'lat'         => (float) $bin->latitude,
                'lng'         => (float) $bin->longitude,
                'battery'     => $bin->battery_level,
                'temperature' => 24,
            ];
        });

        // ============================================================
        // Alertes récentes (4 dernières non résolues)
        // Avec le nom de la benne associée via la relation belongsTo
        // ============================================================
        $alerts = Alert::with('bin')
            ->where('status', 'PENDING')
            ->latest('created_at')
            ->take(4)
            ->get()
            ->map(function (Alert $alert) {
                return [
                    'id'       => $alert->id,
                    'bin'      => $alert->bin?->code ?? 'N/A',
                    'message'  => $alert->message ?? $alert->type,
                    'severity' => strtolower($alert->severity),
                    'status'   => strtolower($alert->status),
                    'time'     => $alert->created_at
                        ? $alert->created_at->diffForHumans()
                        : 'N/A',
                ];
            });

        // ============================================================
        // Historique 24h pour le graphique d'évolution
        // Regroupe les lectures capteur par tranches de 4h
        // et calcule la moyenne du fill_level pour chaque intervalle
        //
        // FLOOR(HOUR(created_at) / 4) → 0, 1, 2, 3, 4, 5
        // (×4 donne 00:00, 04:00, 08:00, 12:00, 16:00, 20:00)
        // ============================================================
        $period = request()->query('period', '24h');

        $latestReadingDate = SensorReading::max('created_at');

        $readings = collect();
        if ($latestReadingDate) {
            $latestReadingDate = Carbon::parse($latestReadingDate);
            $startDate = match ($period) {
                '24h' => $latestReadingDate->copy()->subHours(24),
                '7d'  => $latestReadingDate->copy()->subDays(7),
                '30d' => $latestReadingDate->copy()->subDays(30),
                '12m' => $latestReadingDate->copy()->subYear(),
                default => $latestReadingDate->copy()->subHours(24),
            };

            $readings = SensorReading::where('created_at', '>=', $startDate)
                ->where('created_at', '<=', $latestReadingDate)
                ->get(['created_at', 'fill_level']);
        }

        $fillLevelHistory = match ($period) {
            '24h' => $readings
                ->groupBy(fn($r) => (int) floor($r->created_at->hour / 4) * 4)
                ->map(fn($g, $slot) => [
                    'time'  => str_pad((string) $slot, 2, '0', STR_PAD_LEFT) . ':00',
                    'value' => (int) round($g->avg('fill_level')),
                ])
                ->sortBy('time')
                ->values(),

            '7d' => $readings
                ->groupBy(fn($r) => $r->created_at->format('Y-m-d'))
                ->map(fn($g, $day) => [
                    'time'  => \Carbon\Carbon::parse($day)->format('D d'),
                    'value' => (int) round($g->avg('fill_level')),
                ])
                ->sortBy('time')
                ->values(),

            '30d' => $readings
                ->groupBy(fn($r) => (int) floor($r->created_at->diffInDays(now()) / 5))
                ->map(fn($g, $p) => [
                    'time'  => 'J' . ((int) $p * 5 + 1) . '-' . ((int) ($p + 1) * 5),
                    'value' => (int) round($g->avg('fill_level')),
                ])
                ->sortBy('time')
                ->values(),

            '12m' => $readings
                ->groupBy(fn($r) => $r->created_at->format('Y-m'))
                ->map(fn($g, $m) => [
                    'time'  => \Carbon\Carbon::parse($m . '-01')->format('M Y'),
                    'value' => (int) round($g->avg('fill_level')),
                ])
                ->sortBy('time')
                ->values(),

            default => collect(),
        };

        // ============================================================
        // On regroupe les KPI dans un objet unique pour correspondre
        // à la structure attendue par le frontend
        // ============================================================
        $kpiData = [
            'totalBins'           => $totalBins,
            'activeSensors'       => $activeSensors,
            'criticalAlerts'      => $criticalAlerts,
            'averageFillLevel'    => $averageFillLevel,
            'predictedOverflows'  => $predictedOverflows,
            'notificationsSent'   => $notificationsSent,
        ];

        // ============================================================
        // On transmet toutes les données à la page Inertia
        // Le frontend les récupère via usePage().props
        // ============================================================
        return Inertia::render('Dashboard/Index', [
            'kpiData'          => $kpiData,
            'bins'             => $bins,
            'alerts'           => $alerts,
            'fillLevelHistory' => $fillLevelHistory,
            'period'           => $period,
        ]);
    }
}
