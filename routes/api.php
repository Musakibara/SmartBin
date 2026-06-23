<?php

use App\Http\Controllers\Api\GeocodeController;
use App\Http\Controllers\Api\SensorReadingController;
use App\Http\Controllers\Api\TelegramController;
use Illuminate\Support\Facades\Route;

Route::post('/telegram/webhook', [TelegramController::class, 'webhook']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/sensor-readings', [SensorReadingController::class, 'store']);
    Route::get('/geocode/search', [GeocodeController::class, 'search']);
});
