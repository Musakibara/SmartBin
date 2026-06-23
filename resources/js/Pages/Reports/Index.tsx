import { useState } from 'react'
import { FileText, Search, ChevronLeft, ChevronRight, Download, Trash2, Plus, Loader2, AlertCircle, Clock, User, FileDown, Eye, X, FileSpreadsheet, FileBarChart, FileCog, FileWarning } from 'lucide-react'
import AppLayout from '../../Layouts/AppLayout'
import { usePage, router } from '@inertiajs/react'
import { useToast } from '../../Components/Toast'

const typeConfig: Record<string, { label: string; color: string; icon: string; Icon: typeof FileText }> = {
    OPERATIONAL: { label: 'Opérationnel', color: 'blue', icon: '📊', Icon: FileSpreadsheet },
    PERFORMANCE: { label: 'Performance', color: 'emerald', icon: '📈', Icon: FileBarChart },
    STRATEGIC: { label: 'Stratégique', color: 'purple', icon: '🎯', Icon: FileCog },
    ALERT: { label: 'Alertes', color: 'amber', icon: '🔔', Icon: FileWarning },
}

const typeDescriptions: Record<string, string> = {
    OPERATIONAL: 'État des bennes, niveaux et statut des capteurs',
    PERFORMANCE: 'Tendances de remplissage et indicateurs techniques',
    STRATEGIC: 'Synthèse mensuelle alertes, prédictions, performance',
    ALERT: 'Récapitulatif des alertes par sévérité',
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
                notify({ message: 'Rapport généré avec succès', type: 'success' })
            },
            onError: (errors) => {
                setGenerating(false)
                const msgs = typeof errors === 'object' ? Object.values(errors).filter(Boolean).join(', ') : ''
                notify({ message: msgs || 'Erreur lors de la génération', type: 'error' })
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
                notify({ message: 'Rapport supprimé', type: 'info' })
            },
            onError: () => {
                setDeleting(false)
                notify({ message: 'Erreur lors de la suppression', type: 'error' })
            },
        })
    }

    const typeList = ['OPERATIONAL', 'PERFORMANCE', 'STRATEGIC', 'ALERT']

    return (
        <AppLayout title="Rapports">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Rapports</h1>
                        <p className="text-[#94a3b8] text-sm mt-1">
                            {reports.total} rapport{reports.total !== 1 ? 's' : ''} généré{reports.total !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <button
                        onClick={() => setShowGenerate(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40"
                    >
                        <Plus className="w-4 h-4" />
                        Nouveau Rapport
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
                                <span>{cfg.icon}</span>
                                {cfg.label}
                            </button>
                        )
                    })}
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={handleSearchKeyDown}
                            placeholder="Rechercher par nom, type ou description..."
                            className="w-full pl-10 pr-4 py-2.5 bg-[#1E293B] border border-[#334155] rounded-xl text-[#f8fafc] placeholder-[#64748b] text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                        />
                    </div>
                    <select
                        value={typeFilter}
                        onChange={(e) => { setTypeFilter(e.target.value); router.get('/reports', { search, type: e.target.value }, { preserveState: true, replace: true }) }}
                        className="px-4 py-2.5 bg-[#1E293B] border border-[#334155] rounded-xl text-[#f8fafc] text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                    >
                        <option value="Tous">Tous les types</option>
                        {typeList.map((t) => <option key={t} value={t}>{typeConfig[t].label}</option>)}
                    </select>
                </div>

                {/* List */}
                {reports.data.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-[#1E293B] border border-[#334155] flex items-center justify-center">
                            <FileText className="w-7 h-7 text-[#475569]" />
                        </div>
                        <p className="text-[#94a3b8] text-sm mb-1">Aucun rapport trouvé</p>
                        <p className="text-[#64748b] text-xs mb-5">Générez votre premier rapport pour commencer</p>
                        <button
                            onClick={() => setShowGenerate(true)}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-emerald-500/20"
                        >
                            <Plus className="w-4 h-4" />
                            Générer un rapport
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                        {reports.data.map((report) => {
                            const cfg = typeConfig[report.type]

                            return (
                                <div
                                    key={report.id}
                                    className="group bg-[#1E293B]/70 backdrop-blur-sm border border-[#334155] rounded-xl p-6 hover:border-emerald-500/30 hover:shadow-[0_0_20px_-8px_rgba(16,185,129,0.15)] transition-all duration-300"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`w-12 h-12 rounded-xl ${iconBg[cfg.color]} flex items-center justify-center shrink-0`}>
                                            <span className="text-xl">{cfg.icon}</span>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full border uppercase tracking-wider ${badgeColors[cfg.color]}`}>
                                                    {cfg.label}
                                                </span>
                                                {report.fileSize && (
                                                    <span className="text-[#64748b] text-xs">{report.fileSize}</span>
                                                )}
                                            </div>
                                            <h3 className="text-[#f8fafc] text-base font-semibold truncate leading-snug">
                                                {report.name}
                                            </h3>
                                            <p className="text-[#64748b] text-xs mt-1.5 line-clamp-2 leading-relaxed">
                                                {report.summary}
                                            </p>
                                            <div className="flex items-center gap-3 mt-3 text-[11px] text-[#475569]">
                                                <span className="flex items-center gap-1">
                                                    <User className="w-3.5 h-3.5" />
                                                    {report.generatedBy}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {report.createdAt}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 mt-4 pt-3.5 border-t border-[#334155]">
                                        {report.viewUrl && (
                                            <button
                                                onClick={() => handleView(report.viewUrl!)}
                                                title="Consulter"
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-xs font-semibold transition-all"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                                Consulter
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDownload(report.id)}
                                            disabled={!report.file_path}
                                            title="Télécharger"
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                                report.file_path
                                                    ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                                                    : 'bg-[#1E293B] text-[#475569] cursor-not-allowed'
                                            }`}
                                        >
                                            <Download className="w-3.5 h-3.5" />
                                            Télécharger
                                        </button>
                                        <div className="flex-1" />
                                        <button
                                            onClick={() => confirmDelete(report.id, report.name)}
                                            title="Supprimer"
                                            className="p-1.5 rounded-lg text-[#475569] group-hover:text-red-400 hover:bg-red-500/20 transition-all opacity-0 group-hover:opacity-100"
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
                    <div className="flex items-center justify-center gap-2 pt-2">
                        <button
                            onClick={() => goToPage(reports.current_page - 1)}
                            disabled={reports.current_page <= 1}
                            className="p-2 rounded-lg bg-[#1E293B] border border-[#334155] text-[#94a3b8] hover:text-white hover:border-[#475569] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        {Array.from({ length: reports.last_page }, (_, i) => i + 1).map((p) => (
                            <button
                                key={p}
                                onClick={() => goToPage(p)}
                                className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                                    p === reports.current_page
                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                        : 'bg-[#1E293B] border border-[#334155] text-[#94a3b8] hover:text-white hover:border-[#475569]'
                                }`}
                            >
                                {p}
                            </button>
                        ))}
                        <button
                            onClick={() => goToPage(reports.current_page + 1)}
                            disabled={reports.current_page >= reports.last_page}
                            className="p-2 rounded-lg bg-[#1E293B] border border-[#334155] text-[#94a3b8] hover:text-white hover:border-[#475569] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>

            {/* Generate Modal */}
            {showGenerate && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => !generating && setShowGenerate(false)}>
                    <div className="w-full max-w-md bg-[#0F172A] border border-[#334155] rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                                    <FileDown className="w-5 h-5 text-emerald-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white">Nouveau Rapport</h2>
                                    <p className="text-[#94a3b8] text-sm">Choisissez le type à générer</p>
                                </div>
                            </div>
                            {!generating && (
                                <button onClick={() => setShowGenerate(false)} className="p-1.5 rounded-lg hover:bg-white/5 text-[#475569] hover:text-white transition-all">
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
                                        className={`w-full flex items-center gap-4 p-3.5 rounded-xl border transition-all ${
                                            selected
                                                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 shadow-[0_0_12px_-4px_rgba(16,185,129,0.2)]'
                                                : 'bg-[#1E293B] border-[#334155] text-[#94a3b8] hover:border-[#475569] hover:text-white'
                                        }`}
                                    >
                                        <span className={`w-9 h-9 rounded-lg flex items-center justify-center text-base ${selected ? iconBg[cfg.color] : 'bg-[#0F172A]'}`}>
                                            {cfg.icon}
                                        </span>
                                        <div className="text-left">
                                            <p className="text-sm font-semibold">{cfg.label}</p>
                                            <p className="text-xs opacity-70">{typeDescriptions[type]}</p>
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
                                className="flex-1 px-4 py-2.5 rounded-xl border border-[#334155] text-[#94a3b8] hover:text-white hover:border-[#475569] font-medium text-sm transition-all disabled:opacity-50"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleGenerate}
                                disabled={generating}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold text-sm transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20"
                            >
                                {generating ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Génération en cours...</>
                                ) : (
                                    <><FileDown className="w-4 h-4" /> Générer</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Preview Modal */}
            {previewUrl && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setPreviewUrl(null)}>
                    <div className="w-full max-w-4xl h-[85vh] bg-[#0F172A] border border-[#334155] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-5 py-3 border-b border-[#334155]">
                            <h3 className="text-sm font-semibold text-white">Aperçu du rapport</h3>
                            <button onClick={() => setPreviewUrl(null)} className="p-1.5 rounded-lg hover:bg-white/5 text-[#475569] hover:text-white transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <iframe src={previewUrl} className="flex-1 w-full bg-white rounded-b-2xl" title="Aperçu du rapport" />
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteTarget && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => !deleting && setDeleteTarget(null)}>
                    <div className="w-full max-w-sm bg-[#0F172A] border border-[#334155] rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center">
                                <AlertCircle className="w-5 h-5 text-red-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">Supprimer le rapport</h2>
                                <p className="text-[#94a3b8] text-sm">Cette action est irréversible</p>
                            </div>
                        </div>
                        <p className="text-[#94a3b8] text-sm mb-6">
                            Êtes-vous sûr de vouloir supprimer <span className="text-white font-semibold">{deleteTarget.name}</span> ?
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                disabled={deleting}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-[#334155] text-[#94a3b8] hover:text-white hover:border-[#475569] font-medium text-sm transition-all disabled:opacity-50"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
                            >
                                {deleting ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Suppression...</>
                                ) : (
                                    <><Trash2 className="w-4 h-4" /> Supprimer</>
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
