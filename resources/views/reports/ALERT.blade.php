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
        .kpi-box .value.high { color: #ea580c; }
        .kpi-box .value.medium { color: #d97706; }
        .kpi-box .value.low { color: #2563eb; }
        .kpi-box .value.warning { color: #d97706; }
        .kpi-box .label { font-size: 8px; color: #64748b; text-transform: uppercase; letter-spacing: 0.3px; }
        table { width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 9px; }
        th { background: #f1f5f9; padding: 7px 6px; text-align: left; font-size: 8px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; color: #475569; border-bottom: 2px solid #cbd5e1; }
        td { padding: 5px 6px; border-bottom: 1px solid #f1f5f9; }
        tr:nth-child(even) td { background: #fafafa; }
        .severity-CRITICAL { color: #dc2626; font-weight: 700; font-size: 8px; }
        .severity-HIGH { color: #ea580c; font-weight: 700; font-size: 8px; }
        .severity-MEDIUM { color: #d97706; font-size: 8px; }
        .severity-LOW { color: #2563eb; font-size: 8px; }
        .badge { display: inline-block; padding: 1px 7px; border-radius: 8px; font-size: 7px; font-weight: 700; }
        .badge-RESOLVED { background: #d1fae5; color: #065f46; }
        .badge-PENDING { background: #fef3c7; color: #92400e; }
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
        <h2>Répartition des Alertes</h2>
        <div class="kpis">
            <div class="kpi-box">
                <div class="value" style="color: #6366f1;">{{ $totalAlerts }}</div>
                <div class="label">Total</div>
            </div>
            <div class="kpi-box">
                <div class="value critical">{{ $critical }}</div>
                <div class="label">Critiques</div>
            </div>
            <div class="kpi-box">
                <div class="value high">{{ $high }}</div>
                <div class="label">Élevées</div>
            </div>
            <div class="kpi-box">
                <div class="value medium">{{ $medium }}</div>
                <div class="label">Moyennes</div>
            </div>
            <div class="kpi-box">
                <div class="value low">{{ $low }}</div>
                <div class="label">Basses</div>
            </div>
            <div class="kpi-box">
                <div class="value" style="color: #059669;">{{ $resolved }}</div>
                <div class="label">Résolues</div>
            </div>
            <div class="kpi-box">
                <div class="value warning">{{ $pending }}</div>
                <div class="label">En attente</div>
            </div>
        </div>
    </div>

    <div class="section">
        <h2>Liste des Alertes</h2>
        <table>
            <tr>
                <th>Date</th>
                <th>Benne</th>
                <th>Message</th>
                <th>Sévérité</th>
                <th>Statut</th>
            </tr>
            @forelse ($alerts as $alert)
            <tr>
                <td style="white-space: nowrap;">{{ $alert->created_at->format('d/m/Y H:i') }}</td>
                <td style="font-weight: 600;">{{ $alert->bin?->code ?? '—' }}</td>
                <td>{{ $alert->message }}</td>
                <td class="severity-{{ $alert->severity }}">{{ $alert->severity }}</td>
                <td><span class="badge badge-{{ $alert->status }}">{{ $alert->status === 'RESOLVED' ? 'RÉSOLUE' : 'EN ATTENTE' }}</span></td>
            </tr>
            @empty
            <tr><td colspan="5" style="text-align:center;color:#94a3b8;padding:20px;">Aucune alerte enregistrée.</td></tr>
            @endforelse
        </table>
    </div>

    <div class="footer">
        SmartBin — Système Intelligent de Gestion des Déchets · Rapport des alertes
    </div>
</body>
</html>
