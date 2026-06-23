<?php

namespace App\Console\Commands;

use App\Jobs\SendNotification;
use App\Models\Notification;
use Illuminate\Console\Command;

class SendNotifications extends Command
{
    protected $signature = 'notifications:send
                            {--sync : Exécuter synchrone sans queue}';

    protected $description = 'Envoie les notifications en attente (EMAIL / TELEGRAM)';

    public function handle(): int
    {
        $pending = Notification::where('status', 'PENDING')->get();

        if ($pending->isEmpty()) {
            $this->info('Aucune notification en attente.');

            return self::SUCCESS;
        }

        $this->info("{$pending->count()} notification(s) en attente.");

        foreach ($pending as $notification) {
            if ($this->option('sync')) {
                dispatch_sync(new SendNotification($notification));
            } else {
                dispatch(new SendNotification($notification));
            }
        }

        $this->info('Traitement terminé.');

        return self::SUCCESS;
    }
}
