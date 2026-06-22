<?php

namespace App\Console\Commands;

use App\Services\PredictionService;
use Illuminate\Console\Command;

class CleanupPredictions extends Command
{
    protected $signature = 'predictions:cleanup {--days=30 : Âge maximum des prédictions à conserver en jours}';
    protected $description = 'Supprime les prédictions plus vieilles que le nombre de jours spécifié';

    public function handle(PredictionService $service): int
    {
        $days = (int) $this->option('days');

        $this->info("Nettoyage des prédictions de plus de {$days} jours...");

        $deleted = $service->cleanup($days);

        $this->info("{$deleted} anciennes prédictions supprimées.");

        return self::SUCCESS;
    }
}
