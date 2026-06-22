<?php

namespace App\Http\Middleware;

use App\Models\Notification;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        if ($user = $request->user()) {
            if (!$user->last_active_at || $user->last_active_at->diffInMinutes(now()) >= 1) {
                $user->timestamps = false;
                $user->update(['last_active_at' => now()]);
            }
        }

        $notificationData = null;

        if ($request->user()) {
            $notificationData = [
                'unread_count' => Notification::whereNull('read_at')->count(),
            ];
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
            ],
            'notifications' => $notificationData,
        ];
    }
}
