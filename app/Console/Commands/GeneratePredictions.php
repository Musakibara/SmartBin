<?php

/**
 * Commande Artisan : génération des prédictions IA.
 *
 * Exécution : php artisan predictions:generate
 * Planifié : routes/console.php → hourly()
 *
 * Appelle PredictionService::generate() qui :
 *   1. Récupère les bennes actives (NORMAL / WARNING)
 *   2. Envoie leurs relevés à l'IA Python (POST /api/predict/v2)
 *   3. Stocke les résultats en base (table `predictions`)
 *
 * Si le service IA est injoignable, les bennes sont ignorées
 * (log warning) et la commande continue.
 */

namespace App\Console\Commands;

use App\Services\PredictionService;
use Illuminate\Console\Command;

class GeneratePredictions extends Command
{
    protected $signature = 'predictions:generate';
    protected $description = 'Génère les prédictions IA pour toutes les bennes actives (NORMAL / WARNING)';

    public function handle(PredictionService $service): int
    {
        $this->info('Génération des prédictions en cours...');

        $count = $service->generate();

        $this->info("{$count} prédictions générées avec succès.");

        return self::SUCCESS;
    }
}
