import { useState, useMemo, useEffect } from 'react'
import { Radio, Wifi, WifiOff, AlertTriangle, BatteryCharging, Thermometer, Activity, Search, ChevronLeft, ChevronRight, Clock, Zap, X, Trash2, Plus, type LucideIcon } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import AppLayout from '../../Layouts/AppLayout'
import { useToast } from '../../Components/Toast'
import { usePage, router } from '@inertiajs/react'
import { useTranslation } from 'react-i18next'

interface Sensor {
    id: string
    displayId: string
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

const statusConfig: Record<string, { icon: LucideIcon; color: string; bg: string; label: string }> = {
    online: { icon: Wifi, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'En ligne' },
    offline: { icon: WifiOff, color: 'text-text-muted', bg: 'bg-gray-500/10', label: 'Hors ligne' },
    error: { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10', label: 'Erreur' },
}

const typeIcons: Record<string, LucideIcon> = { Ultrason: Activity, Poids: Zap, Température: Thermometer, Batterie: BatteryCharging }

const typeToDb: Record<string, string> = { Ultrason: 'ULTRASONIC', Poids: 'WEIGHT', Température: 'TEMPERATURE', Batterie: 'BATTERY' }
const dbToType: Record<string, string> = { ULTRASONIC: 'Ultrason', WEIGHT: 'Poids', TEMPERATURE: 'Température', BATTERY: 'Batterie' }

const modelByType: Record<string, string> = { Ultrason: 'HC-SR04', Poids: 'HX711', Température: 'DS18B20', Batterie: 'MAX17048' }

function SensorsPage() {
    const { t } = useTranslation()
    const { sensors: initialSensors, bins } = usePage().props as unknown as { sensors: Sensor[]; bins?: Array<{ id: string; name: string; code: string }> }
    const userRole = (usePage().props as { auth?: { user?: { role?: string } } })?.auth?.user?.role

    const [sensors, setSensors] = useState(initialSensors)
    useEffect(() => { setSensors(initialSensors) }, [initialSensors])

    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('Tous')
    const [typeFilter, setTypeFilter] = useState('Tous')
    const [page, setPage] = useState(1)
    const [showModal, setShowModal] = useState(false)
    const [editingSensor, setEditingSensor] = useState<Sensor | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<Sensor | null>(null)
    const [form, setForm] = useState({ binId: '', type: 'Ultrason' as string, model: 'HC-SR04' as string, status: 'ACTIVE' as string })
    const perPage = 8
    const { notify } = useToast()

    const filtered = useMemo(() => {
        return sensors.filter((s) => {
            const matchSearch = s.id.toLowerCase().includes(search.toLowerCase()) || s.binName.toLowerCase().includes(search.toLowerCase()) || s.type.toLowerCase().includes(search.toLowerCase()) || s.location.toLowerCase().includes(search.toLowerCase())
            const matchStatus = statusFilter === 'Tous' || s.status === statusFilter
            const matchType = typeFilter === 'Tous' || s.type === typeFilter
            return matchSearch && matchStatus && matchType
        })
    }, [search, statusFilter, typeFilter, sensors])

    const totalPages = Math.ceil(filtered.length / perPage)
    const paginated = filtered.slice((page - 1) * perPage, page * perPage)

    const onlineCount = sensors.filter((s) => s.status === 'online').length
    const errorCount = sensors.filter((s) => s.status === 'error').length

    useEffect(() => { setPage(1) }, [search, statusFilter, typeFilter])

    function openAdd() {
        setEditingSensor(null)
        setForm({ binId: bins?.[0]?.id ?? '', type: 'Ultrason', model: 'HC-SR04', status: 'ACTIVE' })
        setShowModal(true)
    }

    function openEdit(sensor: Sensor) {
        setEditingSensor(sensor)
        const dbType = Object.entries(dbToType).find(([, v]) => v === sensor.type)?.[0] ?? 'ULTRASONIC'
        setForm({ binId: sensor.binId, type: sensor.type, model: modelByType[sensor.type] ?? 'HC-SR04', status: 'ACTIVE' })
        setShowModal(true)
    }

    function saveSensor() {
        if (editingSensor) {
            router.patch(`/sensors/${editingSensor.id}`, { type: typeToDb[form.type], model: form.model, status: form.status }, { preserveScroll: true })
            notify({ message: t('sensors.toastModified'), sub: `${form.type} — ${editingSensor.binName}`, type: 'info' })
        } else {
            router.post('/sensors', { bin_id: form.binId, type: typeToDb[form.type], model: form.model, status: form.status }, { preserveScroll: true })
            notify({ message: t('sensors.toastAdded'), sub: `${form.type}`, type: 'success' })
        }
        setShowModal(false)
        setEditingSensor(null)
    }

    function confirmDelete() {
        if (!deleteTarget) return
        router.delete(`/sensors/${deleteTarget.id}`, { preserveScroll: true })
        setSensors((prev) => prev.filter((s) => s.id !== deleteTarget.id))
        notify({ message: t('sensors.toastDeleted'), sub: `${deleteTarget.type} — ${deleteTarget.binName}`, type: 'success' })
        setDeleteTarget(null)
    }

    return (
        <div className="space-y-6">
            {/* Confirmation suppression */}
            {deleteTarget && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex items-center bg-gradient-to-r from-red-600/95 to-red-700/95 backdrop-blur-md border border-red-400/30 shadow-2xl shadow-red-900/50 animate-slide-down rounded-xl">
                    <div className="flex items-center gap-4 py-2.5 px-5 justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
                                <svg className="w-4 h-4 text-text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-text-primary">{t('sensors.deleteConfirm')}</p>
                                <p className="text-xs text-red-200/80">{deleteTarget.type} — {deleteTarget.binName}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={confirmDelete} className="px-4 py-1.5 bg-white text-red-700 text-xs font-bold rounded-lg hover:bg-red-50 transition-all shadow-lg">{t('common.confirm')}</button>
                            <button onClick={() => setDeleteTarget(null)} className="px-4 py-1.5 bg-white/10 text-text-primary text-xs font-semibold rounded-lg hover:bg-white/20 transition-all">{t('common.cancel')}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* En-tête */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                        <Radio className="w-6 h-6 text-cyan-400" />{t('sensors.title')}
                    </h1>
                    <p className="text-sm text-text-secondary mt-1">{t('sensors.statusSummary', { count: sensors.length, online: onlineCount, error: errorCount })}</p>
                </div>
                {(userRole === 'ADMIN' || userRole === 'SUPERVISEUR' || userRole === 'OPERATEUR' || userRole === 'TECHNICIEN') && (
                    <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-text-primary text-sm font-semibold rounded-xl transition-colors">
                        <Plus className="w-4 h-4" /> {t('sensors.add')}
                    </button>
                )}
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { key: 'total' as const, value: sensors.length, icon: Radio, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
                    { key: 'online' as const, value: onlineCount, icon: Wifi, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                    { key: 'offline' as const, value: sensors.filter((s) => s.status === 'offline').length, icon: WifiOff, color: 'text-text-muted', bg: 'bg-gray-500/10' },
                    { key: 'error' as const, value: errorCount, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10' },
                ].map(({ key, value, icon: Icon, color, bg }) => (
                    <div key={key} className="glass rounded-xl p-4 flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${bg}`}><Icon className={`w-5 h-5 ${color}`} /></div>
                        <div>
                            <p className="text-xs text-text-muted">{key === 'total' ? t('sensors.total') : key === 'online' ? t('sensors.online') : key === 'offline' ? t('sensors.offline') : t('sensors.error')}</p>
                            <p className={`text-lg font-bold ${color}`}>{value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filtres */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder={t('sensors.search')} className="w-full pl-10 pr-4 py-2.5 bg-input-bg rounded-xl border border-border focus:border-cyan-500 outline-none text-sm text-text-primary placeholder:text-text-muted transition-all" />
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1 bg-input-bg rounded-lg p-0.5 overflow-x-auto no-scrollbar">
                        {['Tous', 'online', 'offline', 'error'].map((s) => (
                            <button key={s} onClick={() => { setStatusFilter(s); setPage(1) }} className={`shrink-0 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${statusFilter === s ? 'bg-cyan-600 text-text-primary shadow-lg' : 'text-text-muted hover:text-gray-300'}`}>{s === 'Tous' ? t('common.all') : s === 'online' ? t('sensors.filterOnline') : s === 'offline' ? t('sensors.filterOffline') : t('sensors.filterError')}</button>
                        ))}
                    </div>
                    <div className="flex items-center gap-1 bg-input-bg rounded-lg p-0.5 overflow-x-auto no-scrollbar">
                        {['Tous', ...sensorTypes].map((type) => (
                            <button key={type} onClick={() => { setTypeFilter(type); setPage(1) }} className={`shrink-0 px-2.5 py-1.5 rounded-md text-[10px] font-semibold transition-all ${typeFilter === type ? 'bg-cyan-600 text-text-primary shadow-lg' : 'text-text-muted hover:text-gray-300'}`}>{type === 'Tous' ? t('common.all') : type === 'Ultrason' ? t('sensors.typeUltrason') : type === 'Poids' ? t('sensors.typeWeight') : type === 'Température' ? t('sensors.typeTemperature') : t('sensors.typeBattery')}</button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Grille capteurs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginated.map((sensor) => {
                    const st = statusConfig[sensor.status]
                    const TypeIcon = typeIcons[sensor.type]
                    const bars = sensor.signal > 80 ? 5 : sensor.signal > 60 ? 4 : sensor.signal > 40 ? 3 : sensor.signal > 20 ? 2 : 1
                    const signalColor = bars >= 4 ? 'bg-emerald-400' : bars >= 3 ? 'bg-amber-400' : 'bg-red-400'
                    return (
                        <div key={sensor.id} className={`group glass rounded-xl p-4 transition-all hover:bg-[rgba(255,255,255,0.04)] ${sensor.status === 'error' ? 'border border-red-500/20' : ''}`}>
                            {/* En-tête : ID + bin code + nom */}
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className={`p-2 rounded-lg ${st.bg}`}><TypeIcon className={`w-4 h-4 ${st.color}`} /></div>
                                    <div>
                                        <p className="text-[10px] text-text-muted font-bold">{sensor.displayId}</p>
                                        <p className="text-xs text-text-primary">
                                            <span className="text-text-secondary">{sensor.binId}</span>
                                            <span className="text-text-muted mx-1">•</span>
                                            <span className="font-semibold">{sensor.binName}</span>
                                        </p>
                                    </div>
                                </div>
                                <span className={`flex items-center gap-1 text-[10px] font-semibold ${st.color}`}>
                                    <st.icon className="w-3 h-3" />{sensor.status === 'online' ? t('sensors.filterOnline') : sensor.status === 'offline' ? t('sensors.filterOffline') : t('sensors.filterError')}
                                </span>
                            </div>

                            {/* Valeur */}
                            <div className="text-center py-2 mb-2 bg-bg-card/50 rounded-lg">
                                <p className="text-lg font-bold text-text-primary">{sensor.lastValue}</p>
                                <p className="text-[10px] text-text-muted">{sensor.type}</p>
                            </div>

                            {/* Mini graphique */}
                            <div className="h-12 mb-2">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={sensor.history}>
                                        <Line type="monotone" dataKey="value" stroke={sensor.status === 'error' ? '#ef4444' : '#06b6d4'} strokeWidth={1.5} dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Footer : batterie + signal visuel + localisation + temps */}
                            <div className="space-y-1.5 pt-2 border-t border-border/50">
                                <div className="flex items-center justify-between text-[10px] text-text-muted">
                                    <span className="flex items-center gap-1.5">
                                        <BatteryCharging className="w-3 h-3" />
                                        <span className={sensor.battery < 20 ? 'text-red-400 font-semibold' : ''}>{sensor.battery}%</span>
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <span className="flex items-center gap-0.5">
                                            {[1, 2, 3, 4, 5].map((b) => (
                                                <span key={b} className={`w-1 rounded-sm transition-all ${
                                                    b <= bars ? signalColor : 'bg-[#334155]'
                                                } ${b <= 2 ? 'h-2' : b <= 4 ? 'h-3' : 'h-4'}`} />
                                            ))}
                                        </span>
                                        <span className="text-text-muted">{sensor.signal}%</span>
                                    </span>
                                    <span className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:sm:opacity-100 transition-all ml-auto">
                                        {(userRole === 'ADMIN' || userRole === 'SUPERVISEUR' || userRole === 'OPERATEUR' || userRole === 'TECHNICIEN') && (
                                            <button onClick={() => openEdit(sensor)} className="p-1.5 rounded-lg bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 transition-all">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                            </button>
                                        )}
                                        {(userRole === 'ADMIN' || userRole === 'SUPERVISEUR') && (
                                            <button onClick={() => setDeleteTarget(sensor)} className="p-1.5 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-all">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-[10px] text-text-muted">
                                    <span className="truncate max-w-[160px]">{sensor.location}</span>
                                    <span className="flex items-center gap-1 shrink-0"><Clock className="w-3 h-3" />{sensor.lastReading}</span>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 overflow-x-auto no-scrollbar">
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg bg-input-bg text-text-muted hover:text-text-primary disabled:opacity-30 transition-all shrink-0"><ChevronLeft className="w-4 h-4" /></button>
                    {Array.from({ length: totalPages }, (_, i) => (
                        <button key={i} onClick={() => setPage(i + 1)} className={`w-8 h-8 rounded-lg text-xs font-bold transition-all shrink-0 ${page === i + 1 ? 'bg-cyan-600 text-text-primary shadow-lg' : 'bg-input-bg text-text-muted hover:text-text-primary'}`}>{i + 1}</button>
                    ))}
                    <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg bg-input-bg text-text-muted hover:text-text-primary disabled:opacity-30 transition-all shrink-0"><ChevronRight className="w-4 h-4" /></button>
                </div>
            )}

            {/* Modale CRUD */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => { setShowModal(false); setEditingSensor(null) }}>
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                    <div className="relative w-full max-w-md glass rounded-2xl p-6 border border-border shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-text-primary">{editingSensor ? t('sensors.edit') : t('sensors.newSensor')}</h2>
                            <button onClick={() => { setShowModal(false); setEditingSensor(null) }} className="p-1 rounded-lg hover:bg-white/5 text-text-muted hover:text-text-primary transition-all">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            {!editingSensor && (
                                <div>
                                    <label className="text-[12px] font-medium text-text-secondary mb-1.5 block">{t('sensors.bin')}</label>
                                    <select value={form.binId} onChange={(e) => setForm({ ...form, binId: e.target.value })}
                                        className="w-full px-3 py-2.5 bg-input-bg rounded-lg border border-border focus:border-cyan-500 outline-none text-sm text-text-primary transition-all">
                                        {(bins as Array<{ id: string; name: string; code: string }>)?.map((b) => (
                                            <option key={b.id} value={b.id} className="bg-input-bg">{b.name} ({b.code})</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div>
                                <label className="text-[12px] font-medium text-text-secondary mb-1.5 block">{t('common.type')}</label>
                                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value, model: modelByType[e.target.value] ?? 'HC-SR04' })}
                                    className="w-full px-3 py-2.5 bg-input-bg rounded-lg border border-border focus:border-cyan-500 outline-none text-sm text-text-primary transition-all">
                                    {sensorTypes.map((t) => (
                                        <option key={t} value={t} className="bg-input-bg">{t}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-[12px] font-medium text-text-secondary mb-1.5 block">{t('sensors.model')}</label>
                                <input type="text" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })}
                                    className="w-full px-3 py-2.5 bg-input-bg rounded-lg border border-border focus:border-cyan-500 outline-none text-sm text-text-primary placeholder:text-text-muted transition-all" />
                            </div>
                            <div>
                                <label className="text-[12px] font-medium text-text-secondary mb-1.5 block">{t('common.status')}</label>
                                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                                    className="w-full px-3 py-2.5 bg-input-bg rounded-lg border border-border focus:border-cyan-500 outline-none text-sm text-text-primary transition-all">
                                    <option value="ACTIVE" className="bg-input-bg">{t('sensors.statusActive')}</option>
                                    <option value="INACTIVE" className="bg-input-bg">{t('sensors.statusInactive')}</option>
                                </select>
                            </div>
                            <button onClick={saveSensor}
                                className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-700 text-text-primary text-sm font-semibold rounded-xl transition-colors">
                                {editingSensor ? t('common.save') : t('common.add')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Message vide */}
            {paginated.length === 0 && (
                <div className="text-center py-16">
                    <Radio className="w-12 h-12 text-text-muted mx-auto mb-4" />
                    <p className="text-text-secondary text-sm">{t('sensors.noSensors')}</p>
                    <p className="text-text-muted text-xs mt-1">{t('sensors.noSensorsHint')}</p>
                </div>
            )}
        </div>
    )
}

SensorsPage.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>
export default SensorsPage
