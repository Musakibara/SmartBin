<?php

use App\Http\Controllers\AlertController;
use App\Http\Controllers\BinController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\MonitoringController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ReportController;
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
    // Profil — accessible à tous (modification de son propre compte)
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Bennes
    Route::prefix('/bins')->group(function () {
        Route::get('/', [BinController::class, 'index'])->name('bins.index');                    // AGENT
        Route::post('/', [BinController::class, 'store'])->name('bins.store');                   // OPERATEUR
        Route::patch('/{code}', [BinController::class, 'update'])->name('bins.update');           // OPERATEUR
        Route::delete('/{code}', [BinController::class, 'destroy'])                               // SUPERVISEUR
            ->middleware('role:SUPERVISEUR')->name('bins.destroy');
    });

    // Monitoring
    Route::get('/monitoring', [MonitoringController::class, 'index'])->name('monitoring');       // AGENT

    // Utilisateurs
    Route::prefix('/users')->group(function () {
        Route::get('/', [UserController::class, 'index'])                                        // SUPERVISEUR
            ->middleware('role:SUPERVISEUR')->name('users.index');
        Route::post('/', [UserController::class, 'store'])                                       // ADMIN
            ->middleware('role:ADMIN')->name('users.store');
        Route::patch('/{user}', [UserController::class, 'update'])                               // ADMIN
            ->middleware('role:ADMIN')->name('users.update');
        Route::delete('/{user}', [UserController::class, 'destroy'])                             // ADMIN
            ->middleware('role:ADMIN')->name('users.destroy');
    });

    // Alertes
    Route::prefix('/alerts')->group(function () {
        Route::get('/', [AlertController::class, 'index'])->name('alerts.index');                // AGENT
        Route::patch('/{alert}', [AlertController::class, 'update'])                             // TECHNICIEN
            ->middleware('role:TECHNICIEN')->name('alerts.update');
        Route::delete('/{alert}', [AlertController::class, 'destroy'])                           // SUPERVISEUR
            ->middleware('role:SUPERVISEUR')->name('alerts.destroy');
    });

    // Paramètres
    Route::get('/settings', function () {                                                        // SUPERVISEUR
        return Inertia::render('Settings/Index');
    })->middleware('role:SUPERVISEUR')->name('settings');

    // Prédictions IA
    Route::prefix('/predictions')->group(function () {
        Route::get('/', [\App\Http\Controllers\PredictionController::class, 'index'])            // AGENT
            ->name('predictions.index');
        Route::post('/generate', [\App\Http\Controllers\PredictionController::class, 'generate']) // OPERATEUR
            ->middleware('role:OPERATEUR')->name('predictions.generate');
        Route::delete('/{prediction}', [\App\Http\Controllers\PredictionController::class, 'destroy']) // SUPERVISEUR
            ->middleware('role:SUPERVISEUR')->name('predictions.destroy');
    });

    // Notifications
    Route::prefix('/notifications')->group(function () {
        Route::get('/', [NotificationController::class, 'index'])->name('notifications.index');
        Route::get('/recent', [NotificationController::class, 'recent'])->name('notifications.recent');
        Route::patch('/{notification}/read', [NotificationController::class, 'markAsRead'])->name('notifications.read');
        Route::post('/read-all', [NotificationController::class, 'markAllAsRead'])->name('notifications.read-all');
    });

    // Capteurs
    Route::prefix('/sensors')->group(function () {
        Route::get('/', [SensorController::class, 'index'])->name('sensors.index');              // AGENT
        Route::post('/', [SensorController::class, 'store'])                                     // TECHNICIEN
            ->middleware('role:TECHNICIEN')->name('sensors.store');
        Route::patch('/{id}', [SensorController::class, 'update'])                               // TECHNICIEN
            ->middleware('role:TECHNICIEN')->name('sensors.update');
        Route::delete('/{id}', [SensorController::class, 'destroy'])                             // SUPERVISEUR
            ->middleware('role:SUPERVISEUR')->name('sensors.destroy');
    });

    // Rapports
    Route::prefix('/reports')->group(function () {
        Route::get('/', [ReportController::class, 'index'])->name('reports.index');              // OPERATEUR
        Route::post('/', [ReportController::class, 'store'])                                     // OPERATEUR
            ->middleware('role:OPERATEUR')->name('reports.store');
        Route::get('/{report}/download', [ReportController::class, 'download'])->name('reports.download');
        Route::delete('/{report}', [ReportController::class, 'destroy'])                         // SUPERVISEUR
            ->middleware('role:SUPERVISEUR')->name('reports.destroy');
    });
});

require __DIR__.'/auth.php';
