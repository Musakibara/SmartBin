<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: #F1F5F9;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 560px;
            margin: 40px auto;
            background: #FFFFFF;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 24px rgba(0,0,0,0.06);
        }
        .header {
            background: #10B981;
            padding: 28px 32px;
            text-align: center;
        }
        .header h1 {
            color: #FFFFFF;
            font-size: 22px;
            font-weight: 700;
            margin: 0;
        }
        .body {
            padding: 28px 32px 32px;
        }
        .greeting {
            color: #0F172A;
            font-size: 15px;
            margin: 0 0 4px;
        }
        .description {
            color: #64748B;
            font-size: 14px;
            margin: 0 0 20px;
        }
        .alert-card {
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
        }
        .alert-card.critical, .alert-card.high {
            background: #FEF2F2;
            border: 1px solid #FECACA;
        }
        .alert-card.medium {
            background: #FFF7ED;
            border: 1px solid #FED7AA;
        }
        .alert-card.low {
            background: #F0FDF4;
            border: 1px solid #BBF7D0;
        }
        .severity-badge {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 9999px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 10px;
        }
        .severity-badge.critical, .severity-badge.high {
            background: #FEE2E2;
            color: #991B1B;
        }
        .severity-badge.medium {
            background: #FFEDD5;
            color: #9A3412;
        }
        .severity-badge.low {
            background: #DCFCE7;
            color: #166534;
        }
        .alert-message {
            color: #0F172A;
            font-size: 16px;
            font-weight: 600;
            margin: 0 0 12px;
            line-height: 1.4;
        }
        .meta-grid {
            display: table;
            width: 100%;
            border-collapse: collapse;
        }
        .meta-row {
            display: table-row;
        }
        .meta-label {
            display: table-cell;
            color: #94A3B8;
            font-size: 13px;
            padding: 4px 12px 4px 0;
            white-space: nowrap;
        }
        .meta-value {
            display: table-cell;
            color: #0F172A;
            font-size: 13px;
            font-weight: 500;
            padding: 4px 0;
        }
        .cta-wrapper {
            text-align: center;
            margin: 24px 0 0;
        }
        .cta-button {
            display: inline-block;
            background: #10B981;
            color: #FFFFFF;
            text-decoration: none;
            font-size: 14px;
            font-weight: 600;
            padding: 12px 28px;
            border-radius: 8px;
        }
        .footer {
            text-align: center;
            padding: 24px 32px;
            background: #F8FAFC;
            border-top: 1px solid #E2E8F0;
        }
        .footer p {
            color: #94A3B8;
            font-size: 12px;
            margin: 4px 0;
        }
        @media only screen and (max-width: 600px) {
            .container { margin: 16px; border-radius: 12px; }
            .header { padding: 24px 20px; }
            .body { padding: 20px; }
            .footer { padding: 20px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="color:#FFFFFF;font-size:22px;font-weight:700;margin:0;">SmartBin</h1>
        </div>

        <div class="body">
            <p class="greeting">Bonjour,</p>
            <p class="description">Une alerte vient d'être détectée sur votre réseau :</p>

            @php
                $severity = strtolower($notification->alert?->severity ?? 'low');
                $cardClass = in_array($severity, ['critical', 'high']) ? 'critical' : ($severity === 'medium' ? 'medium' : 'low');
            @endphp

            <div class="alert-card {{ $cardClass }}">
                <div class="severity-badge {{ $cardClass }}">
                    {{ $notification->alert?->severity ?? 'INCONNUE' }}
                </div>
                <p class="alert-message">{{ $notification->message }}</p>

                <div class="meta-grid">
                    <div class="meta-row">
                        <span class="meta-label">Benne</span>
                        <span class="meta-value">{{ $notification->alert?->bin?->code ?? 'N/A' }}</span>
                    </div>
                    <div class="meta-row">
                        <span class="meta-label">Localisation</span>
                        <span class="meta-value">{{ $notification->alert?->bin?->location ?? 'Non spécifiée' }}</span>
                    </div>
                    <div class="meta-row">
                        <span class="meta-label">Date</span>
                        <span class="meta-value">{{ $notification->sent_at?->format('d/m/Y H:i') ?? now()->format('d/m/Y H:i') }}</span>
                    </div>
                </div>
            </div>

            <div class="cta-wrapper">
                <a href="{{ route('dashboard') }}" class="cta-button">
                    Voir sur le tableau de bord
                </a>
            </div>
        </div>

        <div class="footer">
            <p>Cet email a été envoyé automatiquement par le système SmartBin.</p>
            <p>&copy; {{ date('Y') }} SmartBin &mdash; Surveillance intelligente des déchets</p>
        </div>
    </div>
</body>
</html>
