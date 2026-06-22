<?php

namespace App\Services;

use App\Mail\AlertNotification;
use App\Models\Notification;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class NotificationService
{
    public function send(Notification $notification): void
    {
        try {
            match ($notification->channel) {
                'EMAIL'   => $this->sendEmail($notification),
                'TELEGRAM' => $this->sendTelegram($notification),
                default   => throw new \InvalidArgumentException("Canal inconnu : {$notification->channel}"),
            };

            $notification->update([
                'status'  => 'SENT',
                'sent_at' => now(),
            ]);
        } catch (\Throwable $e) {
            Log::error("Échec envoi notification {$notification->id} : {$e->getMessage()}");

            $notification->update([
                'status'  => 'FAILED',
                'sent_at' => now(),
            ]);
        }
    }

    private function sendEmail(Notification $notification): void
    {
        Mail::to($notification->recipient)->send(new AlertNotification($notification));
    }

    private function sendTelegram(Notification $notification): void
    {
        $token = config('services.telegram.bot_token');
        $chatId = $notification->recipient;

        if (!$token || !$chatId) {
            throw new \RuntimeException('Token Telegram ou chat_id manquant');
        }

        $alert = $notification->alert;
        $bin = $alert?->bin;
        $severity = $alert?->severity ?? 'INFO';
        $emoji = match (strtoupper($severity)) {
            'CRITICAL' => "\u{1F534}",
            'HIGH'     => "\u{1F7E0}",
            'MEDIUM'   => "\u{1F7E1}",
            'LOW'      => "\u{1F7E2}",
            default    => "\u{2139}\u{FE0F}",
        };

        $line = '────────────────';
        $text = "<b>{$emoji} SmartBin - Alerte {$severity}</b>\n"
            . "{$line}\n\n"
            . "<b>Message :</b> {$notification->message}\n\n"
            . ($bin ? "<b>Benne :</b> {$bin->code}\n" : '')
            . ($bin && $bin->location ? "<b>Lieu :</b> {$bin->location}\n" : '')
            . "<b>Date :</b> " . ($notification->sent_at?->format('d/m/Y H:i') ?? now()->format('d/m/Y H:i')) . "\n\n"
            . "<a href=\"" . config('app.url') . "/dashboard\">🔗 Voir sur le tableau de bord</a>";

        $response = Http::timeout(10)->post("https://api.telegram.org/bot{$token}/sendMessage", [
            'chat_id'    => $chatId,
            'text'       => $text,
            'parse_mode' => 'HTML',
            'disable_web_page_preview' => true,
        ]);

        if (!$response->successful()) {
            throw new \RuntimeException("Telegram API error : {$response->body()}");
        }
    }
}
