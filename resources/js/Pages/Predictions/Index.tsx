/**
 * Page Prédictions IA — interface React pour visualiser les prédictions
 * de débordement des bennes.
 *
 * Données injectées par PredictionController (via Inertia) :
 *   - predictions : liste paginée (8/page) avec champs formatés
 *   - bins        : liste complète des bennes (pour stats)
 *   - filters     : recherche + filtre priorité
 *   - stats       : total, distribution HIGH/MEDIUM/LOW, confiance moyenne
 *
 * Le bouton "Lancer l'IA" POST /predictions/generate → PredictionService
 * qui appelle le service Python FastAPI sur 127.0.0.1:8001.
 */

import { useEffect, useState, useMemo } from 'react'
import { Brain, AlertTriangle, Search, ChevronLeft, ChevronRight, ArrowUpDown, Target, ShieldCheck, MapPin, RefreshCw, Trash2 } from 'lucide-react'
import AppLayout from '../../Layouts/AppLayout'
import { usePage, router } from '@inertiajs/react'
import { useTranslation, Trans } from 'react-i18next'
import { useToast } from '../../Components/Toast'

// Couleurs des badges de priorité (rouge = HIGH, ambre = MEDIUM, bleu = LOW)
const levelColors: Record<string, string> = {
    high: 'bg-red-500/15 text-red-400 border-red-500/30',
    medium: 'bg-amber-500/15 text-amber-400 border-amber-400/25',
    low: 'bg-blue-500/15 text-blue-400 border-blue-400/25',
}

// Arrière-plans des icônes
const levelBg: Record<string, string> = {
    high: 'bg-red-500/10',
    medium: 'bg-amber-500/10',
    low: 'bg-blue-500/10',
}

