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
