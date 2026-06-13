import { useState, useMemo } from 'react'
import { Radio, Wifi, WifiOff, AlertTriangle, BatteryCharging, Thermometer, Activity, Search, ChevronLeft, ChevronRight, Clock, RefreshCw, Cpu, Zap, type LucideIcon } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import AppLayout from '../../Layouts/AppLayout'
import { bins } from '../../data/mock-dashboard'

interface Sensor {
    id: string
    binId: string
    binName: string
    type: 'Ultrason' | 'Poids' | 'Température' | 'Batterie'
    status: 'online' | 'offline' | 'error'
    battery: number
    lastReading: string
    lastValue: string
    signal: number
    location: string
    history: { time: string; value: number }[]
}

const sensorTypes = ['Ultrason', 'Poids', 'Température', 'Batterie'] as const

const sensors: Sensor[] = bins.flatMap((bin, bi) => {
    const base: Sensor[] = [
        { id: `SNS-${String(bi * 4 + 1).padStart(3, '0')}`, binId: bin.id, binName: bin.name, type: 'Ultrason', status: 'online', battery: Math.round(50 + Math.random() * 50), lastReading: 'Il y a 1 min', lastValue: `${bin.fillLevel}%`, signal: Math.round(70 + Math.random() * 29), location: bin.location, history: Array.from({ length: 8 }, (_, i) => ({ time: `${i * 3}h`, value: Math.max(0, bin.fillLevel + Math.round((Math.random() - 0.5) * 20)) })) },
        { id: `SNS-${String(bi * 4 + 2).padStart(3, '0')}`, binId: bin.id, binName: bin.name, type: 'Poids', status: bi % 5 === 3 ? 'offline' : 'online', battery: Math.round(30 + Math.random() * 60), lastReading: 'Il y a 2 min', lastValue: `${Math.round(10 + Math.random() * 50)}kg`, signal: Math.round(60 + Math.random() * 35), location: bin.location, history: Array.from({ length: 8 }, (_, i) => ({ time: `${i * 3}h`, value: Math.round(10 + Math.random() * 50) })) },
        { id: `SNS-${String(bi * 4 + 3).padStart(3, '0')}`, binId: bin.id, binName: bin.name, type: 'Température', status: bin.temperature > 27 ? 'error' : 'online', battery: Math.round(40 + Math.random() * 55), lastReading: 'Il y a 3 min', lastValue: `${bin.temperature}°C`, signal: Math.round(75 + Math.random() * 20), location: bin.location, history: Array.from({ length: 8 }, (_, i) => ({ time: `${i * 3}h`, value: bin.temperature + Math.round((Math.random() - 0.5) * 6) })) },
        { id: `SNS-${String(bi * 4 + 4).padStart(3, '0')}`, binId: bin.id, binName: bin.name, type: 'Batterie', status: bin.battery < 30 ? 'error' : 'online', battery: bin.battery, lastReading: 'Il y a 1 min', lastValue: `${bin.battery}%`, signal: Math.round(80 + Math.random() * 15), location: bin.location, history: Array.from({ length: 8 }, (_, i) => ({ time: `${i * 3}h`, value: Math.max(0, bin.battery + Math.round((Math.random() - 0.5) * 10)) })) },
    ]
    return base
})

