<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class TelegramController extends Controller
{
    public function webhook(Request $request): JsonResponse
    {
        $update = $request->all();
        $message = $update['message'] ?? null;

        if (!$message || !isset($message['chat']['id'])) {
            return response()->json(['ok' => false], 200);
        }

        $chatId = $message['chat']['id'];
        $text = trim($message['text'] ?? '');
        $firstName = $message['chat']['first_name'] ?? '';

        if ($text === '/start') {
            $this->sendMessage($chatId,
                '👋 <b>Bienvenue sur SmartBin, ' . $firstName . '!</b>' . "\n\n"
                . "Pour recevoir les alertes, envoie ta commande :\n"
                . "<code>/register ton@email.com</code>\n\n"
                . "J'associerai ton compte SmartBin a ce chat Telegram."
            );
            return response()->json(['ok' => true], 200);
        }

        if (str_starts_with($text, '/register')) {
            $parts = preg_split('/\s+/', $text, 2);
            $email = $parts[1] ?? '';

            if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $this->sendMessage($chatId, '❌ Format invalide. Utilise : <code>/register ton@email.com</code>');
                return response()->json(['ok' => true], 200);
            }

            $user = User::where('email', $email)->first();

            if (!$user) {
                $this->sendMessage($chatId, '❌ Aucun compte SmartBin trouve avec l\'email <code>' . $email . '</code>.');
                return response()->json(['ok' => true], 200);
            }

            if ($user->telegram_chat_id && $user->telegram_chat_id !== (string) $chatId) {
                $this->sendMessage($chatId,
                    '⚠️ Ce compte est deja lie a un autre chat Telegram.' . "\n"
                    . "Contacte un administrateur si tu souhaites le reinitialiser."
                );
                return response()->json(['ok' => true], 200);
            }

            $user->update(['telegram_chat_id' => (string) $chatId]);

            $line = '━━━━━━━━━━━━━━━━━━━━';
            $this->sendMessage($chatId,
                '✅ <b>Compte lie avec succes!</b>' . "\n\n"
                . "Tu recevras desormais les alertes SmartBin ici.\n"
                . $line . "\n"
                . '👤 ' . $user->name . "\n"
                . '📧 ' . $user->email . "\n"
                . '📊 Rôle : ' . $user->role
            );

            return response()->json(['ok' => true], 200);
        }

        $this->sendMessage($chatId,
            '🤖 Commande inconnue. Envoie <code>/start</code> pour voir les instructions.'
        );

        return response()->json(['ok' => true], 200);
    }

    private function sendMessage(int $chatId, string $text): void
    {
        $token = config('services.telegram.bot_token');
        if (!$token) {
            return;
        }

        Http::timeout(10)->post("https://api.telegram.org/bot{$token}/sendMessage", [
            'chat_id'                   => $chatId,
            'text'                      => $text,
            'parse_mode'                => 'HTML',
            'disable_web_page_preview'  => true,
        ]);
    }
}
