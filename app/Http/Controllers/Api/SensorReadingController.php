<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Alert;
use App\Models\Bin;
use App\Models\Notification;
use App\Models\Sensor;
use App\Models\SensorReading;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SensorReadingController extends Controller
{
    /**
     * Reçoit une lecture capteur depuis le pont Arduino,
     * met à jour la benne et crée une alerte si nécessaire.
     *
     * Endpoint : POST /api/sensor-readings
     * Appelé par : bridge/bridge.py (Python via port COM USB)
     */
    public function store(Request $request): JsonResponse
    {
        // ============================================================
        // Validation des données envoyées par l'Arduino
        // ============================================================
        $validated = $request->validate([
            'bin_code'   => 'required|string|max:50',
            'fill_level' => 'required|numeric|between:0,100',
            'temperature' => 'nullable|numeric',
            'battery'    => 'nullable|numeric|between:0,100',
        ]);

        // ============================================================
        // Recherche de la benne par son code métier (ex: BIN-001)
        // ============================================================
        $bin = Bin::where('code', $validated['bin_code'])->first();

        if (!$bin) {
            return response()->json(['error' => 'Benne introuvable'], 404);
        }

        // ============================================================
        // Création ou récupération du capteur ultrason pour cette benne
        // ============================================================
        $sensor = Sensor::firstOrCreate(
            ['bin_id' => $bin->id, 'type' => 'ULTRASONIC'],
            ['model' => 'HC-SR04', 'status' => 'ACTIVE'],
        );

        // ============================================================
        // Enregistrement de la lecture capteur
        // ============================================================
        $reading = SensorReading::create([
            'bin_id'           => $bin->id,
            'fill_level'       => $validated['fill_level'],
            'distance'         => null,
            'detected_presence' => true,
            'created_at'       => now(),
        ]);

        // ============================================================
        // Mise à jour de la benne (remplissage, batterie, statut)
        // ============================================================
        $status = 'NORMAL';
        if ($validated['fill_level'] >= 80) {
            $status = 'FULL';
        } elseif ($validated['fill_level'] >= 60) {
            $status = 'WARNING';
        }

        $bin->fill_level = $validated['fill_level'];
        $bin->battery_level = $validated['battery'] ?? $bin->battery_level;
        $bin->status = $status;
        $bin->last_update = now();
        $bin->save();

        // ============================================================
        // Création d'une alerte en fonction du seuil atteint
        // ============================================================
        if ($status === 'FULL') {
            $alert = Alert::create([
                'bin_id'  => $bin->id,
                'type'    => 'BIN_FULL',
                'message' => "Benne {$bin->code} pleine ({$validated['fill_level']}%)",
                'severity' => 'CRITICAL',
                'status'  => 'PENDING',
                'created_at' => now(),
            ]);

            $this->createNotifications($alert);
        } elseif ($status === 'WARNING') {
            $alert = Alert::create([
                'bin_id'  => $bin->id,
                'type'    => 'OVERFLOW_RISK',
                'message' => "Benne {$bin->code} proche de la saturation ({$validated['fill_level']}%)",
                'severity' => 'HIGH',
                'status'  => 'PENDING',
                'created_at' => now(),
            ]);

            $this->createNotifications($alert);
        }

        // ============================================================
        // Réponse JSON avec les données créées
        // ============================================================
        return response()->json([
            'message' => 'Lecture enregistrée',
            'reading' => $reading,
            'bin'     => [
                'code'    => $bin->code,
                'fill_level' => $bin->fill_level,
                'status'  => $bin->status,
            ],
        ], 201);
    }

    private function createNotifications(Alert $alert): void
    {
        Notification::create([
            'alert_id'  => $alert->id,
            'channel'   => 'EMAIL',
            'recipient' => config('app.alert_email', 'admin@smartbin.cm'),
            'message'   => $alert->message,
            'status'    => 'PENDING',
        ]);

        $telegramUsers = User::whereNotNull('telegram_chat_id')->get();
        foreach ($telegramUsers as $user) {
            Notification::create([
                'alert_id'  => $alert->id,
                'channel'   => 'TELEGRAM',
                'recipient' => $user->telegram_chat_id,
                'message'   => $alert->message,
                'status'    => 'PENDING',
            ]);
        }
    }
}
