<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    private const ROLE_LABELS = [
        'ADMIN'       => 'Admin',
        'SUPERVISEUR' => 'Superviseur',
        'OPERATEUR'   => 'Opérateur',
        'TECHNICIEN'  => 'Technicien',
        'AGENT'       => 'Agent',
    ];

    private const ROLE_COLORS = [
        'ADMIN'       => 'from-emerald-500 to-emerald-600',
        'SUPERVISEUR' => 'from-blue-500 to-blue-600',
        'OPERATEUR'   => 'from-purple-500 to-purple-600',
        'TECHNICIEN'  => 'from-amber-500 to-amber-600',
        'AGENT'       => 'from-gray-500 to-gray-600',
    ];

    public function index(Request $request): Response
    {
        $query = User::query();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->filled('role') && $request->role !== 'Tous') {
            $dbRole = strtoupper($request->role);
            $query->where('role', $dbRole);
        }

        $users = $query->orderBy('created_at', 'desc')
            ->paginate(9)
            ->through(fn (User $user) => $this->mapUser($user));

        return Inertia::render('Users/Index', [
            'users'   => $users,
            'filters' => $request->only(['search', 'role']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|string|lowercase|email|max:255|unique:' . User::class,
            'phone'    => 'nullable|string|max:30',
            'role'     => 'required|string|in:ADMIN,SUPERVISEUR,OPERATEUR,TECHNICIEN,AGENT',
            'password' => ['required', Rules\Password::defaults()],
        ]);

        User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'phone'    => $request->phone,
            'role'     => $request->role,
            'status'   => 'ACTIVE',
            'password' => Hash::make($request->password),
        ]);

        return back();
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $request->validate([
            'name'  => 'sometimes|string|max:255',
            'email' => 'sometimes|string|lowercase|email|max:255|unique:' . User::class . ',email,' . $user->id,
            'phone' => 'nullable|string|max:30',
            'role'  => 'sometimes|string|in:ADMIN,SUPERVISEUR,OPERATEUR,TECHNICIEN,AGENT',
            'status' => 'sometimes|string|in:ACTIVE,SUSPENDED',
            'password' => ['nullable', Rules\Password::defaults()],
        ]);

        $data = $request->only(['name', 'email', 'phone', 'role', 'status']);
        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }

        $user->update($data);

        return back();
    }

    public function destroy(User $user): RedirectResponse
    {
        $user->delete();
        return back();
    }

    private function mapUser(User $user): array
    {
        $status = $user->status === 'SUSPENDED'
            ? 'suspendu'
            : $this->deriveActivityStatus($user->last_active_at);

        return [
            'id'         => $user->id,
            'name'       => $user->name,
            'email'      => $user->email,
            'role'       => self::ROLE_LABELS[$user->role] ?? $user->role,
            'status'     => $status,
            'lastActive' => $user->last_active_at?->diffForHumans() ?? 'Jamais',
            'initials'   => $this->initials($user->name),
            'color'      => self::ROLE_COLORS[$user->role] ?? 'from-gray-500 to-gray-600',
        ];
    }

    private function deriveActivityStatus($lastActiveAt): string
    {
        if (!$lastActiveAt) return 'offline';

        $minutes = $lastActiveAt->diffInMinutes(now());

        if ($minutes <= 15)  return 'online';
        if ($minutes <= 1440) return 'offline';

        return 'offline';
    }

    private function initials(string $name): string
    {
        $parts = explode(' ', trim($name));
        if (count($parts) >= 2) {
            return strtoupper(substr($parts[0], 0, 1) . substr($parts[count($parts) - 1], 0, 1));
        }
        return strtoupper(substr($name, 0, 2));
    }
}
