<?php

/**
 * ──────────────────────────────────────────────────────────
 * ATTENTION DÉPLOIEMENT — NE PAS OUBLIER
 * ──────────────────────────────────────────────────────────
 * Ajouter cette ligne dans le crontab du serveur :
 *
 *   * * * * * cd /chemin/vers/smartbin && php artisan schedule:run >> /dev/null 2>&1
 *
 * Sans cette ligne, le scheduler Laravel ne tourne PAS
 * et les prédictions ne sont jamais générées automatiquement.
 * ──────────────────────────────────────────────────────────
 */

use Illuminate\Support\Facades\Schedule;

// Planification des prédictions IA
Schedule::command('predictions:generate')->hourly();
Schedule::command('predictions:cleanup --days=30')->daily();

// Envoi des notifications en attente (EMAIL / TELEGRAM)
Schedule::command('notifications:send')->everyMinute();
