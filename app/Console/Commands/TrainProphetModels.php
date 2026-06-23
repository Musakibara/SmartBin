<?php

/**
 * Commande Artisan : entraînement des modèles Prophet.
 *
 * Exécution : php artisan predictions:train-prophet
 * Planifié : routes/console.php → dailyAt('02:00')
 *
 * Pour chaque benne :
 *   1. Récupère les 336 derniers relevés (14 jours)
 *   2. Les envoie à l'IA (POST /api/train/prophet)
 *   3. L'IA sauvegarde le modèle en .pkl dans ai_service/models/
 *
 * Si une benne a moins de 14 relevés, elle est ignorée (pas assez
 * de données pour un entraînement fiable).
 *
 * Prérequis :
 *   - Le service IA Python doit tourner sur 127.0.0.1:8001
 *   - Les modèles sont sauvegardés dans ai_service/models/ (gitignoré)
 */

namespace App\Console\Commands;

use App\Models\Bin;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TrainProphetModels extends Command
{
    /**
     * Nom de la commande (utilisé dans le scheduler et en CLI).
     * Exemple : php artisan predictions:train-prophet
     */
    protected $signature = 'predictions:train-prophet';

    /**
     * Description affichée dans php artisan list.
     */
    protected $description = 'Entraîne les modèles Prophet pour toutes les bennes avec suffisamment de données';

    public function handle(): int
    {
        $this->info('Entraînement des modèles Prophet...');

        $bins = Bin::all();
        $trained = 0;
        $skipped = 0;

        foreach ($bins as $bin) {
            // 336 relevés = 14 jours au pas horaire (24h * 14j)
            // Prophet a besoin de minimum 2 semaines pour détecter correctement
            // la saisonnalité hebdomadaire et les tendances.
            $readings = $bin->sensorReadings()
                ->latest('created_at')
                ->take(336)
                ->get()
                ->reverse()            // ordre chronologique
                ->values()
                ->map(fn ($r) => [
                    'ds' => $r->created_at->toIso8601String(),
                    'y'  => $r->fill_level,
                ]);

            // Minimum 14 relevés requis par Prophet (voir prophet_train.py)
            if ($readings->count() < 14) {
                $this->warn("  {$bin->code}: ignoré ({$readings->count()} lectures, 14 requises)");
                $skipped++;
                continue;
            }

            try {
                // Timeout 60s : Prophet peut prendre 10-30s par benne
                // (entraînement MCMC avec Stan)
                $response = Http::timeout(60)->post('http://127.0.0.1:8001/api/train/prophet', [
                    'bin_id'   => $bin->id,
                    'readings' => $readings,
                ]);

                if ($response->failed()) {
                    $this->error("  {$bin->code}: erreur API ({$response->body()})");
                    Log::warning("TrainProphet: erreur pour {$bin->code}: {$response->body()}");
                    continue;
                }

                $data = $response->json();

                // Statut 'trained' = entraînement réussi
                // Statut 'skipped'  = pas assez de données (géré par l'IA)
                if (($data['status'] ?? '') === 'trained') {
                    $this->info("  {$bin->code}: entraîné ({$data['num_readings']} lectures)");
                    $trained++;
                } else {
                    $reason = $data['reason'] ?? 'ignoré';
                    $this->warn("  {$bin->code}: {$reason}");
                    $skipped++;
                }
            } catch (\Exception $e) {
                // Service IA injoignable (serveur Python éteint ?)
                $this->error("  {$bin->code}: service IA injoignable");
                Log::warning("TrainProphet: service IA injoignable pour {$bin->code}: {$e->getMessage()}");
                $skipped++;
            }
        }

        $this->info("Terminé : {$trained} entraînés, {$skipped} ignorés.");
        return self::SUCCESS;
    }
}
