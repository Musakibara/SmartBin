<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $title }}</title>
    <style>
        @page { margin: 20mm 15mm 20mm 15mm; }
        body { font-family: 'DejaVu Sans', Arial, sans-serif; font-size: 10px; color: #1e293b; line-height: 1.5; }
        .header { text-align: center; margin-bottom: 20px; padding-bottom: 14px; border-bottom: 3px solid #10B981; }
        .header h1 { color: #10B981; font-size: 18px; margin: 0 0 2px; font-weight: 700; }
        .header .sub { color: #64748b; font-size: 9px; margin: 0; }
        .header .meta { font-size: 8px; color: #94a3b8; margin-top: 4px; }
        .section { margin-bottom: 18px; }
        .section h2 { font-size: 12px; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; margin: 0 0 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
        .kpis { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 14px; }
        .kpi-box { padding: 8px 14px; border: 1px solid #e2e8f0; border-radius: 4px; min-width: 100px; flex: 1; }
        .kpi-box .value { font-size: 20px; font-weight: 700; color: #10B981; line-height: 1.2; }
        .kpi-box .value.critical { color: #dc2626; }
        .kpi-box .value.warning { color: #d97706; }
        .kpi-box .label { font-size: 8px; color: #64748b; text-transform: uppercase; letter-spacing: 0.3px; }
        table { width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 9px; }
        th { background: #f1f5f9; padding: 7px 6px; text-align: left; font-size: 8px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; color: #475569; border-bottom: 2px solid #cbd5e1; }
        td { padding: 5px 6px; border-bottom: 1px solid #f1f5f9; }
        tr:nth-child(even) td { background: #fafafa; }
        .footer { position: fixed; bottom: 0; left: 0; right: 0; text-align: center; color: #94a3b8; font-size: 7px; padding-top: 6px; border-top: 1px solid #e2e8f0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{ $title }}</h1>
        @isset($report->name)
        <p class="sub">{{ $report->name }}</p>
        @endisset
        <p class="meta">Généré le {{ $generatedAt }} · SmartBin City Infrastructure</p>
    </div>

    <div class="section">
        <h2>Vue d'Ensemble</h2>
        <div class="kpis">
            <div class="kpi-box">
                <div class="value">{{ $totalBins }}</div>
                <div class="label">Total Bennes</div>
            </div>
            <div class="kpi-box">
                <div class="value" style="color: #059669;">{{ $normalCount }}</div>
                <div class="label">Normales</div>
            </div>
            <div class="kpi-box">
                <div class="value warning">{{ $warningCount }}</div>
                <div class="label">Attention</div>
            </div>
            <div class="kpi-box">
                <div class="value critical">{{ $fullCount }}</div>
                <div class="label">Pleines</div>
            </div>
            <div class="kpi-box">
                <div class="value">{{ $avgFill }}%</div>
                <div class="label">Remplissage Moyen</div>
            </div>
            <div class="kpi-box">
                <div class="value">{{ $avgBattery }}%</div>
                <div class="label">Batterie Moyenne</div>
            </div>
        </div>
    </div>

    <div class="section">
        <h2>Activité (30 derniers jours)</h2>
        <div class="kpis">
            <div class="kpi-box">
                <div class="value" style="color: #2563eb;">{{ $alertCount }}</div>
                <div class="label">Alertes</div>
            </div>
            <div class="kpi-box">
                <div class="value critical">{{ $criticalAlerts }}</div>
                <div class="label">Critiques</div>
            </div>
            <div class="kpi-box">
                <div class="value warning">{{ $highAlerts }}</div>
                <div class="label">Élevées</div>
            </div>
            <div class="kpi-box">
                <div class="value" style="color: #2563eb;">{{ $predictionCount }}</div>
                <div class="label">Prédictions</div>
            </div>
            <div class="kpi-box">
                <div class="value critical">{{ $highPredictions }}</div>
                <div class="label">Risque Élevé</div>
            </div>
        </div>
    </div>

    <div class="section">
        <h2>Liste des Bennes</h2>
        <table>
            <tr>
                <th>Code</th>
                <th>Nom</th>
                <th>Remplissage</th>
                <th>Batterie</th>
                <th>Statut</th>
            </tr>
            @forelse ($bins as $bin)
            <tr>
                <td style="font-weight: 600;">{{ $bin->code }}</td>
                <td>{{ $bin->name }}</td>
                <td>{{ $bin->fill_level }}%</td>
                <td>{{ $bin->battery_level }}%</td>
                <td>{{ $bin->status }}</td>
            </tr>
            @empty
            <tr><td colspan="5" style="text-align:center;color:#94a3b8;padding:20px;">Aucune benne enregistrée.</td></tr>
            @endforelse
        </table>
    </div>

    <div class="footer">
        SmartBin — Système Intelligent de Gestion des Déchets · Rapport généré automatiquement
    </div>
</body>
</html>
