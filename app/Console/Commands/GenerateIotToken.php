<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class GenerateIotToken extends Command
{
    protected $signature = 'sanctum:generate-token
                            {user? : Email du compte IoT (default: system@smartbin.cm)}
                            {--name=arduino-bridge : Nom du token}';

    protected $description = 'Génère un token Sanctum pour les capteurs IoT';

    public function handle(): int
    {
        $email = $this->argument('user') ?? 'system@smartbin.cm';

        $user = User::where('email', $email)->first();

        if (!$user) {
            $this->error("Utilisateur {$email} introuvable.");

            return self::FAILURE;
        }

        $name = $this->option('name');
        $token = $user->createToken($name, ['sensor:create'])->plainTextToken;

        $this->info("Token « {$name} » généré pour {$email} :");
        $this->line($token);

        return self::SUCCESS;
    }
}
