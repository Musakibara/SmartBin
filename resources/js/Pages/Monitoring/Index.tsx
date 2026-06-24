import { useState, useMemo, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { AlertTriangle, Activity, Brain, Clock, Wifi, Thermometer, BatteryCharging, MapPin, ChevronRight, X, RefreshCw } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import AppLayout from '../../Layouts/AppLayout'
import StatusBadge from '../../Components/StatusBadge'
import { useToast } from '../../Components/Toast'
import { usePage } from '@inertiajs/react'
import { useTranslation, Trans } from 'react-i18next'

interface Bin {
    id: string; name: string; location: string; fillLevel: number
    status: 'normal' | 'warning' | 'full'; lastUpdate: string
    lat: number; lng: number; battery: number; temperature: number
}

interface AlertItem {
    id: string; bin: string; message: string; severity: string
    status: string; time: string
}

interface PredictionItem {
    id: string; bin: string; message: string; priority: string
    estimatedHours: number
}

interface ActivityItem {
    action: string; detail: string; time: string
}

function MapResize({ showPanel }: { showPanel: boolean }) {
  const map = useMap()
  useEffect(() => { setTimeout(() => map.invalidateSize(), 50) }, [showPanel])
  return null
}

const markerNormal = L.divIcon({
    className: '',
    html: '<div style="width:14px;height:14px;border-radius:50%;background:#10B981;border:3px solid rgba(16,185,129,0.3);box-shadow:0 0 12px rgba(16,185,129,0.4)"></div>',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
})
const markerWarning = L.divIcon({
    className: '',
    html: '<div style="width:14px;height:14px;border-radius:50%;background:#f59e0b;border:3px solid rgba(245,158,11,0.3);box-shadow:0 0 12px rgba(245,158,11,0.4)"></div>',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
})
const markerFull = L.divIcon({
    className: '',
    html: '<div class="animate-pulse" style="width:16px;height:16px;border-radius:50%;background:#ef4444;border:3px solid rgba(239,68,68,0.3);box-shadow:0 0 16px rgba(239,68,68,0.5)"></div>',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
})

const severityColors: Record<string, string> = {
    critical: 'bg-red-500/20 text-red-400 border-red-500/30',
    high: 'bg-orange-500/15 text-orange-400 border-orange-400/25',
    medium: 'bg-amber-500/15 text-amber-400 border-amber-400/25',
    low: 'bg-blue-500/15 text-blue-400 border-blue-400/25',
}

function MonitoringPage() {
    const props = usePage().props as unknown as {
        bins: Bin[]; alerts: AlertItem[]; predictions: PredictionItem[]
        activity: ActivityItem[]; fillLevelHistory: { time: string; value: number }[]
    }
    const { bins, alerts, predictions, activity, fillLevelHistory } = props
    const { t } = useTranslation()
    const { notify } = useToast()
    const [mapReady, setMapReady] = useState(false)
    const [filter, setFilter] = useState<'all' | 'normal' | 'warning' | 'full'>('all')
    const [selectedBin, setSelectedBin] = useState<Bin | null>(null)
    const [panel, setPanel] = useState<'alerts' | 'predictions' | 'activity'>('alerts')
    const [showPanel, setShowPanel] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    useEffect(() => { setMapReady(true) }, [])

    function simulateRefresh() {
        setRefreshing(true)
        setTimeout(() => {
            setRefreshing(false)
            notify({ message: t('monitoring.dataUpdated'), type: 'success' })
        }, 1200)
    }

    const filteredBins = useMemo(() => {
        if (filter === 'all') return bins
        return bins.filter((b) => b.status === filter)
    }, [filter])

    const binIcon = (status: string) => {
        if (status === 'full') return markerFull
        if (status === 'warning') return markerWarning
        return markerNormal
    }

    const panelContent = () => {
        if (panel === 'alerts') return (
            <div className="space-y-2">
                <h3 className="text-xs font-bold text-text-primary flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-amber-400" />{t('monitoring.filterAlertsLive')}</h3>
                {alerts.filter((a) => a.status === 'pending').map((a) => {
                    const bin = bins.find((b) => b.id === a.bin)
                    return (
                        <div key={a.id} className={`p-2.5 rounded-lg border ${severityColors[a.severity]} text-xs space-y-1`}>
                            <div className="flex items-center justify-between">
                                <span className="font-bold">{t(`alerts.severity${a.severity.charAt(0).toUpperCase() + a.severity.slice(1)}`).toUpperCase()}</span>
                                <span className="text-[10px] opacity-60">{a.time}</span>
                            </div>
                            <p>{a.message}</p>
                            {bin && <p className="text-[10px] opacity-60">{bin.name} — {bin.location}</p>}
                        </div>
                    )
                })}
            </div>
        )
        if (panel === 'predictions') return (
            <div className="space-y-2">
                <h3 className="text-xs font-bold text-text-primary flex items-center gap-1.5"><Brain className="w-3.5 h-3.5 text-purple-400" />{t('predictions.title')}</h3>
                {predictions.map((p) => {
                    const bin = bins.find((b) => b.id === p.bin)
                    return (
                        <div key={p.id} className="p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-xs space-y-1">
                            <div className="flex items-center justify-between">
                                <span className="text-purple-300 font-bold">{p.priority}</span>
                                <span className="text-[10px] text-purple-300/60">T-{p.estimatedHours}h</span>
                            </div>
                            <p className="text-text-primary">{p.message}</p>
                            {bin && <p className="text-[10px] text-text-muted">{bin.name}</p>}
                        </div>
                    )
                })}
            </div>
        )
        return (
            <div className="space-y-2">
                <h3 className="text-xs font-bold text-text-primary flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-cyan-400" />{t('monitoring.activitiesRecent')}</h3>
                {activity.length === 0 ? (
                    <p className="text-xs text-text-muted italic">{t('monitoring.noRecentActivity')}</p>
                ) : activity.map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                        <div>
                            <p className="text-text-primary font-semibold">{item.action}</p>
                            <p className="text-text-muted">{item.detail}</p>
                            <p className="text-[10px] text-text-muted">{item.time}</p>
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    const nbFull = bins.filter((b) => b.status === 'full').length
    const nbWarning = bins.filter((b) => b.status === 'warning').length
    const nbNormal = bins.filter((b) => b.status === 'normal').length

    return (
        <div className="flex flex-col h-full min-h-0">
        {/* Barre supérieure KPIs + contrôles */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-3 sm:px-6 py-3 bg-bg-secondary/80 backdrop-blur-md border-b border-border shrink-0 gap-3 rounded-t-xl">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                <h1 className="text-sm sm:text-base font-bold text-text-primary">{t('monitoring.title')}</h1>
                <div className="flex items-center gap-2 flex-wrap">
                    {[
                        { label: `${bins.length}`, sub: t('common.total'), color: 'text-text-primary' },
                        { label: String(nbNormal), sub: t('monitoring.filterNormal'), color: 'text-emerald-400' },
                        { label: String(nbWarning), sub: t('monitoring.filterWarning'), color: 'text-amber-400' },
                        { label: String(nbFull), sub: t('monitoring.filterFull'), color: 'text-red-400' },
                    ].map(({ label, sub, color }) => (
                        <div key={sub} className="flex items-center gap-1 text-[10px] sm:text-xs bg-input-bg px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg">
                            <span className={`font-bold ${color}`}>{label}</span>
                            <span className="text-text-muted">{sub}</span>
                        </div>
                    ))}
                </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-1 bg-input-bg rounded-lg p-0.5">
                    {(['all', 'normal', 'warning', 'full'] as const).map((f) => (
                        <button key={f} onClick={() => setFilter(f)}
                            className={`px-2 sm:px-2.5 py-1 rounded-md text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider transition-all ${filter === f ? 'bg-emerald-600 text-text-primary shadow-lg shadow-emerald-600/20' : 'text-text-muted hover:text-text-primary'}`}
                        >{f === 'all' ? t('monitoring.filterAll') : t('bins.filter' + f.charAt(0).toUpperCase() + f.slice(1))}</button>
                    ))}
                </div>
                <button onClick={() => setShowPanel(!showPanel)} className={`p-2 rounded-lg transition-all ${showPanel ? 'bg-emerald-500/10 text-emerald-400' : 'bg-input-bg text-text-muted hover:text-text-primary'}`} title={t('monitoring.panel')}>
                    <ChevronRight className={`w-4 h-4 transition-transform ${showPanel ? 'rotate-180' : ''}`} />
                </button>
                <button onClick={simulateRefresh} disabled={refreshing} className="p-2 rounded-lg bg-input-bg text-text-muted hover:text-text-primary transition-all" title={t('monitoring.refresh')}>
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
                </button>
            </div>
        </div>

        {/* Ligne Carte + Panneau */}
        <div className="flex flex-1 min-h-0 flex-col sm:flex-row min-h-[40vh] sm:min-h-0">
            {/* Carte */}
            <div className="relative flex-1 min-h-0">
                {mapReady && (
                    <MapContainer center={[3.848, 11.502]} zoom={14} className="absolute inset-0 h-full w-full" zoomControl={false}>
                        <MapResize showPanel={showPanel} />
                        <TileLayer
                            attribution='&copy; <a href="https://osm.org/copyright">OSM</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        {filteredBins.map((bin) => (
                            <Marker key={bin.id} position={[bin.lat, bin.lng]} icon={binIcon(bin.status)}>
                                <Popup className="glass-popup">
                                    <div className="min-w-[180px]">
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <p className="text-[10px] font-bold text-text-primary/60">{bin.id}</p>
                                                <p className="text-sm font-bold text-text-primary">{bin.name}</p>
                                            </div>
                                            <StatusBadge status={bin.status} />
                                        </div>
                                        <div className="space-y-1 text-xs text-text-secondary">
                                            <p className="flex items-center gap-1.5"><MapPin className="w-3 h-3" />{bin.location}</p>
                                            <p className="flex items-center gap-1.5"><Thermometer className="w-3 h-3" />{bin.temperature}°C</p>
                                            <p className="flex items-center gap-1.5"><BatteryCharging className="w-3 h-3" />{bin.battery}%</p>
                                            <div className="mt-2">
                                                <div className="flex justify-between text-[10px] mb-1">
                                                    <span className="text-text-muted">{t('monitoring.fillLevel')}</span><span className="font-bold text-text-primary">{bin.fillLevel}%</span>
                                                </div>
                                                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full ${bin.fillLevel > 80 ? 'bg-red-500' : bin.fillLevel > 50 ? 'bg-orange-400' : 'bg-emerald-500'}`} style={{ width: `${bin.fillLevel}%` }} />
                                                </div>
                                            </div>
                                            <p className="text-[10px] text-text-muted mt-1">{bin.lastUpdate}</p>
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                )}

                {/* Légende superposée */}
                <div className="absolute top-4 left-4 z-[999] bg-bg-secondary/90 backdrop-blur-md border border-border rounded-xl p-2 sm:p-3 text-[10px] sm:text-xs space-y-1 sm:space-y-1.5 shadow-xl">
                    {[
                        { color: 'bg-emerald-500', label: t('monitoring.legendNormal'), shadow: 'shadow-emerald-500/30' },
                        { color: 'bg-amber-400', label: t('monitoring.legendWarning'), shadow: 'shadow-amber-400/30' },
                        { color: 'bg-red-500', label: t('monitoring.legendFull'), shadow: 'shadow-red-500/30' },
                    ].map(({ color, label, shadow }) => (
                        <div key={label} className="flex items-center gap-2">
                            <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${color} shadow-lg ${shadow}`} />
                            <span className="text-text-secondary">{label}</span>
                        </div>
                    ))}
                </div>

                {/* Info benne sélectionnée */}
                {selectedBin && (
                    <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-[999] bg-bg-secondary/95 backdrop-blur-md border border-border rounded-xl p-4 shadow-2xl">
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <p className="text-[10px] text-text-muted font-bold">{selectedBin.id}</p>
                                <p className="text-sm font-bold text-text-primary">{selectedBin.name}</p>
                            </div>
                            <button onClick={() => setSelectedBin(null)} className="p-1 rounded-lg hover:bg-white/5 text-text-muted"><X className="w-3.5 h-3.5" /></button>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-xs">
                            <div className="bg-input-bg rounded-lg p-2 text-center">
                                <p className="text-emerald-400 font-bold">{selectedBin.fillLevel}%</p>
                                <p className="text-text-muted">{t('monitoring.fillLevel')}</p>
                            </div>
                            <div className="bg-input-bg rounded-lg p-2 text-center">
                                <p className="text-blue-400 font-bold">{selectedBin.battery}%</p>
                                <p className="text-text-muted">{t('monitoring.battery')}</p>
                            </div>
                            <div className="bg-input-bg rounded-lg p-2 text-center">
                                <p className="text-orange-400 font-bold">{selectedBin.temperature}°C</p>
                                <p className="text-text-muted">{t('monitoring.temperature')}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Panneau latéral — mobile: fixed overlay, desktop: slide transition */}
            <div className={`
                fixed sm:relative inset-0 sm:inset-auto z-50 sm:z-auto
                w-full bg-bg-secondary sm:bg-bg-secondary/90 backdrop-blur-md
                sm:border-l border-border flex flex-col shrink-0 overflow-hidden
                transition-all duration-300 ease-in-out
                ${showPanel ? 'sm:w-80 sm:opacity-100' : 'sm:w-0 sm:opacity-0 sm:border-l-0'}
            `}>
                    <div className="flex border-b border-border">
                        {[
                            { key: 'alerts' as const, icon: AlertTriangle, label: t('monitoring.filterAlerts'), count: alerts.filter((a) => a.status === 'pending').length },
                            { key: 'predictions' as const, icon: Brain, label: t('monitoring.filterAI'), count: predictions.length },
                            { key: 'activity' as const, icon: Activity, label: t('monitoring.filterActivity') },
                        ].map(({ key, icon: Icon, label, count }) => (
                            <button key={key} onClick={() => setPanel(key)}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-[11px] font-semibold uppercase tracking-wider transition-all ${panel === key ? 'text-emerald-400 border-b-2 border-emerald-400 bg-emerald-500/5' : 'text-text-muted hover:text-text-primary'}`}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                {label}
                                {count !== undefined && <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full">{count}</span>}
                            </button>
                        ))}
                        <button onClick={() => setShowPanel(false)} className="flex items-center justify-center px-3 text-text-muted hover:text-text-primary transition-all sm:hidden">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {panelContent()}

                        <div className="pt-3 border-t border-border">
                            <h3 className="text-xs font-bold text-text-primary flex items-center gap-1.5 mb-2"><Activity className="w-3.5 h-3.5 text-cyan-400" />{t('monitoring.evolution24h')}</h3>
                            <div className="h-24">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={fillLevelHistory}>
                                        <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#475569' }} axisLine={false} tickLine={false} />
                                        <YAxis hide domain={[0, 100]} />
                                        <Tooltip contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }} />
                                        <Line type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2} dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    <div className="px-4 py-3 border-t border-border flex items-center gap-2 text-xs text-text-muted">
                        <Wifi className="w-3 h-3 text-emerald-400" />
                        <Trans i18nKey="monitoring.connectedWith" values={{ count: 24 }} components={{ span: <span className="text-emerald-400" /> }} />
                    </div>
            </div>
        </div>
    </div>
    )
}

MonitoringPage.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>

export default MonitoringPage
