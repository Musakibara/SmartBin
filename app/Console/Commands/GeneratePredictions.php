<?php

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
