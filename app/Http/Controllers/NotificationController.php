<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $notifications = Notification::with('alert.bin')
            ->latest('sent_at')
            ->paginate(15);

        if ($request->wantsJson()) {
            return response()->json($notifications);
        }

        return inertia('Notifications/Index', [
            'notifications' => $notifications,
        ]);
    }

    public function markAsRead(Notification $notification): RedirectResponse
    {
        $notification->update(['read_at' => now()]);

        return back();
    }

    public function markAllAsRead(): RedirectResponse
    {
        Notification::whereNull('read_at')->update(['read_at' => now()]);

        return back();
    }

    public function recent(): \Illuminate\Http\JsonResponse
    {
        $notifications = Notification::with('alert.bin')
            ->latest('sent_at')
            ->take(5)
            ->get()
            ->map(fn ($n) => [
                'id'        => $n->id,
                'message'   => $n->message,
                'channel'   => $n->channel,
                'status'    => $n->status,
                'read'      => $n->read_at !== null,
                'severity'  => $n->alert?->severity,
                'bin_code'  => $n->alert?->bin?->code,
                'sent_at'   => $n->sent_at?->diffForHumans(),
            ]);

        $unreadCount = Notification::whereNull('read_at')->count();

        return response()->json([
            'notifications' => $notifications,
            'unread_count'  => $unreadCount,
        ]);
    }
}
