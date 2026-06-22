<?php

namespace App\Http\Controllers;

use App\Models\Alert;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AlertController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Alert::with('bin', 'resolvedBy');

        // Filtre par sévérité
        if ($request->filled('severity') && $request->severity !== 'Toutes') {
            $query->where('severity', strtoupper($request->severity));
        }

        // Filtre par statut
        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', strtoupper($request->status === 'pending' ? 'PENDING' : 'RESOLVED'));
        }

        // Recherche textuelle
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('id', 'like', "%{$search}%")
                  ->orWhere('message', 'like', "%{$search}%")
                  ->orWhereHas('bin', fn ($b) => $b->where('code', 'like', "%{$search}%")
                      ->orWhere('name', 'like', "%{$search}%")
                      ->orWhere('location', 'like', "%{$search}%"));
            });
        }

        // Tri
        $sortDir = $request->dir === 'asc' ? 'asc' : 'desc';
        $sortField = match ($request->sort) {
            'severity' => 'severity',
            'time'     => 'created_at',
            default    => 'created_at',
        };

        // Tri personnalisé pour la sévérité
        if ($request->sort === 'severity') {
            $order = $sortDir === 'asc' ? 'asc' : 'desc';
            $alerts = $query->orderByRaw(
                "FIELD(severity, 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW') $order"
            )->orderBy('created_at', 'desc')
             ->paginate(8)
             ->through(fn (Alert $alert) => $this->mapAlert($alert));

            return Inertia::render('Alerts/Index', [
                'alerts'  => $alerts,
                'filters' => $request->only(['search', 'severity', 'status', 'sort', 'dir']),
            ]);
        }

        $alerts = $query->orderBy($sortField, $sortDir)
            ->paginate(8)
            ->through(fn (Alert $alert) => $this->mapAlert($alert));

        return Inertia::render('Alerts/Index', [
            'alerts'  => $alerts,
            'filters' => $request->only(['search', 'severity', 'status', 'sort', 'dir']),
        ]);
    }

    public function update(Request $request, Alert $alert): RedirectResponse
    {
        $alert->update([
            'status'      => 'RESOLVED',
            'resolved_by' => auth()->id(),
            'resolved_at' => now(),
        ]);

        return back();
    }

    public function destroy(Alert $alert): RedirectResponse
    {
        $alert->delete();

        return back();
    }

    private function mapAlert(Alert $alert): array
    {
        return [
            'id'          => $alert->id,
            'bin'         => $alert->bin?->code ?? 'N/A',
            'binName'     => $alert->bin?->name ?? '',
            'message'     => $alert->message ?? $alert->type,
            'severity'    => strtolower($alert->severity),
            'status'      => strtolower($alert->status),
            'time'        => $alert->created_at?->diffForHumans() ?? 'N/A',
            'resolvedBy'  => $alert->resolvedBy?->name ?? null,
            'resolvedAt'  => $alert->resolved_at?->diffForHumans() ?? null,
        ];
    }
}
