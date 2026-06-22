<?php

namespace App\Services;

class RoleService
{
    const ADMIN       = 'ADMIN';
    const SUPERVISEUR = 'SUPERVISEUR';
    const OPERATEUR   = 'OPERATEUR';
    const TECHNICIEN  = 'TECHNICIEN';
    const AGENT       = 'AGENT';

    const ROLES = [
        self::ADMIN       => 5,
        self::SUPERVISEUR => 4,
        self::OPERATEUR   => 3,
        self::TECHNICIEN  => 2,
        self::AGENT       => 1,
    ];

    const LABELS = [
        self::ADMIN       => 'Admin',
        self::SUPERVISEUR => 'Superviseur',
        self::OPERATEUR   => 'Opérateur',
        self::TECHNICIEN  => 'Technicien',
        self::AGENT       => 'Agent',
    ];

    /**
     * Matrice des permissions.
     *
     * Chaque permission correspond au rôle MINIMUM requis.
     * Les rôles supérieurs héritent automatiquement des permissions.
     *
     * Légende :
     *   AGENT       = Lecture seule du tableau de bord
     *   TECHNICIEN  = Maintenance terrain (capteurs, résolution alertes)
     *   OPERATEUR   = Gestion quotidienne (bennes, prédictions)
     *   SUPERVISEUR = Supervision (suppression, paramètres, vue utilisateurs)
     *   ADMIN       = Administration complète (CRUD utilisateurs, tout)
     *
     * ┌─────────────────────┬─────────┬────────────┬───────────┬─────────────┬───────┐
     * │ Permission           │ ADMIN   │ SUPERVISEUR │ OPERATEUR │ TECHNICIEN  │ AGENT │
     * ├─────────────────────┼─────────┼────────────┼───────────┼─────────────┼───────┤
     * │ dashboard.view      │ ✅      │ ✅         │ ✅        │ ✅          │ ✅    │
     * │ monitoring.view     │ ✅      │ ✅         │ ✅        │ ✅          │ ✅    │
     * │ profile.edit        │ ✅      │ ✅         │ ✅        │ ✅          │ ✅    │
     * │ bins.view           │ ✅      │ ✅         │ ✅        │ ✅          │ ✅    │
     * │ sensors.view        │ ✅      │ ✅         │ ✅        │ ✅          │ ✅    │
     * │ alerts.view         │ ✅      │ ✅         │ ✅        │ ✅          │ ✅    │
     * │ predictions.view    │ ✅      │ ✅         │ ✅        │ ✅          │ ✅    │
     * ├─────────────────────┼─────────┼────────────┼───────────┼─────────────┼───────┤
     * │ alerts.resolve      │ ✅      │ ✅         │ ✅        │ ✅          │ ✅    │
     * │ sensors.create      │ ✅      │ ✅         │ ✅        │ ✅          │ ✗     │
     * │ sensors.edit        │ ✅      │ ✅         │ ✅        │ ✅          │ ✗     │
     * ├─────────────────────┼─────────┼────────────┼───────────┼─────────────┼───────┤
     * │ bins.create         │ ✅      │ ✅         │ ✅        │ ✗           │ ✗     │
     * │ bins.edit           │ ✅      │ ✅         │ ✅        │ ✗           │ ✗     │
     * │ predictions.generate│ ✅      │ ✅         │ ✅        │ ✗           │ ✗     │
     * ├─────────────────────┼─────────┼────────────┼───────────┼─────────────┼───────┤
     * │ bins.delete         │ ✅      │ ✅         │ ✗        │ ✗           │ ✗     │
     * │ sensors.delete      │ ✅      │ ✅         │ ✗        │ ✗           │ ✗     │
     * │ alerts.delete       │ ✅      │ ✅         │ ✗        │ ✗           │ ✗     │
     * │ predictions.delete  │ ✅      │ ✅         │ ✗        │ ✗           │ ✗     │
     * │ users.view          │ ✅      │ ✅         │ ✗        │ ✗           │ ✗     │
     * │ settings.view       │ ✅      │ ✅         │ ✗        │ ✗           │ ✗     │
     * ├─────────────────────┼─────────┼────────────┼───────────┼─────────────┼───────┤
     * │ users.create        │ ✅      │ ✗         │ ✗        │ ✗           │ ✗     │
     * │ users.edit          │ ✅      │ ✗         │ ✗        │ ✗           │ ✗     │
     * │ users.delete        │ ✅      │ ✗         │ ✗        │ ✗           │ ✗     │
     * │ settings.edit       │ ✅      │ ✗         │ ✗        │ ✗           │ ✗     │
     * └─────────────────────┴─────────┴────────────┴───────────┴─────────────┴───────┘
     */
    const PERMISSIONS = [
        // Lecture seule — tout le monde
        'dashboard.view'      => self::AGENT,
        'monitoring.view'     => self::AGENT,
        'profile.edit'        => self::AGENT,
        'bins.view'           => self::AGENT,
        'sensors.view'        => self::AGENT,
        'alerts.view'         => self::AGENT,
        'predictions.view'    => self::AGENT,

        // Maintenance terrain — TECHNICIEN et +
        'sensors.create'      => self::TECHNICIEN,
        'sensors.edit'        => self::TECHNICIEN,
        'alerts.resolve'      => self::AGENT,

        // Opérations quotidiennes — OPERATEUR et +
        'bins.create'         => self::OPERATEUR,
        'bins.edit'           => self::OPERATEUR,
        'predictions.generate' => self::OPERATEUR,

        // Supervision — SUPERVISEUR et +
        'bins.delete'         => self::SUPERVISEUR,
        'sensors.delete'      => self::SUPERVISEUR,
        'alerts.delete'       => self::SUPERVISEUR,
        'predictions.delete'  => self::SUPERVISEUR,
        'users.view'          => self::SUPERVISEUR,
        'settings.view'       => self::SUPERVISEUR,

        // Administration — ADMIN uniquement
        'users.create'        => self::ADMIN,
        'users.edit'          => self::ADMIN,
        'users.delete'        => self::ADMIN,
        'settings.edit'       => self::ADMIN,
    ];