// Points de couleur dans la timeline
const levelDot: Record<string, string> = {
    high: 'bg-red-500',
    medium: 'bg-amber-400',
    low: 'bg-blue-400',
}
function PredictionsPage() {
    const { t } = useTranslation()
    // Props Inertia venant du PredictionController
    const { predictions, bins, filters, stats } = usePage().props as unknown as {
        predictions: {
            data: Array<{
                id: string; bin: string; binName: string; binLocation: string
                fillLevel: number; message: string; priority: string
                estimatedHours: number; urgency: number; confidence: number; riskScore: number
            }>
            current_page: number; last_page: number; total: number
        }
        bins: Array<{ id: string; code: string; name: string; location: string; fill_level: number }>
        filters: { search?: string; priority?: string }
        stats: {
            total: number; high: number; medium: number; low: number
            avgConfidence: number; activeFilter: string
        }
    }
    const userRole = (usePage().props as { auth?: { user?: { role?: string } } })?.auth?.user?.role
    const { notify } = useToast()

    // Toast sur flash messages (succès/erreur après génération)
    const flashError = (usePage().props as { error?: string }).error
    const flashSuccess = (usePage().props as { success?: string }).success
    useEffect(() => {
        if (flashError) notify({ message: flashError, type: 'error' })
        if (flashSuccess) notify({ message: flashSuccess, type: 'success' })
    }, [flashError, flashSuccess])

    // Synchronise priorityFilter avec l'URL (back/forward)
    useEffect(() => {
        setPriorityFilter(filters?.priority ?? 'Toutes')
    }, [filters?.priority])

    // État local
    const [search, setSearch] = useState(filters?.search ?? '')
    const [priorityFilter, setPriorityFilter] = useState(filters?.priority ?? 'Toutes')
    const [sortTimeAsc, setSortTimeAsc] = useState(true) // Tri cartes par temps (asc = urgent en premier)
    const [generating, setGenerating] = useState(false) // État du bouton IA
    const [showInfo, setShowInfo] = useState(false)     // Détails techniques
    const [filterLoading, setFilterLoading] = useState(false) // Loading filtre priorité

    // Timeline toujours triée par urgence (temps croissant)
    const timelineItems = useMemo(() => {
        return [...predictions.data].sort((a, b) => a.estimatedHours - b.estimatedHours)
    }, [predictions.data])

    // Cartes triées selon le bouton (client-side seulement)
    const sortedCards = useMemo(() => {
        return [...predictions.data].sort((a, b) => sortTimeAsc ? a.estimatedHours - b.estimatedHours : b.estimatedHours - a.estimatedHours)
    }, [predictions.data, sortTimeAsc])

    return (
        <div className="space-y-6">
            {/* ═══════════ En-tête ═══════════ */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                        <Brain className="w-6 h-6 text-purple-400" />{t('predictions.title')}
                    </h1>
                    <p className="text-sm text-text-secondary mt-1">
                        {t('predictions.pageDesc')}
                    </p>
                </div>
                {/* Bouton "Lancer l'IA" — visible ADMIN, SUPERVISEUR, OPERATEUR */}
                {(userRole === 'ADMIN' || userRole === 'SUPERVISEUR' || userRole === 'OPERATEUR') && (
                    <button
                        onClick={() => { setGenerating(true); router.post('/predictions/generate', {}, { preserveState: true, onFinish: () => setGenerating(false) }); }}
                        disabled={generating}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-text-primary text-sm font-semibold transition-all disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
                        {generating ? t('predictions.generating') : t('predictions.launch')}
                    </button>
                )}
            </div>

            {/* ═══════════ Message explicatif ═══════════ */}
            <div className="glass rounded-xl p-4 bg-gradient-to-r from-purple-500/5 to-transparent border border-purple-500/10">
                <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-purple-500/10 shrink-0"><Brain className="w-5 h-5 text-purple-400" /></div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-text-primary">{t('predictions.howItWorks')}</p>
                        <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                            <Trans i18nKey="predictions.howItWorksDesc" components={{ strong: <strong className="text-purple-400" /> }} />
                            {stats.high > 0 && (
                                <Trans i18nKey="predictions.howItWorksRisk" values={{ count: stats.high }} components={{ strong: <strong className="text-red-400" /> }} />
                            )}
                        </p>
                        <button onClick={() => setShowInfo(!showInfo)} className="text-[10px] text-text-muted hover:text-text-secondary mt-1 underline underline-offset-2">
                            {showInfo ? t('predictions.hideDetails') : t('predictions.showDetails')}
                        </button>
                        {showInfo && (
                            <div className="mt-2 text-[10px] text-text-muted space-y-0.5 pl-2 border-l border-purple-500/30">
                                <p>📊 <strong className="text-text-secondary">{t('predictions.algoLabel')}</strong> {t('predictions.algoValue')}</p>
                                <p>📐 <strong className="text-text-secondary">{t('predictions.equationLabel')}</strong> {t('predictions.equationValue')}</p>
                                <p>📈 <strong className="text-text-secondary">{t('predictions.confidenceLabel')}</strong> {t('predictions.confidenceValue')}</p>
                                <p>⏱️ <strong className="text-text-secondary">{t('predictions.dataLabel')}</strong> {t('predictions.dataValue', { count: 24, total: predictions.total })}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ═══════════ Statistiques ═══════════ */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {/* Carte 1 : Total prédictions + barre de distribution */}
                <div className="glass rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 rounded-xl bg-purple-500/10"><Brain className="w-5 h-5 text-purple-400" /></div>
                        <div>
                            <p className="text-xs text-text-muted">{t('predictions.title')}</p>
                            <p className="text-lg font-bold text-purple-400">{stats.total}</p>
                        </div>
                    </div>
                    {/* Barre de distribution proportionnelle HIGH/MEDIUM/LOW */}
                    {stats.total > 0 && (
                        <div className="flex h-1.5 rounded-full overflow-hidden bg-bg-card">
                            {[
                                { count: stats.high, color: 'bg-red-500', labelKey: 'predictions.urgent' },
                                { count: stats.medium, color: 'bg-amber-400', labelKey: 'predictions.plan' },
                                { count: stats.low, color: 'bg-blue-400', labelKey: 'predictions.routine' },
                            ].map(({ count, color, labelKey }) =>
                                count > 0 && (
                                    <div key={labelKey} className={`${color} h-full transition-all`} style={{ width: `${(count / stats.total) * 100}%` }} title={`${t(labelKey)}: ${count}`} />
                                )
                            )}
                        </div>
                    )}
                    {/* Légende */}
                    <div className="flex items-center gap-3 mt-2 text-[9px] text-text-muted">
                        {[
                            { count: stats.high, color: 'bg-red-500', labelKey: 'predictions.urgent' },
                            { count: stats.medium, color: 'bg-amber-400', labelKey: 'predictions.plan' },
                            { count: stats.low, color: 'bg-blue-400', labelKey: 'predictions.routine' },
                        ].map(({ count, color, labelKey }) => (
                            <span key={labelKey} className="flex items-center gap-1">
                                <span className={`w-1.5 h-1.5 rounded-full ${color}`} />
                                {count} {t(labelKey)}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Cartes 2-4 : Niveaux de priorité — cliquables pour filtrer */}
                {[
                    { key: 'high', labelKey: 'predictions.highPriority', value: stats.high, color: 'text-red-400', icon: AlertTriangle, descKey: 'predictions.highDesc' },
                    { key: 'medium', labelKey: 'predictions.mediumPriority', value: stats.medium, color: 'text-amber-400', icon: AlertTriangle, descKey: 'predictions.mediumDesc' },
                    { key: 'low', labelKey: 'predictions.lowPriority', value: stats.low, color: 'text-blue-400', icon: ShieldCheck, descKey: 'predictions.lowDesc' },
                ].map(({ key, labelKey, value, color, icon: Icon, descKey }) => {
                    const isActive = priorityFilter === key
                    return (
                        <button
                            key={key}
                            onClick={() => {
                                const newFilter = isActive ? 'Toutes' : key
                                setPriorityFilter(newFilter)
                                setFilterLoading(true)
                                router.get('/predictions', { priority: newFilter === 'Toutes' ? '' : newFilter, search }, { preserveState: true, replace: true, onFinish: () => setFilterLoading(false) })
                            }}
                            className={`glass rounded-xl p-4 text-left transition-all cursor-pointer hover:scale-[1.02] ${isActive ? 'ring-2 ring-purple-500/60 shadow-lg shadow-purple-500/20' : ''}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2.5 rounded-xl ${levelBg[key]}`}><Icon className={`w-5 h-5 ${color}`} /></div>
                                <div>
                                    <p className="text-xs text-text-muted">{t(labelKey)}</p>
                                    <p className={`text-lg font-bold ${color}`}>{value}</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50 text-[10px] text-text-muted">
                                <span>{t(descKey)}</span>
                                {isActive && <span className="text-purple-400 font-semibold text-[9px]">● {t('predictions.filterActive')}</span>}
                            </div>
                        </button>
                    )
                })}

                {/* Carte 5 : Confiance moyenne + infos bennes */}
                <div className="glass rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 rounded-xl bg-emerald-500/10"><ShieldCheck className="w-5 h-5 text-emerald-400" /></div>
                        <div>
                            <p className="text-xs text-text-muted">{t('predictions.confidenceR2')}</p>
                            <p className="text-lg font-bold text-emerald-400">{stats.avgConfidence}%</p>
                        </div>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50 text-[10px] text-text-muted">
                        <span>{t('predictions.binsTracked')}</span>
                        <span className="text-cyan-400 font-semibold">{t('predictions.binsCount', { count: bins.length })}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-text-muted">
                        <span>{t('predictions.lastExecution')}</span>
                        <span className="text-text-muted font-semibold">{t('predictions.onDemand')}</span>
                    </div>
                </div>
            </div>

            {/* ═══════════ Timeline : urgence débordement ═══════════ */}
            {timelineItems.length > 0 && (
                <div className="glass rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
                            <Brain className="w-4 h-4 text-purple-400" />{t('predictions.timeToOverflow')}
                        </h2>
                        {/* Légende des seuils */}
                        <div className="flex items-center gap-2 text-[10px] text-text-muted">
                            <span className="w-2 h-2 rounded-full bg-red-500" />&lt;3h
                            <span className="w-2 h-2 rounded-full bg-amber-400" />3-12h
                            <span className="w-2 h-2 rounded-full bg-blue-400" />&gt;12h
                        </div>
                    </div>
                    {/* Barres horizontales — largeur = urgence (pleine = débordement imminent) */}
                    <div className="space-y-1.5">
                        {timelineItems.map((p) => {
                            const urgencyPct = Math.min(100, Math.max(4, p.urgency))
                            const barColor = p.priority === 'high' ? 'bg-red-500/80' : p.priority === 'medium' ? 'bg-amber-400/70' : 'bg-blue-400/60'
                            const dotColor = p.priority === 'high' ? 'bg-red-500' : p.priority === 'medium' ? 'bg-amber-400' : 'bg-blue-400'
                            return (
                                <div key={p.id} className="flex items-center gap-3 group">
                                    {/* Nom + lieu */}
                                    <div className="w-20 shrink-0 text-right">
                                        <p className="text-[10px] font-bold text-text-primary truncate" title={p.binName}>{p.binName}</p>
                                        <p className="text-[8px] text-text-muted truncate">{p.binLocation}</p>
                                    </div>
                                    {/* Barre d'urgence */}
                                    <div className="flex-1 h-6 bg-bg-card rounded-md overflow-hidden relative">
                                        <div className={`h-full rounded-md ${barColor} transition-all duration-500`} style={{ width: `${urgencyPct}%` }} />
                                        <div className="absolute inset-0 flex items-center px-2 justify-between">
                                            <div className={`w-2 h-2 rounded-full ${dotColor} ${p.priority === 'high' ? 'animate-pulse' : ''}`} />
                                            <span className="text-[9px] font-bold text-text-primary drop-shadow-md">
                                                {p.fillLevel}% · {p.estimatedHours > 0 ? `~${Math.round(p.estimatedHours)}h` : t('predictions.lessThan1h')}
                                            </span>
                                        </div>
                                    </div>
                                    {/* Label priorité */}
                                    <span className={`text-[9px] font-semibold w-10 shrink-0 hidden sm:block text-center ${p.priority === 'high' ? 'text-red-400' : p.priority === 'medium' ? 'text-amber-400' : 'text-blue-400'}`}>
                                        {p.priority === 'high' ? t('predictions.urgent') : p.priority === 'medium' ? t('predictions.plan') : t('predictions.routine')}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* ═══════════ Filtres ═══════════ */}
            {predictions.total > 0 && (
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    {/* Barre de recherche */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                        <input value={search} onChange={(e) => { setSearch(e.target.value); router.get('/predictions', { search: e.target.value }, { preserveState: true, replace: true }) }} placeholder={t('predictions.search')} className="w-full pl-10 pr-4 py-2.5 bg-input-bg rounded-xl border border-border focus:border-purple-500 outline-none text-sm text-text-primary placeholder:text-text-muted transition-all" />
                    </div>
                    {/* Filtre priorité actif + tri */}
                    <div className="flex items-center gap-3 flex-wrap">
                        {priorityFilter !== 'Toutes' && (
                            <span className="text-[10px] text-text-muted flex items-center gap-1">
                                {t('predictions.filter')} <span className={`font-semibold ${priorityFilter === 'high' ? 'text-red-400' : priorityFilter === 'medium' ? 'text-amber-400' : 'text-blue-400'}`}>
                                    {priorityFilter === 'high' ? t('predictions.urgent') : priorityFilter === 'medium' ? t('predictions.plan') : t('predictions.routine')}
                                </span>
                                <button onClick={() => { setPriorityFilter('Toutes'); setFilterLoading(true); router.get('/predictions', { priority: '', search }, { preserveState: true, replace: true, onFinish: () => setFilterLoading(false) }) }} className="ml-1 text-text-muted hover:text-text-primary transition-colors">✕</button>
                            </span>
                        )}
                        {/* Bouton tri par temps */}
                        <button onClick={() => setSortTimeAsc(!sortTimeAsc)} className="flex items-center gap-1.5 px-3 py-1.5 bg-input-bg rounded-lg text-xs text-text-muted hover:text-text-primary transition-all">
                            <ArrowUpDown className="w-3.5 h-3.5" />{t('predictions.sortByTime')} {sortTimeAsc ? '▲' : '▼'}
                        </button>
                    </div>
                </div>
            )}

            {/* ═══════════ État vide (aucune prédiction) ═══════════ */}
            {predictions.total === 0 ? (
                <div className="glass rounded-xl p-10 text-center">
                    <Brain className="w-12 h-12 text-text-muted mx-auto mb-4" />
                    <p className="text-lg font-bold text-text-primary">{t('predictions.emptyTitle')}</p>
                    <p className="text-sm text-text-secondary mt-1 max-w-md mx-auto">
                        <Trans i18nKey="predictions.emptyDesc" values={{ action: t('predictions.launch') }} components={{ strong: <strong className="text-purple-400" /> }} />
                    </p>
                    {(userRole === 'ADMIN' || userRole === 'SUPERVISEUR' || userRole === 'OPERATEUR') && (
                        <button
                            onClick={() => { setGenerating(true); router.post('/predictions/generate', {}, { preserveState: true, onFinish: () => setGenerating(false) }); }}
                            disabled={generating}
                            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-text-primary text-sm font-semibold transition-all disabled:opacity-50"
                        >
                            <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
                        {generating ? t('predictions.generating') : t('predictions.launch')}
                        </button>
                    )}
                </div>
            ) : (
                <>
                    {/* ═══════════ Cartes prédictions ═══════════ */}
                    <div className="relative">
                        {filterLoading && (
                            <div className="absolute inset-0 bg-bg-primary/60 backdrop-blur-sm rounded-xl z-10 flex items-center justify-center">
                                <div className="flex items-center gap-2 text-sm text-text-muted">
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    {t('common.loading')}
                                </div>
                            </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {sortedCards.map((p) => (
                            // Bordure gauche colorée selon priorité
                            <div key={p.id} className={`glass rounded-xl p-5 border-l-4 transition-all hover:bg-[rgba(255,255,255,0.04)] ${p.priority === 'high' ? 'border-l-red-500' : p.priority === 'medium' ? 'border-l-amber-400' : 'border-l-blue-400'}`}>
                                {/* En-tête : nom + badge priorité + bouton supprimer */}
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <p className="text-xs font-bold text-text-primary flex items-center gap-2">
                                            {p.binName}
                                            <span className="text-[9px] font-normal text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded-full">IA</span>
                                        </p>
                                        <p className="text-[10px] text-text-muted mt-0.5 flex items-center gap-1">
                                            <MapPin className="w-3 h-3" />{p.binLocation}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {/* Badge de priorité */}
                                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${levelColors[p.priority]}`}>
                                            {p.priority === 'high' ? t('predictions.urgent') : p.priority === 'medium' ? t('predictions.plan') : t('predictions.routine')}
                                        </span>
                                        {/* Bouton supprimer — ADMIN et SUPERVISEUR uniquement */}
                                        {(userRole === 'ADMIN' || userRole === 'SUPERVISEUR') && (
                                            <button onClick={() => { if (confirm(t('predictions.deleteConfirm'))) router.delete(`/predictions/${p.id}`, { preserveState: true }) }} className="p-1 rounded-lg opacity-100 sm:opacity-0 group-hover:sm:opacity-100 hover:bg-red-500/10 text-red-400/70 sm:text-text-muted hover:text-red-400 transition-all" title={t('common.delete')}>
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Message de recommandation */}
                                <p className="text-xs text-text-primary mb-3 leading-relaxed">{p.message}</p>

                                {/* Barre de progression temps restant */}
                                <div className="space-y-1.5 mb-3">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-text-muted">{t('predictions.timeToOverflow')}</span>
                                        <span className="font-semibold text-text-primary">
                                            {p.estimatedHours > 0 ? `~${Math.round(p.estimatedHours)}h` : t('predictions.lessThan1h')}
                                        </span>
                                    </div>
                                    <div className="w-full h-2 bg-bg-card rounded-full overflow-hidden">
                                        {/* Barre d'urgence — large = imminent */}
                                        <div className={`h-full rounded-full transition-all duration-700 ${p.priority === 'high' ? 'bg-red-500' : p.priority === 'medium' ? 'bg-amber-400' : 'bg-blue-400'}`} style={{ width: `${p.urgency}%` }} />
                                    </div>
                                </div>

                                {/* Métriques : Confiance, Score de risque, Localisation */}
                                <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-border/50">
                                    <div className="text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                                            <span className="text-xs font-bold text-emerald-400">{p.confidence}%</span>
                                        </div>
                                        <p className="text-[9px] text-text-muted mt-0.5">{t('predictions.confidenceR2')}</p>
                                    </div>
                                    <div className="text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <AlertTriangle className={`w-3 h-3 ${p.priority === 'high' ? 'text-red-400' : p.priority === 'medium' ? 'text-amber-400' : 'text-blue-400'}`} />
                                            <span className={`text-xs font-bold ${p.priority === 'high' ? 'text-red-400' : p.priority === 'medium' ? 'text-amber-400' : 'text-blue-400'}`}>{p.riskScore}</span>
                                        </div>
                                        <p className="text-[9px] text-text-muted mt-0.5">{t('predictions.riskScore')}</p>
                                    </div>
                                    <div className="text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <MapPin className="w-3 h-3 text-cyan-400" />
                                            <span className="text-xs font-bold text-text-primary truncate max-w-[80px] block" title={p.binLocation}>{p.binLocation}</span>
                                        </div>
                                        <p className="text-[9px] text-text-muted mt-0.5">{t('predictions.location')}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    </div>

                    {/* ═══════════ Pagination ═══════════ */}
                    {predictions.last_page > 1 && (
                        <div className="flex items-center justify-center gap-2 overflow-x-auto no-scrollbar">
                            <button onClick={() => router.get('/predictions', { page: predictions.current_page - 1, search: filters?.search, priority: filters?.priority }, { preserveState: true })} disabled={predictions.current_page === 1} className="p-2 rounded-lg bg-input-bg text-text-muted hover:text-text-primary disabled:opacity-30 transition-all shrink-0"><ChevronLeft className="w-4 h-4" /></button>
                            {Array.from({ length: predictions.last_page }, (_, i) => (
                                <button key={i} onClick={() => router.get('/predictions', { page: i + 1, search: filters?.search, priority: filters?.priority }, { preserveState: true })} className={`w-8 h-8 rounded-lg text-xs font-bold transition-all shrink-0 ${predictions.current_page === i + 1 ? 'bg-purple-600 text-text-primary shadow-lg' : 'bg-input-bg text-text-muted hover:text-text-primary'}`}>{i + 1}</button>
                            ))}
                            <button onClick={() => router.get('/predictions', { page: predictions.current_page + 1, search: filters?.search, priority: filters?.priority }, { preserveState: true })} disabled={predictions.current_page === predictions.last_page} className="p-2 rounded-lg bg-input-bg text-text-muted hover:text-text-primary disabled:opacity-30 transition-all shrink-0"><ChevronRight className="w-4 h-4" /></button>
                        </div>
                    )}
                </>
            )}

            {/* ═══════════ Info bas de page ═══════════ */}
            <div className="glass rounded-xl p-4 flex items-center justify-between text-xs text-text-muted">
                <div className="flex items-center gap-4 flex-wrap">
                    <span className="flex items-center gap-1.5"><Brain className="w-3.5 h-3.5 text-purple-400" />{t('predictions.footerAlgo')}</span>
                    <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />{t('predictions.footerR2')}</span>
                    <span className="flex items-center gap-1.5"><Target className="w-3.5 h-3.5 text-cyan-400" />{t('predictions.footerCount', { total: predictions.total, bins: bins.length })}</span>
                </div>
                <span>{t('predictions.footerAnalyze')}</span>
            </div>
        </div>
    )
}

// Layout Inertia : enveloppe la page dans le layout principal (sidebar + navbar)
PredictionsPage.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>
export default PredictionsPage
