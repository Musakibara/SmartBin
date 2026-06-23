<?php

namespace App\Services;

use App\Models\Alert;
use App\Models\Bin;
use App\Models\Prediction;
use App\Models\Report;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;

class ReportService
{
    public function generateForType(string $type, mixed $periodStart, mixed $periodEnd, ?string $userId): string
    {
        $label = $this->typeLabel($type);
        $count = Report::where('type', $type)->whereDate('created_at', today())->count() + 1;
        $name = "{$label} — " . now()->format('d/m/Y') . " #{$count}";

        $report = new Report([
            'name' => $name,
            'type' => $type,
            'period_start' => $periodStart,
            'period_end' => $periodEnd,
            'generated_by' => $userId,
            'summary' => $this->summaryForType($type),
        ]);
        $report->created_at = now();
        $report->save();

        $path = $this->generate($report);

        $report->update(['file_path' => $path]);

        return $path;
    }

    public function generate(Report $report): string
    {
        $data = match ($report->type) {
            'OPERATIONAL' => $this->operationalData(),
            'PERFORMANCE' => $this->performanceData(),
            'STRATEGIC'   => $this->strategicData(),
            'ALERT'       => $this->alertData(),
            default       => [],
        };

        $data['report'] = $report;
        $data['generatedAt'] = now()->format('d/m/Y H:i');

        $pdf = Pdf::loadView("reports.{$report->type}", $data);
        $pdf->setPaper('A4', 'portrait');

        $suffix = substr($report->id, 0, 8);
        $slug = strtolower(str_replace([' ', '—'], ['_', '-'], $report->name ?? $report->type));
        $slug = preg_replace('/[^a-z0-9_-]/', '', $slug);
        $path = "reports/{$slug}_{$suffix}.pdf";
        Storage::disk('public')->put($path, $pdf->output());

        return $path;
    }

    private function operationalData(): array
    {
        $bins = Bin::with('sensors')->get();

        return [
            'title' => 'Rapport Opérationnel — SmartBin',
            'bins' => $bins,
            'totalBins' => $bins->count(),
            'fullCount' => $bins->where('status', 'FULL')->count(),
            'warningCount' => $bins->where('status', 'WARNING')->count(),
            'normalCount' => $bins->where('status', 'NORMAL')->count(),
            'avgFill' => round($bins->avg('fill_level'), 1),
            'avgBattery' => round($bins->avg('battery_level'), 1),
        ];
    }

    private function performanceData(): array
    {
        $bins = Bin::all();

        return [
            'title' => 'Rapport de Performance — SmartBin',
            'bins' => $bins,
            'totalBins' => $bins->count(),
            'avgFill' => round($bins->avg('fill_level'), 1),
            'avgBattery' => round($bins->avg('battery_level'), 1),
            'avgTemp' => round($bins->avg('temperature'), 1),
            'fillTrend' => $this->fillTrend(),
        ];
    }

    private function strategicData(): array
    {
        $bins = Bin::all();
        $alerts = Alert::where('created_at', '>=', now()->subDays(30))->get();
        $predictions = Prediction::where('created_at', '>=', now()->subDays(30))->get();

        return [
            'title' => 'Rapport Stratégique — SmartBin',
            'bins' => $bins,
            'totalBins' => $bins->count(),
            'fullCount' => $bins->where('status', 'FULL')->count(),
            'warningCount' => $bins->where('status', 'WARNING')->count(),
            'normalCount' => $bins->where('status', 'NORMAL')->count(),
            'avgFill' => round($bins->avg('fill_level'), 1),
            'avgBattery' => round($bins->avg('battery_level'), 1),
            'alertCount' => $alerts->count(),
            'criticalAlerts' => $alerts->where('severity', 'CRITICAL')->count(),
            'highAlerts' => $alerts->where('severity', 'HIGH')->count(),
            'predictionCount' => $predictions->count(),
            'highPredictions' => $predictions->where('risk_level', 'HIGH')->count(),
        ];
    }

    private function alertData(): array
    {
        $alerts = Alert::with('bin')->latest('created_at')->limit(100)->get();

        return [
            'title' => 'Rapport des Alertes — SmartBin',
            'alerts' => $alerts,
            'totalAlerts' => $alerts->count(),
            'critical' => $alerts->where('severity', 'CRITICAL')->count(),
            'high' => $alerts->where('severity', 'HIGH')->count(),
            'medium' => $alerts->where('severity', 'MEDIUM')->count(),
            'low' => $alerts->where('severity', 'LOW')->count(),
            'resolved' => $alerts->where('status', 'RESOLVED')->count(),
            'pending' => $alerts->where('status', 'PENDING')->count(),
        ];
    }

    private function typeLabel(string $type): string
    {
        return match ($type) {
            'OPERATIONAL' => 'Rapport Opérationnel',
            'PERFORMANCE' => 'Rapport de Performance',
            'STRATEGIC' => 'Rapport Stratégique',
            'ALERT' => 'Rapport des Alertes',
            default => 'Rapport',
        };
    }

    private function summaryForType(string $type): string
    {
        return match ($type) {
            'OPERATIONAL' => 'Rapport opérationnel — état des bennes, niveaux de remplissage et statut des capteurs.',
            'PERFORMANCE' => 'Rapport de performance — analyse des tendances de remplissage et indicateurs techniques.',
            'STRATEGIC' => 'Rapport stratégique — synthèse mensuelle des alertes, prédictions et performance globale.',
            'ALERT' => 'Rapport des alertes — récapitulatif des alertes par sévérité et statut de résolution.',
            default => 'Rapport SmartBin.',
        };
    }

    private function fillTrend(): array
    {
        return Bin::selectRaw('DATE(created_at) as date, AVG(fill_level) as avg_fill')
            ->groupBy('date')
            ->orderBy('date')
            ->limit(30)
            ->get()
            ->toArray();
    }
}