    /**
     * Vérifie si un rôle a accès à une permission.
     * Les rôles supérieurs héritent des permissions des rôles inférieurs.
     */
    public static function can(string $role, string $permission): bool
    {
        $required = self::PERMISSIONS[$permission] ?? null;

        if ($required === null) {
            return false;
        }

        $userLevel = self::ROLES[$role] ?? 0;
        $requiredLevel = self::ROLES[$required] ?? 0;

        return $userLevel >= $requiredLevel;
    }

    /**
     * Retourne la liste des permissions accessibles à un rôle donné.
     */
    public static function permissionsFor(string $role): array
    {
        return array_keys(array_filter(self::PERMISSIONS, fn($required) => self::can($role, $required)));
    }

    /**
     * Retourne le niveau hiérarchique d'un rôle.
     */
    public static function level(string $role): int
    {
        return self::ROLES[$role] ?? 0;
    }

    /**
     * Vérifie si un rôle est strictement supérieur à un autre.
     */
    public static function isSuperior(string $role, string $other): bool
    {
        return self::level($role) > self::level($other);
    }

    /**
     * Vérifie si le rôle est au moins égal au niveau donné.
     */
    public static function isAtLeast(string $role, string $minimum): bool
    {
        return self::level($role) >= self::level($minimum);
    }

    /**
     * Liste de tous les rôles triés du plus haut au plus bas.
     */
    public static function allRoles(): array
    {
        return array_keys(self::ROLES);
    }

    /**
     * Retourne les rôles strictement supérieurs à celui donné.
     */
    public static function superiors(string $role): array
    {
        $level = self::level($role);
        return array_keys(array_filter(self::ROLES, fn($l) => $l > $level));
    }

    /**
     * Retourne les rôles strictement inférieurs à celui donné.
     */
    public static function inferiors(string $role): array
    {
        $level = self::level($role);
        return array_keys(array_filter(self::ROLES, fn($l) => $l < $level));
    }
}
