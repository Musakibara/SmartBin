<?php

use App\Http\Controllers\Api\SensorReadingController;
use App\Http\Controllers\Api\TelegramController;
use Illuminate\Support\Facades\Route;

Route::middleware('api')->group(function () {
    Route::post('/sensor-readings', [SensorReadingController::class, 'store']);
    Route::post('/telegram/webhook', [TelegramController::class, 'webhook']);
});
