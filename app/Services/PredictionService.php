<?php

/**
 * Service de prédiction — pont entre Laravel et l'IA Python.
 *
 * Architecture :
 *   ┌──────────────┐     HTTP POST      ┌──────────────────┐
 *   │  Laravel PHP  │ ─────────────────→ │  AI Service      │
 *   │  (ce service) │ ←──────────────── │  (FastAPI:8001)  │
 *   └──────────────┘     JSON reply     └──────────────────┘
 *
 * Le service PHP :
 *   1. Récupère les 168 derniers relevés de chaque benne active
 *   2. Les envoie à l'IA (predict/v2 — Prophet, ou fallback linéaire)
 *   3. Stocke le résultat en base (table `predictions`)
 *
 * Appelé par :
 *   - `php artisan predictions:generate` (toutes les heures)
 *   - PredictionController::generate() (bouton "Lancer l'IA" dans le frontend)
 */

namespace App\Services;

use App\Models\Bin;
use App\Models\Prediction;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PredictionService
{
    /**
     * URL du service IA Python (FastAPI).
     * Doit être accessible depuis le serveur Laravel.
     * Port 8001 par défaut (défini dans ai_service/main.py).
     */
    private const AI_URL = 'http://127.0.0.1:8001';

    /**
     * Génère les prédictions pour toutes les bennes actives.
     *
     * Étapes :
     *   1. Sélectionner les bennes NORMAL et WARNING (pas FULL — inutile)
     *   2. Supprimer les anciennes prédictions (éviter les doublons)
     *   3. Pour chaque benne, envoyer ses 168 derniers relevés à l'IA
     *   4. Créer une nouvelle Prediction en base avec le résultat
     *
     * @return int Nombre de prédictions générées
     */
    public function generate(): int
    {
        // On ne prédit que pour les bennes actives.
        // Les bennes FULL sont déjà à 100%, pas besoin de prédiction.
        $bins = Bin::whereIn('status', ['NORMAL', 'WARNING'])->get();

        $generated = 0;

        foreach ($bins as $bin) {
            // 168 relevés = 7 jours au pas horaire (24h * 7j)
            // Prophet en a besoin pour détecter la saisonnalité hebdomadaire.
            $readings = $bin->sensorReadings()
                ->latest('created_at')
                ->take(168)
                ->get()
                ->reverse()            // ordre chronologique (du plus vieux au plus récent)
                ->values()             // réindexe les clés après reverse()
                ->map(fn ($r) => [
                    'ds' => $r->created_at->toIso8601String(),
                    'y'  => $r->fill_level,
                ]);

            // Minimum 2 relevés pour une régression linéaire
            if ($readings->count() < 2) {
                continue;
            }

            $payload = [
                'bin_id'   => $bin->id,
                'readings' => $readings,
            ];

            // ─── Appel HTTP à l'IA Python ───
            // Timeout 10s : si l'IA est lente (Prophet peut prendre 1-3s par benne),
            // on passe à la benne suivante plutôt que de bloquer.
            try {
                $response = Http::timeout(10)->post(self::AI_URL . '/api/predict/v2', $payload);
            } catch (\Exception $e) {
                Log::warning("PredictService: AI service unreachable for bin {$bin->code}: {$e->getMessage()}");
                continue;
            }

            if ($response->failed()) {
                Log::warning("PredictService: AI error for bin {$bin->code}: {$response->body()}");
                continue;
            }

            $data = $response->json();
            $model = $data['model'] ?? 'linear';     // 'prophet' ou 'linear'

            // ─── Supprimer l'ancienne prédiction APRÈS avoir confirmé le succès ───
            // Si l'appel IA échoue pour cette benne, l'ancienne prédiction est conservée
            // plutôt que de se retrouver avec une page vide.
            Prediction::where('bin_id', $bin->id)->delete();

            // ─── Sauvegarde en base ───
            // predicted_fill_time = timestamp estimé du débordement
            // fill_probability    = confiance (0.00 à 1.00)
            // risk_level          = HIGH / MEDIUM / LOW
            // recommendation      = message textuel + indication du modèle utilisé
            Prediction::create([
                'bin_id'              => $bin->id,
                'predicted_fill_time' => $data['estimated_hours'] !== null
                    ? now()->addMinutes((float) $data['estimated_hours'] * 60)
                    : null,
                'fill_probability'    => ($data['confidence'] ?? 0) / 100,
                'risk_level'          => $data['risk_level'] ?? 'LOW',
                'recommendation'      => ($data['recommendation'] ?? '') . ($model === 'prophet' ? ' (Prophet)' : ''),
                'created_at'          => now(),
            ]);

            $generated++;
        }

        Log::info("PredictService: {$generated} predictions generated");
        return $generated;
    }

    /**
     * Nettoie les prédictions plus vieilles que $days jours.
     * Évite l'accumulation en base (les prédictions horaires peuvent
     * devenir très nombreuses).
     *
     * @param int $days Âge maximum des prédictions à garder (défaut: 30)
     * @return int Nombre de prédictions supprimées
     */
    public function cleanup(int $days = 30): int
    {
        return Prediction::where('created_at', '<', now()->subDays($days))->delete();
    }
}
