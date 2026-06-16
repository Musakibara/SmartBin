<?php

use App\Http\Controllers\AlertController;
use App\Http\Controllers\BinController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\MonitoringController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SensorController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome');
});

Route::get('/signup', function () {
    return Inertia::render('Auth/Register');
})->name('signup');

Route::get('/dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::prefix('/bins')->group(function () {
        Route::get('/', [BinController::class, 'index'])->name('bins.index');
        Route::post('/', [BinController::class, 'store'])->name('bins.store');
        Route::patch('/{code}', [BinController::class, 'update'])->name('bins.update');
        Route::delete('/{code}', [BinController::class, 'destroy'])->name('bins.destroy');
    });

    Route::get('/monitoring', [MonitoringController::class, 'index'])->name('monitoring');

    Route::prefix('/users')->group(function () {
        Route::get('/', [UserController::class, 'index'])->name('users.index');
        Route::post('/', [UserController::class, 'store'])->name('users.store');
        Route::patch('/{user}', [UserController::class, 'update'])->name('users.update');
        Route::delete('/{user}', [UserController::class, 'destroy'])->name('users.destroy');
    });

    Route::prefix('/alerts')->group(function () {
        Route::get('/', [AlertController::class, 'index'])->name('alerts.index');
        Route::patch('/{alert}', [AlertController::class, 'update'])->name('alerts.update');
        Route::delete('/{alert}', [AlertController::class, 'destroy'])->name('alerts.destroy');
    });

    Route::get('/settings', function () {
        return Inertia::render('Settings/Index');
    })->name('settings');

    Route::prefix('/predictions')->group(function () {
        Route::get('/', [\App\Http\Controllers\PredictionController::class, 'index'])->name('predictions.index');
        Route::post('/generate', [\App\Http\Controllers\PredictionController::class, 'generate'])->name('predictions.generate');
        Route::delete('/{prediction}', [\App\Http\Controllers\PredictionController::class, 'destroy'])->name('predictions.destroy');
    });

    Route::prefix('/sensors')->group(function () {
        Route::get('/', [SensorController::class, 'index'])->name('sensors.index');
        Route::post('/', [SensorController::class, 'store'])->name('sensors.store');
        Route::patch('/{id}', [SensorController::class, 'update'])->name('sensors.update');
        Route::delete('/{id}', [SensorController::class, 'destroy'])->name('sensors.destroy');
    });
});

require __DIR__.'/auth.php';
