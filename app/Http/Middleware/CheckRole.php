<?php

namespace App\Http\Middleware;

use App\Services\RoleService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Vérifie que l'utilisateur a le rôle MINIMUM requis.
     *
     * Usage dans les routes :
     *   ->middleware('role:OPERATEUR')
     *   ->middleware('role:ADMIN')
     *   ->middleware('role:SUPERVISEUR|settings.view')
     *
     * Formats :
     *   - 'role:OPERATEUR'              → niveau hiérarchique (héritage inclus)
     *   - 'role:ADMIN|users.create'     → permission spécifique
     *   - 'role:ADMIN|users.create,bins.delete' → plusieurs permissions (une seule suffit)
     */
    public function handle(Request $request, Closure $next, string $rules): Response
    {
        $user = $request->user();

        if (!$user) {
            abort(401, 'Non authentifié.');
        }

        $parts = explode('|', $rules);
        $role = $user->role;

        // Si c'est une permission spécifique (ex: users.create)
        if (count($parts) >= 2) {
            $permissions = explode(',', $parts[1]);
            foreach ($permissions as $permission) {
                if (RoleService::can($role, trim($permission))) {
                    return $next($request);
                }
            }
            abort(403, 'Permission insuffisante.');
        }

        // Sinon, c'est un niveau de rôle (ex: OPERATEUR)
        $requiredRole = trim($parts[0]);

        if (!RoleService::isAtLeast($role, $requiredRole)) {
            $label = RoleService::LABELS[$requiredRole] ?? $requiredRole;
            abort(403, "Accès réservé aux {$label}s et supérieurs.");
        }

        return $next($request);
    }
}
