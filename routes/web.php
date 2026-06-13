<?php

use App\Http\Controllers\BinController;
use App\Http\Controllers\DashboardController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome');
});

Route::get('/login', function () {
    return Inertia::render('Auth/Login');
});

Route::get('/signup', function () {
    return Inertia::render('Auth/SignUp');
});

Route::get('/dashboard', [DashboardController::class, 'index']);

Route::prefix('/bins')->group(function () {
    Route::get('/', [BinController::class, 'index'])->name('bins.index');
    Route::post('/', [BinController::class, 'store'])->name('bins.store');
    Route::patch('/{code}', [BinController::class, 'update'])->name('bins.update');
    Route::delete('/{code}', [BinController::class, 'destroy'])->name('bins.destroy');
});

Route::get('/profile', function () {
    return Inertia::render('Profile/Index');
});

Route::get('/monitoring', function () {
    return Inertia::render('Monitoring/Index');
});

Route::get('/users', function () {
    return Inertia::render('Users/Index');
});

Route::get('/alerts', function () {
    return Inertia::render('Alerts/Index');
});

Route::get('/settings', function () {
    return Inertia::render('Settings/Index');
});

Route::get('/predictions', function () {
    return Inertia::render('Predictions/Index');
});

Route::get('/sensors', function () {
    return Inertia::render('Sensors/Index');
});
