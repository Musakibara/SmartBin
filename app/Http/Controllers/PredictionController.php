<?php

/**
 * Contrôleur des prédictions IA — interface entre la base de données
 * et le frontend React (Inertia).
 *
 * Routes :
 *   GET  /predictions              → index()   : liste paginée + stats
 *   POST /predictions/generate     → generate(): lance l'IA
 *   DELETE /predictions/{id}       → destroy() : supprime une prédiction
 *
 * Le contrôleur ne communique PAS directement avec l'IA Python.
 * Il délègue à PredictionService pour l'appel HTTP.
 */

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
    /**
     * Affiche la page des prédictions avec filtres, pagination et stats.
     *
     * Données envoyées au frontend (Predictions/Index.tsx) :
     *   - predictions : liste paginée (8 par page) formatée par mapPrediction()
     *   - bins        : liste de toutes les bennes (pour les infos)
     *   - filters     : search + priority (pour préserver les filtres)
     *   - stats       : total, high/medium/low, avgConfidence, activeFilter
     */
    public function index(Request $request): Response
    {
        $query = Prediction::with('bin');

        // ─── Filtres ───
        // Recherche textuelle sur le code ou le nom de la benne
        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('bin', function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                  ->orWhere('name', 'like', "%{$search}%");
            });
        }

        // Filtre par priorité (HIGH / MEDIUM / LOW)
        if ($request->filled('priority') && $request->priority !== 'Toutes') {
            $query->where('risk_level', strtoupper($request->priority));
        }

        $predictions = $query->latest('created_at')->paginate(8);

        $bins = Bin::select('id', 'code', 'name', 'location', 'fill_level')->get();

        // ─── Statistiques ───
        // Les stats prennent en compte la recherche mais PAS le filtre priorité
        // (sinon le graphique de distribution n'aurait qu'une seule couleur)
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

    /**
     * Déclenche la génération des prédictions via PredictionService.
     * Accessible aux rôles ADMIN, SUPERVISEUR, OPERATEUR (bouton "Lancer l'IA").
     */
    public function generate(PredictionService $service): RedirectResponse
    {
        $service->generate();
        return back();
    }

    /**
     * Supprime une prédiction spécifique.
     * Accessible aux rôles ADMIN et SUPERVISEUR (bouton poubelle).
     */
    public function destroy(Prediction $prediction): RedirectResponse
    {
        $prediction->delete();
        return back();
    }

    /**
     * Transforme une Prediction Eloquent en tableau formaté pour le frontend.
     *
     * Champs calculés :
     *   - estimatedHours : nombre d'heures restantes avant débordement
     *     (calculé dynamiquement à partir de predicted_fill_time)
     *   - progress       : pourcentage visuel (0-100) pour la barre de timeline
     *   - confidence     : fill_probability converti en pourcentage (0-100)
     *   - riskScore      : score numérique (0-99) basé sur le niveau de risque
     *     et le temps restant (plus c'est urgent, plus le score est élevé)
     */
    private function mapPrediction(Prediction $p): array
    {
        // Heures restantes : différence entre maintenant et le débordement estimé
        $estimatedHours = $p->predicted_fill_time
            ? max(0, now()->diffInHours($p->predicted_fill_time, false))
            : null;

        // Progression : 0% = benne vide, 100% = débordement imminent
        // Utilisé pour la barre de progression dans la timeline + cartes
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
            // Score de risque : HIGH=70-99, MEDIUM=35-69, LOW=5-34
            // Plus le temps restant est court, plus le score est élevé
            // (proche de la borne supérieure de la plage)
            'riskScore'       => round(match ($p->risk_level) {
                'HIGH'   => max(70, min(99, 100 - ($estimatedHours ?? 0) * 8)),
                'MEDIUM' => max(35, min(69, 70 - ($estimatedHours ?? 6) * 4)),
                'LOW'    => max(5, min(34, 35 - ($estimatedHours ?? 12) * 1.5)),
            }),
        ];
    }
}
