import { useState } from 'react'
import { FileText, Search, ChevronLeft, ChevronRight, Download, Trash2, Plus, Loader2, AlertCircle, Clock, User, FileDown, Eye, X, FileSpreadsheet, FileBarChart, FileCog, FileWarning } from 'lucide-react'
import AppLayout from '../../Layouts/AppLayout'
import { usePage, router } from '@inertiajs/react'
import { useTranslation } from 'react-i18next'
import { useToast } from '../../Components/Toast'

const typeConfig: Record<string, { labelKey: string; color: string; icon: string; Icon: typeof FileText }> = {
    OPERATIONAL: { labelKey: 'reports.typeOperational', color: 'blue', icon: '📊', Icon: FileSpreadsheet },
    PERFORMANCE: { labelKey: 'reports.typePerformance', color: 'emerald', icon: '📈', Icon: FileBarChart },
    STRATEGIC: { labelKey: 'reports.typeStrategic', color: 'purple', icon: '🎯', Icon: FileCog },
    ALERT: { labelKey: 'reports.typeAlert', color: 'amber', icon: '🔔', Icon: FileWarning },
}

const typeDescriptionKeys: Record<string, string> = {
    OPERATIONAL: 'reports.descOperational',
    PERFORMANCE: 'reports.descPerformance',
    STRATEGIC: 'reports.descStrategic',
    ALERT: 'reports.descAlert',
}

const btnColors: Record<string, string> = {
    blue: 'bg-blue-500/15 text-blue-400 border-blue-500/30 hover:bg-blue-500/25',
    emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25',
    purple: 'bg-purple-500/15 text-purple-400 border-purple-500/30 hover:bg-purple-500/25',
    amber: 'bg-amber-500/15 text-amber-400 border-amber-400/25 hover:bg-amber-500/25',
}

const badgeColors: Record<string, string> = {
    blue: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    purple: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    amber: 'bg-amber-500/15 text-amber-400 border-amber-400/25',
}

const iconBg: Record<string, string> = {
    blue: 'bg-blue-500/10',
    emerald: 'bg-emerald-500/10',
    purple: 'bg-purple-500/10',
    amber: 'bg-amber-500/10',
}