const statusConfig: Record<string, { icon: LucideIcon; color: string; bg: string; label: string }> = {
    online: { icon: Wifi, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'En ligne' },
    offline: { icon: WifiOff, color: 'text-gray-500', bg: 'bg-gray-500/10', label: 'Hors ligne' },
    error: { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10', label: 'Erreur' },
}

const typeIcons: Record<string, LucideIcon> = { Ultrason: Activity, Poids: Zap, Température: Thermometer, Batterie: BatteryCharging }

function SensorsPage() {
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('Tous')
    const [typeFilter, setTypeFilter] = useState('Tous')
    const [page, setPage] = useState(1)
    const perPage = 8

    const filtered = useMemo(() => {
        return sensors.filter((s) => {
            const matchSearch = s.id.toLowerCase().includes(search.toLowerCase()) || s.binName.toLowerCase().includes(search.toLowerCase()) || s.type.toLowerCase().includes(search.toLowerCase()) || s.location.toLowerCase().includes(search.toLowerCase())
            const matchStatus = statusFilter === 'Tous' || s.status === statusFilter
            const matchType = typeFilter === 'Tous' || s.type === typeFilter
            return matchSearch && matchStatus && matchType
        })
    }, [search, statusFilter, typeFilter])

    const totalPages = Math.ceil(filtered.length / perPage)
    const paginated = filtered.slice((page - 1) * perPage, page * perPage)

    const onlineCount = sensors.filter((s) => s.status === 'online').length
    const errorCount = sensors.filter((s) => s.status === 'error').length

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Radio className="w-6 h-6 text-cyan-400" />Capteurs
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">{sensors.length} capteurs · {onlineCount} en ligne · {errorCount} en erreur</p>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total capteurs', value: sensors.length, icon: Radio, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
                    { label: 'En ligne', value: onlineCount, icon: Wifi, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                    { label: 'Hors ligne', value: sensors.filter((s) => s.status === 'offline').length, icon: WifiOff, color: 'text-gray-500', bg: 'bg-gray-500/10' },
                    { label: 'Erreurs', value: errorCount, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10' },
                ].map(({ label, value, icon: Icon, color, bg }) => (
                    <div key={label} className="glass rounded-xl p-4 flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${bg}`}><Icon className={`w-5 h-5 ${color}`} /></div>
                        <div>
                            <p className="text-xs text-gray-500">{label}</p>
                            <p className={`text-lg font-bold ${color}`}>{value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filtres */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Rechercher un capteur..." className="w-full pl-10 pr-4 py-2.5 bg-[#1E293B]/80 rounded-xl border border-[#334155] focus:border-cyan-500 outline-none text-sm text-white placeholder:text-gray-600 transition-all" />
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1 bg-[#1E293B]/80 rounded-lg p-0.5 overflow-x-auto no-scrollbar">
                        {['Tous', 'online', 'offline', 'error'].map((s) => (
                            <button key={s} onClick={() => { setStatusFilter(s); setPage(1) }} className={`shrink-0 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${statusFilter === s ? 'bg-cyan-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>{s === 'Tous' ? 'Tous' : s === 'online' ? 'En ligne' : s === 'offline' ? 'Hors ligne' : 'Erreur'}</button>
                        ))}
                    </div>
                    <div className="flex items-center gap-1 bg-[#1E293B]/80 rounded-lg p-0.5 overflow-x-auto no-scrollbar">
                        {['Tous', ...sensorTypes].map((t) => (
                            <button key={t} onClick={() => { setTypeFilter(t); setPage(1) }} className={`shrink-0 px-2.5 py-1.5 rounded-md text-[10px] font-semibold transition-all ${typeFilter === t ? 'bg-cyan-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>{t}</button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Grille capteurs */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {paginated.map((sensor) => {
                    const st = statusConfig[sensor.status]
                    const TypeIcon = typeIcons[sensor.type]
                    const SignalIcon = sensor.signal > 80 ? Wifi : sensor.signal > 50 ? Wifi : WifiOff
                    return (
                        <div key={sensor.id} className={`glass rounded-xl p-4 transition-all hover:bg-[rgba(255,255,255,0.04)] ${sensor.status === 'error' ? 'border border-red-500/20' : ''}`}>
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className={`p-2 rounded-lg ${st.bg}`}><TypeIcon className={`w-4 h-4 ${st.color}`} /></div>
                                    <div>
                                        <p className="text-[10px] text-gray-500 font-bold">{sensor.id}</p>
                                        <p className="text-xs font-bold text-white">{sensor.binName}</p>
                                    </div>
                                </div>
                                <span className={`flex items-center gap-1 text-[10px] font-semibold ${st.color}`}>
                                    <st.icon className="w-3 h-3" />{st.label}
                                </span>
                            </div>

                            <div className="text-center py-2 mb-2 bg-[#1E293B]/50 rounded-lg">
                                <p className="text-lg font-bold text-white">{sensor.lastValue}</p>
                                <p className="text-[10px] text-gray-500">{sensor.type}</p>
                            </div>

                            {/* Mini graphique */}
                            <div className="h-12 mb-2">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={sensor.history}>
                                        <Line type="monotone" dataKey="value" stroke={sensor.status === 'error' ? '#ef4444' : '#06b6d4'} strokeWidth={1.5} dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="flex items-center justify-between text-[10px] text-gray-500 pt-2 border-t border-[#334155]/50">
                                <span className="flex items-center gap-1"><BatteryCharging className="w-3 h-3" />{sensor.battery}%</span>
                                <span className="flex items-center gap-1"><SignalIcon className={`w-3 h-3 ${sensor.signal > 80 ? 'text-emerald-400' : sensor.signal > 50 ? 'text-amber-400' : 'text-red-400'}`} />{sensor.signal}%</span>
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{sensor.lastReading}</span>
                            </div>
                        </div>
                    )
                })}
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 overflow-x-auto no-scrollbar">
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg bg-[#1E293B]/80 text-gray-500 hover:text-white disabled:opacity-30 transition-all shrink-0"><ChevronLeft className="w-4 h-4" /></button>
                    {Array.from({ length: totalPages }, (_, i) => (
                        <button key={i} onClick={() => setPage(i + 1)} className={`w-8 h-8 rounded-lg text-xs font-bold transition-all shrink-0 ${page === i + 1 ? 'bg-cyan-600 text-white shadow-lg' : 'bg-[#1E293B]/80 text-gray-500 hover:text-white'}`}>{i + 1}</button>
                    ))}
                    <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg bg-[#1E293B]/80 text-gray-500 hover:text-white disabled:opacity-30 transition-all shrink-0"><ChevronRight className="w-4 h-4" /></button>
                </div>
            )}
        </div>
    )
}

SensorsPage.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>
export default SensorsPage
