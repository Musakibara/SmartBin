<?php

namespace App\Http\Controllers;

use App\Models\Bin;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BinController extends Controller
{
    /**
     * Liste paginée des bennes avec recherche, filtre statut et tri.
     *
     * Les champs DB (snake_case) sont convertis en camelCase pour le frontend.
     * Le statut est déduit du remplissage : NORMAL < 60%, WARNING 60-79%, FULL >= 80%.
     */
    public function index(Request $request): Response
    {
        $query = Bin::query();

        // ============================================================
        // Recherche textuelle (code, nom, emplacement)
        // ============================================================
        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                  ->orWhere('name', 'like', "%{$search}%")
                  ->orWhere('location', 'like', "%{$search}%");
            });
        }

        // ============================================================
        // Filtre par statut (frontend en lowercase, DB en UPPERCASE)
        // ============================================================
        if ($status = $request->query('status')) {
            $query->where('status', match ($status) {
                'normal'  => 'NORMAL',
                'warning' => 'WARNING',
                'full'    => 'FULL',
                default   => $status,
            });
        }

        // ============================================================
        // Tri : mapping camelCase (frontend) → snake_case (DB)
        // ============================================================
        $sortField = match ($request->query('sort', 'name')) {
            'fillLevel' => 'fill_level',
            'battery'   => 'battery_level',
            'name'      => 'name',
            default     => 'name',
        };
        $sortDir = $request->query('dir', 'asc') === 'desc' ? 'desc' : 'asc';
        $query->orderBy($sortField, $sortDir);

        // ============================================================
        // Récupération de toutes les bennes (le frontend gère le tri,
        // le filtre et la pagination côté client)
        // ============================================================
        $bins = $query->get()->transform(function (Bin $bin) {
            $fill = $bin->fill_level;
            return [
                'id'          => $bin->code,
                'name'        => $bin->name ?? $bin->code,
                'location'    => $bin->location,
                'fillLevel'   => (int) round($fill),
                'status'      => $fill >= 80 ? 'full' : ($fill >= 60 ? 'warning' : 'normal'),
                'lastUpdate'  => $bin->last_update?->diffForHumans() ?? 'N/A',
                'lat'         => (float) $bin->latitude,
                'lng'         => (float) $bin->longitude,
                'battery'     => (int) round($bin->battery_level),
                'temperature' => 24,
            ];
        })->values();

        // ============================================================
        // Transmission à la page Inertia Bins/Index
        // ============================================================
        return Inertia::render('Bins/Index', [
            'bins' => $bins,
        ]);
    }

    /**
     * Ajoute une nouvelle benne avec des coordonnées aléatoires
     * autour de Yaoundé (3.848, 11.502).
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name'     => 'required|string|max:150',
            'location' => 'required|string|max:255',
            'fill'     => 'nullable|numeric|between:0,100',
            'battery'  => 'nullable|numeric|between:0,100',
        ]);

        // Génération d'un code unique incrémental
        $code = 'BIN-' . str_pad((Bin::count() + 1), 3, '0', STR_PAD_LEFT);

        Bin::create([
            'code'          => $code,
            'name'          => $validated['name'],
            'location'      => $validated['location'],
            'latitude'      => 3.848 + (mt_rand(-200, 200) / 10000),
            'longitude'     => 11.502 + (mt_rand(-200, 200) / 10000),
            'fill_level'    => $validated['fill'] ?? 0,
            'battery_level' => $validated['battery'] ?? 100,
            'status'        => 'NORMAL',
            'last_update'   => now(),
        ]);

        return redirect()->back();
    }

    /**
     * Modifie une benne existante (nom, emplacement, remplissage, batterie).
     * Le statut est recalculé automatiquement.
     */
    public function update(Request $request, string $code): RedirectResponse
    {
        $bin = Bin::where('code', $code)->firstOrFail();

        $validated = $request->validate([
            'name'     => 'required|string|max:150',
            'location' => 'required|string|max:255',
            'fill'     => 'nullable|numeric|between:0,100',
            'battery'  => 'nullable|numeric|between:0,100',
        ]);

        // Recalcule le statut à partir du nouveau remplissage
        $fill = $validated['fill'] ?? $bin->fill_level;
        $status = $fill >= 80 ? 'FULL' : ($fill >= 60 ? 'WARNING' : 'NORMAL');

        $bin->update([
            'name'          => $validated['name'],
            'location'      => $validated['location'],
            'fill_level'    => $fill,
            'battery_level' => $validated['battery'] ?? $bin->battery_level,
            'status'        => $status,
            'last_update'   => now(),
        ]);

        return redirect()->back();
    }

    /**
     * Supprime définitivement une benne et ses données associées
     * (cascade : sensors, readings, alerts, predictions).
     */
    public function destroy(string $code): RedirectResponse
    {
        $bin = Bin::where('code', $code)->firstOrFail();
        $bin->delete();

        return redirect()->back();
    }
}