function ReportsPage() {
    const { t } = useTranslation()
    const { reports, filters: initialFilters } = usePage().props as unknown as {
        reports: {
            data: Array<{
                id: string; name: string; type: string; summary: string
                period_start: string; period_end: string
                file_path: string | null; viewUrl: string | null; generatedBy: string
                createdAt: string; fileSize: string | null
            }>
            current_page: number; last_page: number; total: number
        }
        filters: { search?: string; type?: string }
    }

    const { notify } = useToast()

    const [search, setSearch] = useState(initialFilters.search ?? '')
    const [typeFilter, setTypeFilter] = useState(initialFilters.type ?? 'Tous')
    const [showGenerate, setShowGenerate] = useState(false)
    const [generating, setGenerating] = useState(false)
    const [generateType, setGenerateType] = useState('OPERATIONAL')
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
    const [deleting, setDeleting] = useState(false)

    function applyFilters() {
        router.get('/reports', { search, type: typeFilter }, { preserveState: true, replace: true })
    }

    function handleSearchKeyDown(e: React.KeyboardEvent) {
        if (e.key === 'Enter') applyFilters()
    }

    function goToPage(page: number) {
        router.get('/reports', { search, type: typeFilter, page }, { preserveState: true, replace: true })
    }

    function handleGenerate() {
        setGenerating(true)
        router.post('/reports', { type: generateType }, {
            onSuccess: () => {
                setShowGenerate(false)
                setGenerating(false)
                notify({ message: t('reports.toastGenerated'), type: 'success' })
            },
            onError: (errors) => {
                setGenerating(false)
                const msgs = typeof errors === 'object' ? Object.values(errors).filter(Boolean).join(', ') : ''
                notify({ message: msgs || t('reports.toastGenerateError'), type: 'error' })
            },
        })
    }

    function handleView(url: string) {
        setPreviewUrl(url)
    }

    function handleDownload(id: string) {
        router.get(`/reports/${id}/download`)
    }

    function confirmDelete(id: string, name: string) {
        setDeleteTarget({ id, name })
    }

    function handleDelete() {
        if (!deleteTarget) return
        setDeleting(true)
        router.delete(`/reports/${deleteTarget.id}`, {
            preserveState: true,
            onSuccess: () => {
                setDeleteTarget(null)
                setDeleting(false)
                notify({ message: t('reports.toastDeleted'), type: 'info' })
            },
            onError: () => {
                setDeleting(false)
                notify({ message: t('reports.toastDeleteError'), type: 'error' })
            },
        })
    }

    const typeList = ['OPERATIONAL', 'PERFORMANCE', 'STRATEGIC', 'ALERT']

    return (
                <AppLayout>
            <div className="space-y-6 overflow-hidden">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                            <h1 className="text-2xl font-bold text-text-primary">{t('reports.title')}</h1>
                            <p className="text-text-secondary text-sm mt-1">
                                {t('reports.count', { count: reports.total })}
                            </p>
                        </div>
                        <button
                            onClick={() => setShowGenerate(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-text-primary rounded-xl font-semibold text-sm transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40"
                        >
                            <Plus className="w-4 h-4" />
                            {t('reports.add')}
                        </button>
                </div>

                {/* Quick actions */}
                <div className="flex flex-wrap gap-2">
                    {typeList.map((type) => {
                        const cfg = typeConfig[type]
                        const active = generateType === type
                        return (
                            <button
                                key={type}
                                onClick={() => { setGenerateType(type); setShowGenerate(true) }}
                                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all ${
                                    badgeColors[cfg.color]
                                }`}
                            >
                                                    <span className="hidden sm:inline">{cfg.icon}</span>
                                {t(cfg.labelKey)}
                            </button>
                        )
                    })}
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={handleSearchKeyDown}
                            placeholder={t('reports.search')}
                            className="w-full pl-10 pr-4 py-2.5 bg-input-bg border border-border rounded-xl text-text-primary placeholder-text-muted text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                        />
                    </div>
                    <select
                        value={typeFilter}
                        onChange={(e) => { setTypeFilter(e.target.value); router.get('/reports', { search, type: e.target.value }, { preserveState: true, replace: true }) }}
                        className="px-4 py-2.5 bg-input-bg border border-border rounded-xl text-text-primary text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                    >
                        <option value="Tous">{t('reports.filterAll')}</option>
                        {typeList.map((type) => <option key={type} value={type}>{t(typeConfig[type].labelKey)}</option>)}
                    </select>
                </div>

                {/* List */}
                {reports.data.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-bg-card border border-border flex items-center justify-center">
                            <FileText className="w-7 h-7 text-text-muted" />
                        </div>
                        <p className="text-text-secondary text-sm mb-1">{t('reports.noReports')}</p>
                        <p className="text-text-muted text-xs mb-5">{t('reports.noReportsHint')}</p>
                        <button
                            onClick={() => setShowGenerate(true)}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-text-primary rounded-xl font-semibold text-sm transition-all shadow-lg shadow-emerald-500/20"
                        >
                            <Plus className="w-4 h-4" />
                            {t('reports.generate')}
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                        {reports.data.map((report) => {
                            const cfg = typeConfig[report.type]

                            return (
                                <div
                                    key={report.id}
                                    className="group bg-bg-card/70 backdrop-blur-sm border border-border rounded-xl p-2.5 sm:p-5 lg:p-6 hover:border-emerald-500/30 hover:shadow-[0_0_20px_-8px_rgba(16,185,129,0.15)] transition-all duration-300 w-full"
                                >
                                    <div className="flex items-start gap-2 sm:gap-3 lg:gap-4">
                                        <div className={`w-7 h-7 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-xl ${iconBg[cfg.color]} flex items-center justify-center shrink-0`}>
                                            <span className="text-xs sm:text-lg lg:text-xl">{cfg.icon}</span>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`px-2 py-0.5 text-[10px] sm:text-[11px] font-bold rounded-full border uppercase tracking-wider ${badgeColors[cfg.color]}`}>
                                                    {t(cfg.labelKey)}
                                                </span>
                                                {report.fileSize && (
                                                    <span className="text-text-muted text-xs">{report.fileSize}</span>
                                                )}
                                            </div>
                                            <h3 className="text-text-primary text-sm sm:text-base font-semibold leading-snug break-words">
                                                {report.name}
                                            </h3>
                                            <p className="text-text-muted text-xs mt-1 leading-relaxed break-words line-clamp-2 sm:line-clamp-2">
                                                {report.summary}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1.5 sm:mt-2.5 text-[10px] sm:text-[11px] text-text-muted">
                                                <span className="flex items-center gap-1 truncate">
                                                    <User className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                                                    <span className="truncate">{report.generatedBy}</span>
                                                </span>
                                                <span className="shrink-0">·</span>
                                                <span className="flex items-center gap-1 shrink-0">
                                                    <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                                    {report.createdAt}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 mt-2 pt-2 sm:mt-3 sm:pt-3 border-t border-border">
                                        {report.viewUrl && (
                                            <button
                                                onClick={() => handleView(report.viewUrl!)}
                                                title={t('reports.view')}
                                                className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-[11px] font-semibold transition-all"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDownload(report.id)}
                                            disabled={!report.file_path}
                                            title={t('reports.download')}
                                            className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                                                report.file_path
                                                    ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                                                    : 'bg-bg-card text-text-muted cursor-not-allowed'
                                            }`}
                                        >
                                            <Download className="w-3.5 h-3.5" />
                                        </button>
                                        <div className="flex-1" />
                                        <button
                                            onClick={() => confirmDelete(report.id, report.name)}
                                            title={t('common.delete')}
                                            className="p-1.5 rounded-lg text-red-400/70 sm:text-text-muted hover:text-red-400 hover:bg-red-500/20 transition-all"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* Pagination */}
                {reports.last_page > 1 && (
                                    <div className="flex items-center justify-center gap-1.5 sm:gap-2 pt-2 overflow-x-auto">
                                        <button
                                            onClick={() => goToPage(reports.current_page - 1)}
                                            disabled={reports.current_page <= 1}
                                            className="p-2 rounded-lg bg-bg-card border border-border text-text-secondary hover:text-text-primary hover:border-[#475569] disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        {Array.from({ length: Math.min(reports.last_page, 7) }, (_, i) => {
                                            const start = Math.max(1, Math.min(reports.current_page - 3, reports.last_page - 6))
                                            const page = start + i
                                            return (
                                                <button
                                                    key={page}
                                                    onClick={() => goToPage(page)}
                                                    className={`w-8 sm:w-9 h-8 sm:h-9 rounded-lg text-xs sm:text-sm font-medium transition-all shrink-0 ${
                                                        page === reports.current_page
                                                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                                            : 'bg-bg-card border border-border text-text-secondary hover:text-text-primary hover:border-[#475569]'
                                                    }`}
                                                >
                                                    {page}
                                                </button>
                                            )
                                        })}
                                        {reports.last_page > 7 && (
                                            <span className="text-text-muted text-xs shrink-0">...</span>
                                        )}
                                        <button
                                            onClick={() => goToPage(reports.current_page + 1)}
                                            disabled={reports.current_page >= reports.last_page}
                                            className="p-2 rounded-lg bg-bg-card border border-border text-text-secondary hover:text-text-primary hover:border-[#475569] disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                )}
            </div>

            {/* Generate Modal */}
            {showGenerate && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => !generating && setShowGenerate(false)}>
                    <div className="w-full max-w-md bg-bg-secondary border border-border rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                                    <FileDown className="w-5 h-5 text-emerald-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-text-primary">{t('reports.add')}</h2>
                                    <p className="text-text-secondary text-sm">{t('reports.generateSubtitle')}</p>
                                </div>
                            </div>
                            {!generating && (
                                <button onClick={() => setShowGenerate(false)} className="p-1.5 rounded-lg hover:bg-white/5 text-text-muted hover:text-text-primary transition-all">
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </div>

                        <div className="space-y-2 mb-6">
                            {typeList.map((type) => {
                                const cfg = typeConfig[type]
                                const selected = generateType === type
                                return (
                                    <button
                                        key={type}
                                        onClick={() => setGenerateType(type)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                                            selected
                                                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 shadow-[0_0_12px_-4px_rgba(16,185,129,0.2)]'
                                                : 'bg-bg-card border-border text-text-secondary hover:border-[#475569] hover:text-text-primary'
                                        }`}
                                    >
                                        <span className={`w-9 h-9 rounded-lg flex items-center justify-center text-base ${selected ? iconBg[cfg.color] : 'bg-bg-secondary'}`}>
                                            {cfg.icon}
                                        </span>
                                        <div className="text-left">
                                            <p className="text-sm font-semibold">{t(cfg.labelKey)}</p>
                                            <p className="text-xs opacity-70">{t(typeDescriptionKeys[type])}</p>
                                        </div>
                                        {selected && (
                                            <div className="ml-auto w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                                            </div>
                                        )}
                                    </button>
                                )
                            })}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowGenerate(false)}
                                disabled={generating}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-border text-text-secondary hover:text-text-primary hover:border-[#475569] font-medium text-sm transition-all disabled:opacity-50"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={handleGenerate}
                                disabled={generating}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-text-primary rounded-xl font-semibold text-sm transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20"
                            >
                                {generating ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> {t('reports.generating')}</>
                                ) : (
                                    <><FileDown className="w-4 h-4" /> {t('reports.generateAction')}</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Preview Modal */}
            {previewUrl && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setPreviewUrl(null)}>
                    <div className="w-full max-w-4xl h-[85vh] bg-bg-secondary border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                            <h3 className="text-sm font-semibold text-text-primary">{t('reports.previewTitle')}</h3>
                            <button onClick={() => setPreviewUrl(null)} className="p-1.5 rounded-lg hover:bg-white/5 text-text-muted hover:text-text-primary transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <iframe src={previewUrl} className="flex-1 w-full bg-white rounded-b-2xl" title={t('reports.previewTitle')} />
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteTarget && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => !deleting && setDeleteTarget(null)}>
                    <div className="w-full max-w-sm bg-bg-secondary border border-border rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center">
                                <AlertCircle className="w-5 h-5 text-red-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-text-primary">{t('reports.deleteConfirm')}</h2>
                                <p className="text-text-secondary text-sm">{t('reports.deleteHint')}</p>
                            </div>
                        </div>
                        <p className="text-text-secondary text-sm mb-6">
                            {t('reports.deleteConfirmMessage', { name: deleteTarget.name })}
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                disabled={deleting}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-border text-text-secondary hover:text-text-primary hover:border-[#475569] font-medium text-sm transition-all disabled:opacity-50"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-text-primary rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
                            >
                                {deleting ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> {t('reports.deleting')}</>
                                ) : (
                                    <><Trash2 className="w-4 h-4" /> {t('common.delete')}</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    )
}

export default ReportsPage
