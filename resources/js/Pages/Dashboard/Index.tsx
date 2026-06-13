import 'leaflet/dist/leaflet.css'
import { useEffect, useState, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import AppLayout from '../../Layouts/AppLayout'
import KPICard from '../../Components/KPICard'
import StatusBadge from '../../Components/StatusBadge'
import {
    Trash2,
    Activity,
    AlertTriangle,
    TrendingUp,
    Brain,
    Bell,
    Gauge,
    BatteryCharging,
    Thermometer,
} from 'lucide-react'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts'
import {
    kpiData,
    fillLevelHistory,
    bins,
    alerts,
} from '../../data/mock-dashboard'

// ============================================================
// Icônes de marqueurs Leaflet pour la carte
// ============================================================

/** Marqueur vert — statut normal */
const markerIcon = L.divIcon({
    className: '',
    html: '<div style="width:12px;height:12px;border-radius:50%;background:#10B981;border:2px solid #fff;box-shadow:0 0 0 4px rgba(16,185,129,0.2)"></div>',
    iconSize: [12, 12],
    iconAnchor: [6, 6],
})

/** Marqueur orange — seuil d'attention */
const markerIconWarning = L.divIcon({
    className: '',
    html: '<div style="width:12px;height:12px;border-radius:50%;background:#f59e0b;border:2px solid #fff;box-shadow:0 0 0 4px rgba(245,158,11,0.2)"></div>',
    iconSize: [12, 12],
    iconAnchor: [6, 6],
})

/** Marqueur rouge animé — benne pleine / critique */
const markerIconFull = L.divIcon({
    className: '',
    html: '<div class="animate-pulse" style="width:14px;height:14px;border-radius:50%;background:#ef4444;border:2px solid #fff;box-shadow:0 0 0 6px rgba(239,68,68,0.3)"></div>',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
})

/**
 * Page principale du tableau de bord SmartBin
 * Affiche les KPI, graphiques, cartes bennes et carte interactive
 */
function DashboardPage() {
    const [mapReady, setMapReady] = useState(false)

    // La carte Leaflet ne se monte qu'après le rendu initial (SSR safe)
    useEffect(() => {
        setMapReady(true)
    }, [])

    // Sélectionne l'icône selon le statut de la benne
    function getMarkerIcon(status: string) {
        if (status === 'full') return markerIconFull
        if (status === 'warning') return markerIconWarning
        return markerIcon
    }

    // Effet 3D tilt au survol des cartes bennes
    const handleTiltMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const el = e.currentTarget
        const rect = el.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const rotateX = (y - rect.height / 2) / 20
        const rotateY = (rect.width / 2 - x) / 20
        el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`
    }, [])

    const handleTiltLeave = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        e.currentTarget.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)'
    }, [])

    return (
        <div className="space-y-6">
            {/* En-tête du dashboard */}
            <div>
                <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                <p className="text-sm text-gray-400 mt-1">Vue d'ensemble du réseau SmartBin</p>
            </div>

            {/* Rangée 1 — KPI principaux */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <KPICard title="Total Benne" value={kpiData.totalBins} icon={Trash2} />
                <KPICard title="Capteurs Actifs" value={kpiData.activeSensors} icon={Activity} trend="+2 cette semaine" trendUp />
                <KPICard title="Niveau Moyen" value={`${kpiData.averageFillLevel}%`} icon={TrendingUp} trend="+5%" />
                <KPICard title="Efficacité Collecte" value={`${kpiData.collectionEfficiency}%`} icon={Gauge} trend="+3% cette semaine" trendUp />
            </div>

            {/* Rangée 2 — KPI alertes et prédictions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
                <KPICard title="Alertes Critiques" value={kpiData.criticalAlerts} icon={AlertTriangle} trend="+1 aujourd'hui" />
                <KPICard title="Débordements" value={kpiData.predictedOverflows} icon={Brain} />
                <KPICard title="Notifications" value={kpiData.notificationsSent} icon={Bell} trend="+12 aujourd'hui" trendUp />
            </div>

            {/* Graphique + Alertes récentes */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Graphique d'évolution du remplissage */}
                <div className="lg:col-span-2 glass rounded-xl p-6">
                    <h2 className="text-lg font-semibold text-white mb-4">Évolution du remplissage</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={fillLevelHistory}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="time" stroke="#475569" tick={{ fill: '#475569', fontSize: 12 }} />
                            <YAxis stroke="#475569" tick={{ fill: '#475569', fontSize: 12 }} domain={[0, 100]} unit="%" />
                            <Tooltip
                                contentStyle={{
                                    background: '#1E293B',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    color: '#fff',
                                }}
                            />
                            <Line
                                type="monotone"
                                dataKey="value"
                                stroke="#10B981"
                                strokeWidth={2}
                                dot={{ fill: '#10B981', strokeWidth: 2 }}
                                activeDot={{ r: 6, fill: '#10B981' }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Liste des alertes récentes */}
                <div className="glass rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-white">Alertes récentes</h2>
                        <span className="text-xs text-emerald-400 cursor-pointer hover:text-emerald-300">Voir tout</span>
                    </div>
                    <div className="space-y-3">
                        {alerts.slice(0, 4).map((alert) => (
                            <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
                                {/* Icône de sévérité */}
                                <div className={`p-1.5 rounded-full ${
                                    alert.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                                    alert.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
                                    'bg-amber-500/20 text-amber-400'
                                }`}>
                                    <AlertTriangle className="w-3 h-3" />
                                </div>
                                {/* Contenu de l'alerte */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-white truncate">{alert.message}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs text-gray-500">{alert.bin}</span>
                                        <span className="text-xs text-gray-600">•</span>
                                        <span className="text-xs text-gray-500">{alert.time}</span>
                                    </div>
                                </div>
                                <StatusBadge status={alert.status === 'pending' ? 'pending' : 'resolved'} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Cartes bennes + Carte interactive */}
            <div className="grid grid-cols-12 gap-4 sm:gap-[24px]">
                {/* Liste horizontale des bennes en direct */}
                <div className="col-span-12 space-y-3 sm:space-y-4 animate-fade-in" style={{ animationDelay: '650ms' }}>
                    <div className="flex items-center justify-between">
                        <h4 className="text-lg sm:text-[24px] sm:leading-[32px] font-semibold text-[#f8fafc]">Live Bin Status</h4>
                        <div className="flex gap-2">
                            <button className="p-1.5 glass rounded hover:bg-white/10 transition-colors">
                                <span className="material-symbols-outlined text-[20px] text-[#94a3b8]">chevron_left</span>
                            </button>
                            <button className="p-1.5 glass rounded hover:bg-white/10 transition-colors">
                                <span className="material-symbols-outlined text-[20px] text-[#94a3b8]">chevron_right</span>
                            </button>
                        </div>
                    </div>
                    {/* Scroll horizontal avec snap */}
                    <div className="flex gap-3 sm:gap-[24px] overflow-x-auto no-scrollbar py-2 snap-x">
                        {bins.map((bin) => {
                            const borderColor = bin.status === 'full' ? 'border-red-500' : bin.status === 'warning' ? 'border-orange-400' : 'border-[#10B981]'
                            const fillColor = bin.fillLevel > 80 ? 'text-red-500' : bin.fillLevel > 50 ? 'text-orange-400' : 'text-[#10B981]'
                            const fillBg = bin.fillLevel > 80 ? 'bg-red-500' : bin.fillLevel > 50 ? 'bg-orange-400' : 'bg-[#10B981]'
                            const statusIcon = bin.status === 'full' ? 'warning' : bin.status === 'warning' ? 'hourglass_top' : 'check_circle'

                            return (
                                <div
                                    key={bin.id}
                                    onMouseMove={handleTiltMove}
                                    onMouseLeave={handleTiltLeave}
                                    className={`glass min-w-[220px] sm:min-w-[280px] p-3 sm:p-4 rounded-xl flex flex-col gap-3 sm:gap-4 snap-start border-l-4 ${borderColor}`}
                                >
                                    {/* En-tête: ID et icône de statut */}
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-[10px] text-[#94a3b8] font-bold uppercase">{bin.id}</p>
                                            <h6 className="font-bold text-[14px] leading-[20px] text-[#f8fafc]">{bin.name}</h6>
                                        </div>
                                        <span className={`material-symbols-outlined ${fillColor}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                                            {statusIcon}
                                        </span>
                                    </div>
                                    {/* Barre de remplissage + batterie + température */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-[12px] leading-[16px] font-semibold">
                                            <span className="text-[#94a3b8]">Fill Level</span>
                                            <span className={`font-bold ${fillColor}`}>{bin.fillLevel}%</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-[#1E293B] rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full ${fillBg}`} style={{ width: `${bin.fillLevel}%` }} />
                                        </div>
                                        <div className="flex justify-between text-[11px] text-[#94a3b8] pt-2">
                                            <span className="flex items-center gap-1">
                                                <BatteryCharging className="w-3.5 h-3.5" />
                                                {bin.battery}%
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Thermometer className="w-3.5 h-3.5" />
                                                {bin.temperature}°C
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Carte interactive du réseau — overlay d'information + marqueurs Leaflet */}
                <div className="col-span-12 glass p-0 rounded-xl overflow-hidden h-[300px] sm:h-[400px] relative">
                    {/* Overlay d'information en haut à gauche */}
                    <div className="absolute top-4 left-4 z-[9999] flex flex-col gap-2">
                        <div className="bg-[#1E293B] p-3 rounded-lg flex flex-col gap-1 shadow-lg border border-white/10 hover:scale-105 transition-transform duration-200 cursor-default">
                            <h5 className="text-sm font-bold text-white">City-Wide Deployment</h5>
                            <p className="text-[10px] text-gray-400">Central Hub: Yaoundé, CM</p>
                        </div>
                        {/* Légende des couleurs */}
                        <div className="bg-[#1E293B] p-2 rounded-lg flex gap-4 shadow-lg border border-white/10">
                            <div className="flex items-center gap-1.5 hover:scale-110 transition-transform duration-200 cursor-pointer"><div className="w-2 h-2 rounded-full bg-emerald-500"></div><span className="text-[10px] text-gray-200">Optimal</span></div>
                            <div className="flex items-center gap-1.5 hover:scale-110 transition-transform duration-200 cursor-pointer"><div className="w-2 h-2 rounded-full bg-orange-400"></div><span className="text-[10px] text-gray-200">Warning</span></div>
                            <div className="flex items-center gap-1.5 hover:scale-110 transition-transform duration-200 cursor-pointer"><div className="w-2 h-2 rounded-full bg-red-500"></div><span className="text-[10px] text-gray-200">Critical</span></div>
                        </div>
                    </div>
                {/* Carte Leaflet rendue côté client uniquement */}
                {mapReady && (
                    <div className="h-full w-full">
                        <MapContainer
                            center={[3.848, 11.502]}
                            zoom={14}
                            className="h-full w-full"
                            zoomControl={false}
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://osm.org/copyright">OSM</a>'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            {bins.map((bin) => (
                                <Marker
                                    key={bin.id}
                                    position={[bin.lat, bin.lng]}
                                    icon={getMarkerIcon(bin.status)}
                                >
                                    <Popup>
                                        <div className="text-sm">
                                            <p className="font-semibold">{bin.id} - {bin.name}</p>
                                            <p className="text-gray-600 text-xs mt-1">{bin.location}</p>
                                            <p className="mt-1">
                                                Remplissage : <span className={`font-medium ${bin.fillLevel > 80 ? 'text-red-500' : bin.fillLevel > 50 ? 'text-amber-500' : 'text-emerald-500'}`}>{bin.fillLevel}%</span>
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">Dernière mise à jour : {bin.lastUpdate}</p>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}
                        </MapContainer>
                    </div>
                )}
            </div>
            </div>
        </div>
    )
}

// Applique le layout principal avec sidebar et navbar
DashboardPage.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>

export default DashboardPage
