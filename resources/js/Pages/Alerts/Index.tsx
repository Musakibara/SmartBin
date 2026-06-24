import { useState } from 'react'
import { Search, CheckCircle, Clock, ChevronLeft, ChevronRight, ArrowUpDown, Trash2 } from 'lucide-react'
import { usePage, router } from '@inertiajs/react'
import AppLayout from '../../Layouts/AppLayout'
import { useToast } from '../../Components/Toast'
import { useTranslation } from 'react-i18next'

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

type AlertItem = {
    id: string
    bin: string
    binName: string
    message: string
    severity: 'critical' | 'high' | 'medium' | 'low'
    status: 'pending' | 'resolved'
    time: string
    resolvedBy: string | null
    resolvedAt: string | null
}

type AlertPaginator = {
    data: AlertItem[]
    current_page: number
    last_page: number
    per_page: number
    total: number
    from: number | null
    to: number | null
}

type PageProps = {
    alerts: AlertPaginator
    filters: { search?: string; severity?: string; status?: string; sort?: string; dir?: string }
}

function AlertsPage() {
    const { t } = useTranslation()
    const { notify } = useToast()
    const { alerts, filters } = usePage<PageProps>().props
    const userRole = (usePage().props as { auth?: { user?: { role?: string } } })?.auth?.user?.role

    const [search, setSearch] = useState(filters.search ?? '')
    const [sevFilter, setSevFilter] = useState(filters.severity ?? 'Toutes')
    const [statusFilter, setStatusFilter] = useState(filters.status ?? 'all')
    const [sortAsc, setSortAsc] = useState(filters.dir === 'asc')

    const severities = ['Toutes', 'critical', 'high', 'medium', 'low']
    const { data, total, last_page, current_page } = alerts
    const pendingCount = data.filter((a) => a.status === 'pending').length

    function navigate(field: string, value: string) {
        const params: Record<string, string> = {}

        const nextSearch = field === 'search' ? value : search
        const nextSev = field === 'severity' ? value : sevFilter
        const nextStatus = field === 'status' ? value : statusFilter
        const nextDir = field === 'sort' ? (sortAsc ? 'desc' : 'asc') : sortAsc ? 'asc' : 'desc'

        if (field === 'search') setSearch(value)
        else if (field === 'severity') setSevFilter(value)
        else if (field === 'status') setStatusFilter(value)
        else if (field === 'sort') { params.sort = 'severity'; setSortAsc(!sortAsc) }

        if (nextSearch) params.search = nextSearch
        if (nextSev !== 'Toutes') params.severity = nextSev
        if (nextStatus !== 'all') params.status = nextStatus
        params.dir = nextDir

        router.get('/alerts', params, { preserveScroll: true, preserveState: true, replace: true })
    }

    function goPage(page: number) {
        const params: Record<string, string> = { page: String(page) }
        if (search) params.search = search
        if (sevFilter !== 'Toutes') params.severity = sevFilter
        if (statusFilter !== 'all') params.status = statusFilter
        params.dir = sortAsc ? 'asc' : 'desc'
        router.get('/alerts', params, { preserveScroll: true, preserveState: true, replace: true })
    }

    function resolveAlert(id: string) {
        router.patch(`/alerts/${id}`, {}, {
            preserveScroll: true,
            onSuccess: () => notify({ message: t('alerts.toastResolved', { id }), type: 'success' }),
        })
    }

    function deleteAlert(id: string) {
        router.delete(`/alerts/${id}`, {
            preserveScroll: true,
            onSuccess: () => notify({ message: t('alerts.toastDeleted', { id }), type: 'info' }),
        })
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-text-primary">{t('alerts.title')}</h1>
                        {pendingCount > 0 && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">{t('alerts.pendingCount', { count: pendingCount })}</span>
                        )}
                    </div>
                    <p className="text-sm text-text-secondary mt-1">{t('alerts.totalCount', { count: total })}</p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                        value={search}
                        onChange={(e) => navigate('search', e.target.value)}
                        placeholder={t('alerts.search')}
                        className="w-full pl-10 pr-4 py-2.5 bg-input-bg rounded-xl border border-border focus:border-emerald-500 outline-none text-sm text-text-primary placeholder:text-text-muted transition-all"
                    />
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1 bg-input-bg rounded-lg p-0.5 overflow-x-auto no-scrollbar">
                        {severities.map((s) => (
                            <button
                                key={s}
                                onClick={() => navigate('severity', s)}
                                className={`shrink-0 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${sevFilter === s ? 'bg-emerald-600 text-white shadow-lg' : 'text-text-muted hover:text-text-primary'}`}
                            >{s === 'Toutes' ? t('alerts.filterAll') : t(`alerts.severity${s.charAt(0).toUpperCase() + s.slice(1)}`)}</button>
                        ))}
                    </div>
                    <button onClick={() => navigate('sort', 'severity')} className="flex items-center gap-1.5 px-3 py-1.5 bg-input-bg rounded-lg text-xs text-text-muted hover:text-text-primary transition-all">
                        <ArrowUpDown className="w-3.5 h-3.5" />{sortAsc ? t('alerts.sortAsc') : t('alerts.sortDesc')}
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-2 mb-2 flex-wrap">
                {(['all', 'pending', 'resolved'] as const).map((s) => (
                    <button
                        key={s}
                        onClick={() => navigate('status', s)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${statusFilter === s ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' : 'text-text-muted hover:text-text-primary border border-transparent'}`}
                    >{s === 'all' ? t('alerts.filterAll') : s === 'pending' ? t('alerts.filterPending') : t('alerts.filterResolved')}</button>
                ))}
            </div>

            <div className="space-y-2">
                {data.length === 0 ? (
                    <div className="glass rounded-xl p-10 text-center">
                        <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                        <p className="text-sm font-semibold text-text-primary">{t('alerts.noAlerts')}</p>
                        <p className="text-xs text-text-muted mt-1">{t('alerts.allClear')}</p>
                    </div>
                ) : data.map((a) => (
                    <div key={a.id} className={`glass rounded-xl p-4 transition-all ${a.status === 'pending' ? 'border-l-4 border-l-red-500' : 'opacity-60'}`}>
                        <div className="flex items-start gap-4">
                            <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shadow-lg shrink-0 ${severityDots[a.severity]} ${a.status === 'pending' ? 'animate-pulse' : ''}`} />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-xs font-bold text-text-primary">{a.message}</p>
                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                            <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${severityColors[a.severity]}`}>{t(`alerts.severity${a.severity.charAt(0).toUpperCase() + a.severity.slice(1)}`)}</span>
                                            {a.binName && <span className="text-xs text-text-muted">{a.bin} · {a.binName}</span>}
                                            <span className="text-[10px] text-text-muted flex items-center gap-1"><Clock className="w-3 h-3" />{a.time}</span>
                                            {a.status === 'resolved' && (
                                                <span className="text-[10px] text-text-muted flex items-center gap-1 flex-wrap">
                                                    <span className="w-1 h-1 rounded-full bg-emerald-500 shrink-0" />
                                                    {t('alerts.resolved')}
                                                    {a.resolvedBy && <span>{t('alerts.by')} {a.resolvedBy}</span>}
                                                    {a.resolvedAt && <span>· {a.resolvedAt}</span>}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        {a.status === 'pending' && (
                                            <button onClick={() => resolveAlert(a.id)} className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all" title={t('alerts.resolve')}>
                                                <CheckCircle className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                        {(userRole === 'ADMIN' || userRole === 'SUPERVISEUR') && (
                                            <button onClick={() => deleteAlert(a.id)} className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all" title={t('common.delete')}>
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {last_page > 1 && (
                <div className="flex items-center justify-center gap-2 overflow-x-auto no-scrollbar">
                    <button onClick={() => goPage(current_page - 1)} disabled={current_page === 1} className="p-2 rounded-lg bg-input-bg text-text-muted hover:text-text-primary disabled:opacity-30 transition-all shrink-0">
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    {Array.from({ length: last_page }, (_, i) => (
                        <button key={i} onClick={() => goPage(i + 1)} className={`w-8 h-8 rounded-lg text-xs font-bold transition-all shrink-0 ${current_page === i + 1 ? 'bg-emerald-600 text-white shadow-lg' : 'bg-input-bg text-text-muted hover:text-text-primary'}`}>
                            {i + 1}
                        </button>
                    ))}
                    <button onClick={() => goPage(current_page + 1)} disabled={current_page === last_page} className="p-2 rounded-lg bg-input-bg text-text-muted hover:text-text-primary disabled:opacity-30 transition-all shrink-0">
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    )
}

AlertsPage.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>
export default AlertsPage
