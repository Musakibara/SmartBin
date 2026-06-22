<?php

namespace App\Console\Commands;

use App\Models\Notification;
use App\Services\NotificationService;
use Illuminate\Console\Command;

class SendPendingNotifications extends Command
{
    protected $signature = 'notifications:send';

    protected $description = 'Envoie les notifications en attente (EMAIL / TELEGRAM)';

    public function handle(NotificationService $service): int
    {
        $pending = Notification::where('status', 'PENDING')->get();

        if ($pending->isEmpty()) {
            $this->info('Aucune notification en attente.');
            return self::SUCCESS;
        }

        $this->info("Envoi de {$pending->count()} notification(s)...");

        foreach ($pending as $notification) {
            $service->send($notification);
            $this->line("  [{$notification->channel}] {$notification->id} -> {$notification->recipient}");
        }

        $this->info('Terminé.');
        return self::SUCCESS;
    }
}
