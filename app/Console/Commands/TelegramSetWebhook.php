<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

class TelegramSetWebhook extends Command
{
    protected $signature = 'telegram:set-webhook {url : L\'URL publique du webhook (ex: https://example.com/api/telegram/webhook)}';
    protected $description = 'Configure le webhook Telegram vers l\'URL spécifiée';

    public function handle(): int
    {
        $token = config('services.telegram.bot_token');
        $url = $this->argument('url');

        if (!$token) {
            $this->error('TELEGRAM_BOT_TOKEN non configuré dans .env');
            return self::FAILURE;
        }

        $response = Http::timeout(10)->post("https://api.telegram.org/bot{$token}/setWebhook", [
            'url' => $url,
        ]);

        $body = $response->json();

        if ($response->successful() && ($body['ok'] ?? false)) {
            $this->info("✅ Webhook configuré : {$url}");
            $this->line("Description : " . ($body['description'] ?? ''));
        } else {
            $this->error("❌ Échec : " . ($body['description'] ?? $response->body()));
            return self::FAILURE;
        }

        return self::SUCCESS;
    }
}
