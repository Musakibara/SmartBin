<?php

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

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard/Index');
});

Route::get('/bins', function () {
    return Inertia::render('Bins/Index');
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
