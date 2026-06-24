<?php

namespace App\Http\Controllers;

use App\Models\Report;
use App\Services\ReportService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class ReportController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Report::with('generatedBy');

        if ($request->filled('type') && $request->type !== 'Tous') {
            $query->where('type', $request->type);
        }

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('name', 'like', "%{$s}%")
                  ->orWhere('type', 'like', "%{$s}%")
                  ->orWhere('summary', 'like', "%{$s}%");
            });
        }

        $reports = $query->latest('created_at')->paginate(12);

        return Inertia::render('Reports/Index', [
            'reports' => $reports->through(fn (Report $r) => [
                'id' => $r->id,
                'name' => $r->name ?? $r->type,
                'type' => $r->type,
                'summary' => $r->summary ?? '',
                'period_start' => $r->period_start?->format('d/m/Y'),
                'period_end' => $r->period_end?->format('d/m/Y'),
                'file_path' => $r->file_path,
                'viewUrl' => $r->file_path && Storage::disk('public')->exists($r->file_path)
                    ? Storage::url($r->file_path) : null,
                'generatedBy' => $r->generatedBy?->name ?? 'Système',
                'createdAt' => $r->created_at?->format('d/m/Y H:i') ?? '—',
                'fileSize' => $r->file_path && Storage::disk('public')->exists($r->file_path)
                    ? $this->formatBytes(Storage::disk('public')->size($r->file_path))
                    : null,
            ]),
            'filters' => $request->only(['search', 'type']),
        ]);
    }

    public function store(Request $request, ReportService $service): RedirectResponse
    {
        $validated = $request->validate([
            'type' => 'required|in:OPERATIONAL,PERFORMANCE,STRATEGIC,ALERT',
            'period_start' => 'nullable|date',
            'period_end' => 'nullable|date|after_or_equal:period_start',
        ]);

        try {
            $path = $service->generateForType(
                $validated['type'],
                $validated['period_start'] ?? now()->subMonth(),
                $validated['period_end'] ?? now(),
                Auth::id()
            );
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Erreur lors de la génération : ' . $e->getMessage()]);
        }

        return back();
    }

    public function download(Report $report)
    {
        if (!$report->file_path || !Storage::disk('public')->exists($report->file_path)) {
            return back()->withErrors(['error' => 'Fichier introuvable.']);
        }

        $filename = $report->name
            ? preg_replace('/[^a-zA-Z0-9_\- ]/', '', $report->name) . '.pdf'
            : "smartbin_{$report->type}_{$report->created_at->format('Ymd')}.pdf";

        return Storage::disk('public')->download($report->file_path, $filename);
    }

    public function destroy(Report $report): RedirectResponse
    {
        if ($report->file_path && Storage::disk('public')->exists($report->file_path)) {
            Storage::disk('public')->delete($report->file_path);
        }

        $report->delete();

        return back();
    }

    private function formatBytes(int $bytes, int $precision = 2): string
    {
        $units = ['o', 'Ko', 'Mo', 'Go'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        return round($bytes / (1024 ** $pow), $precision) . ' ' . $units[$pow];
    }
}
