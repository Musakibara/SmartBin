<?php

use App\Http\Controllers\BinController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProfileController;
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

    Route::get('/monitoring', function () {
        return Inertia::render('Monitoring/Index');
    })->name('monitoring');

    Route::get('/users', function () {
        return Inertia::render('Users/Index');
    })->name('users');

    Route::get('/alerts', function () {
        return Inertia::render('Alerts/Index');
    })->name('alerts');

    Route::get('/settings', function () {
        return Inertia::render('Settings/Index');
    })->name('settings');

    Route::get('/predictions', function () {
        return Inertia::render('Predictions/Index');
    })->name('predictions');

    Route::get('/sensors', function () {
        return Inertia::render('Sensors/Index');
    })->name('sensors');
});

require __DIR__.'/auth.php';
