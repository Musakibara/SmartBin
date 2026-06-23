<?php

namespace App\Jobs;

use App\Models\Notification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        protected Notification $notification,
    ) {}

    public function handle(): void
    {
        try {
            match ($this->notification->channel) {
                'EMAIL'    => $this->sendEmail(),
                'TELEGRAM' => $this->sendTelegram(),
                default    => throw new \InvalidArgumentException("Unknown channel: {$this->notification->channel}"),
            };

            $this->notification->update([
                'status'   => 'SENT',
                'sent_at'  => now(),
            ]);
        } catch (\Throwable $e) {
            Log::error("Échec envoi notification {$this->notification->id} : {$e->getMessage()}");
            $this->notification->update(['status' => 'FAILED']);
        }
    }

    private function sendEmail(): void
    {
        Mail::raw($this->notification->message, function ($msg) {
            $msg->to($this->notification->recipient)
                ->subject("SmartBin — Alerte {$this->notification->alert?->severity}");
        });
    }

    private function sendTelegram(): void
    {
        $token = config('services.telegram.bot_token');

        if (!$token) {
            throw new \RuntimeException('TELEGRAM_BOT_TOKEN non configuré');
        }

        Http::timeout(10)->post("https://api.telegram.org/bot{$token}/sendMessage", [
            'chat_id'                  => $this->notification->recipient,
            'text'                     => $this->notification->message,
            'parse_mode'               => 'HTML',
            'disable_web_page_preview' => true,
        ])->throw();
    }
}
