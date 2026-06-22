<?php

namespace App\Http\Controllers;

use App\Models\Bin;
use App\Models\Prediction;
use App\Services\PredictionService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PredictionController extends Controller
{

    public function index(Request $request): Response
    {
        $query = Prediction::with('bin');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('bin', function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                  ->orWhere('name', 'like', "%{$search}%");
            });
        }

        if ($request->filled('priority') && $request->priority !== 'Toutes') {
            $query->where('risk_level', strtoupper($request->priority));
        }

        $predictions = $query->latest('created_at')->paginate(8);

        $bins = Bin::select('id', 'code', 'name', 'location', 'fill_level')->get();

        // Stats tenant compte de la recherche mais pas du filtre priorité
        $statsBase = Prediction::query();
        if ($request->filled('search')) {
            $s = $request->search;
            $statsBase->whereHas('bin', fn($q) => $q->where('code', 'like', "%{$s}%")->orWhere('name', 'like', "%{$s}%"));
        }

        $stats = [
            'total'          => (clone $statsBase)->count(),
            'high'           => (clone $statsBase)->where('risk_level', 'HIGH')->count(),
            'medium'         => (clone $statsBase)->where('risk_level', 'MEDIUM')->count(),
            'low'            => (clone $statsBase)->where('risk_level', 'LOW')->count(),
            'avgConfidence'  => round((clone $statsBase)->avg('fill_probability') * 100, 1),
            'activeFilter'   => $request->priority ?? 'Toutes',
        ];

        return Inertia::render('Predictions/Index', [
            'predictions' => $predictions->through(fn (Prediction $p) => $this->mapPrediction($p)),
            'bins'        => $bins,
            'filters'     => $request->only(['search', 'priority']),
            'stats'       => $stats,
        ]);
    }

    public function generate(PredictionService $service): RedirectResponse
    {
        $service->generate();

        return back();
    }

    public function destroy(Prediction $prediction): RedirectResponse
    {
        $prediction->delete();
        return back();
    }

    private function mapPrediction(Prediction $p): array
    {
        $estimatedHours = $p->predicted_fill_time
            ? max(0, now()->diffInHours($p->predicted_fill_time, false))
            : null;

        $progress = $estimatedHours !== null
            ? min(95, max(5, ($estimatedHours / 24) * 100))
            : 50;

        return [
            'id'              => $p->id,
            'bin'             => $p->bin?->code ?? 'N/A',
            'binName'         => $p->bin?->name ?? $p->bin?->code ?? 'N/A',
            'binLocation'     => $p->bin?->location ?? '',
            'fillLevel'       => $p->bin?->fill_level ?? 0,
            'message'         => $p->recommendation ?? 'Prédiction générée',
            'priority'        => strtolower($p->risk_level),
            'estimatedHours'  => $estimatedHours ?? 0,
            'progress'        => round($progress),
            'confidence'      => round($p->fill_probability * 100, 1),
            'riskScore'       => round(match ($p->risk_level) {
                'HIGH'   => max(70, min(99, 100 - ($estimatedHours ?? 0) * 8)),
                'MEDIUM' => max(35, min(69, 70 - ($estimatedHours ?? 6) * 4)),
                'LOW'    => max(5, min(34, 35 - ($estimatedHours ?? 12) * 1.5)),
            }),
        ];
    }
}
