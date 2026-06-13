<?php

use App\Http\Controllers\Api\SensorReadingController;
use Illuminate\Support\Facades\Route;

Route::middleware('api')->group(function () {
    Route::post('/sensor-readings', [SensorReadingController::class, 'store']);
});
