<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('online-users', function ($user) {
    return [
        'id' => $user->id,
        'name' => $user->name,
        'email' => $user->email,
        'role' => $user->role,
        'initials' => implode('', array_map(fn($n) => $n[0], explode(' ', $user->name))),
        'last_active_at' => $user->last_active_at?->toIso8601String(),
    ];
}, ['guards' => ['web']]);
