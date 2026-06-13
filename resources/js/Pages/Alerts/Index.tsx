import { useState, useMemo } from 'react'
import { Search, AlertTriangle, CheckCircle, Clock, Filter, ChevronLeft, ChevronRight, ArrowUpDown, Trash2, Bell, Activity, X } from 'lucide-react'
import AppLayout from '../../Layouts/AppLayout'
import StatusBadge from '../../Components/StatusBadge'
import { useToast } from '../../Components/Toast'
import { alerts, bins } from '../../data/mock-dashboard'
import type { Alert } from '../../data/mock-dashboard'

const severityColors: Record<string, string> = {
    critical: 'bg-red-500/20 text-red-400 border-red-500/30',
    high: 'bg-orange-500/15 text-orange-400 border-orange-400/25',
    medium: 'bg-amber-500/15 text-amber-400 border-amber-400/25',
    low: 'bg-blue-500/15 text-blue-400 border-blue-400/25',
}
const severityDots: Record<string, string> = {
    critical: 'bg-red-500 shadow-red-500/50',
    high: 'bg-orange-400 shadow-orange-400/50',
    medium: 'bg-amber-400 shadow-amber-400/50',
    low: 'bg-blue-400 shadow-blue-400/50',
}

function AlertsPage() {
    const { notify } = useToast()
    const [search, setSearch] = useState('')
    const [sevFilter, setSevFilter] = useState('Toutes')
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'resolved'>('all')
    const [sortAsc, setSortAsc] = useState(false)
    const [page, setPage] = useState(1)
    const [localAlerts, setLocalAlerts] = useState(alerts)
    const perPage = 8

    const severities = ['Toutes', 'critical', 'high', 'medium', 'low']

    const filtered = useMemo(() => {
        const f = localAlerts.filter((a) => {
            const bin = bins.find((b) => b.id === a.bin)
            const matchSearch = a.id.toLowerCase().includes(search.toLowerCase()) || a.message.toLowerCase().includes(search.toLowerCase()) || (bin?.name.toLowerCase().includes(search.toLowerCase()) ?? false)
            const matchSev = sevFilter === 'Toutes' || a.severity === sevFilter
            const matchStatus = statusFilter === 'all' || a.status === statusFilter
            return matchSearch && matchSev && matchStatus
        })
        return f.sort((a, b) => {
            const sevOrder = { critical: 0, high: 1, medium: 2, low: 3 }
            return sortAsc ? sevOrder[a.severity] - sevOrder[b.severity] : sevOrder[b.severity] - sevOrder[a.severity]
        })
    }, [search, sevFilter, statusFilter, sortAsc, localAlerts])

    const totalPages = Math.ceil(filtered.length / perPage)
    const paginated = filtered.slice((page - 1) * perPage, page * perPage)

    const pendingCount = localAlerts.filter((a) => a.status === 'pending').length

    function resolveAlert(id: string) {
        setLocalAlerts((prev) => prev.map((a) => a.id === id ? { ...a, status: 'resolved' } : a))
        notify({ message: `Alerte ${id} résolue`, type: 'success' })
    }

    function deleteAlert(id: string) {
        setLocalAlerts((prev) => prev.filter((a) => a.id !== id))
        notify({ message: `Alerte ${id} supprimée`, type: 'info' })
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-white">Alertes</h1>
                        {pendingCount > 0 && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">{pendingCount} en attente</span>
                        )}
                    </div>
                    <p className="text-sm text-gray-400 mt-1">{localAlerts.length} alertes · {localAlerts.filter((a) => a.status === 'resolved').length} résolues</p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Rechercher par ID, message ou benne..." className="w-full pl-10 pr-4 py-2.5 bg-[#1E293B]/80 rounded-xl border border-[#334155] focus:border-emerald-500 outline-none text-sm text-white placeholder:text-gray-600 transition-all" />
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1 bg-[#1E293B]/80 rounded-lg p-0.5 overflow-x-auto no-scrollbar">
                        {severities.map((s) => (
                            <button key={s} onClick={() => { setSevFilter(s); setPage(1) }} className={`shrink-0 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${sevFilter === s ? 'bg-emerald-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>{s === 'Toutes' ? 'Toutes' : s}</button>
                        ))}
                    </div>
                    <button onClick={() => setSortAsc(!sortAsc)} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1E293B]/80 rounded-lg text-xs text-gray-500 hover:text-gray-300 transition-all">
                        <ArrowUpDown className="w-3.5 h-3.5" />{sortAsc ? 'Croissant' : 'Décroissant'}
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-2 mb-2 flex-wrap">
                {['all', 'pending', 'resolved'].map((s) => (
                    <button key={s} onClick={() => { setStatusFilter(s as typeof statusFilter); setPage(1) }} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${statusFilter === s ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' : 'text-gray-500 hover:text-gray-300 border border-transparent'}`}>
                        {s === 'all' ? 'Toutes' : s === 'pending' ? 'En attente' : 'Résolues'}
                    </button>
                ))}
            </div>

            <div className="space-y-2">
                {paginated.length === 0 ? (
                    <div className="glass rounded-xl p-10 text-center">
                        <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                        <p className="text-sm font-semibold text-white">Aucune alerte</p>
                        <p className="text-xs text-gray-500 mt-1">Tout est sous contrôle</p>
                    </div>
                ) : paginated.map((a) => {
                    const bin = bins.find((b) => b.id === a.bin)
                    return (
                        <div key={a.id} className={`glass rounded-xl p-4 transition-all ${a.status === 'pending' ? 'border-l-4 border-l-red-500' : 'opacity-60'}`}>
                            <div className="flex items-start gap-4">
                                <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shadow-lg shrink-0 ${severityDots[a.severity]} ${a.status === 'pending' ? 'animate-pulse' : ''}`} />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-xs font-bold text-white">{a.message}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${severityColors[a.severity]}`}>{a.severity}</span>
                                                {bin && <span className="text-xs text-gray-500">{bin.name} · {bin.location}</span>}
                                                <span className="text-[10px] text-gray-600 flex items-center gap-1 ml-auto"><Clock className="w-3 h-3" />{a.time}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            {a.status === 'pending' && (
                                                <button onClick={() => resolveAlert(a.id)} className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all" title="Résoudre">
                                                    <CheckCircle className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                            <button onClick={() => deleteAlert(a.id)} className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all" title="Supprimer">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 overflow-x-auto no-scrollbar">
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg bg-[#1E293B]/80 text-gray-500 hover:text-white disabled:opacity-30 transition-all shrink-0"><ChevronLeft className="w-4 h-4" /></button>
                    {Array.from({ length: totalPages }, (_, i) => (
                        <button key={i} onClick={() => setPage(i + 1)} className={`w-8 h-8 rounded-lg text-xs font-bold transition-all shrink-0 ${page === i + 1 ? 'bg-emerald-600 text-white shadow-lg' : 'bg-[#1E293B]/80 text-gray-500 hover:text-white'}`}>{i + 1}</button>
                    ))}
                    <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg bg-[#1E293B]/80 text-gray-500 hover:text-white disabled:opacity-30 transition-all shrink-0"><ChevronRight className="w-4 h-4" /></button>
                </div>
            )}
        </div>
    )
}

AlertsPage.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>
export default AlertsPage
