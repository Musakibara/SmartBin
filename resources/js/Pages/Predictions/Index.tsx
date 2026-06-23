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

import { useState, useMemo } from 'react'
import { Brain, AlertTriangle, Search, ChevronLeft, ChevronRight, ArrowUpDown, Target, ShieldCheck, MapPin, RefreshCw, Trash2 } from 'lucide-react'
import AppLayout from '../../Layouts/AppLayout'
import { usePage, router } from '@inertiajs/react'

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

const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 }

function PredictionsPage() {
    // Props Inertia venant du PredictionController
    const { predictions, bins, filters, stats } = usePage().props as unknown as {
        predictions: {
            data: Array<{
                id: string; bin: string; binName: string; binLocation: string
                fillLevel: number; message: string; priority: string
                estimatedHours: number; progress: number; confidence: number; riskScore: number
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

    // État local
    const [search, setSearch] = useState(filters?.search ?? '')
    const [priorityFilter, setPriorityFilter] = useState(filters?.priority ?? 'Toutes')
    const [sortAsc, setSortAsc] = useState(true)        // Tri urgent asc/desc (true = HIGH en premier)
    const [generating, setGenerating] = useState(false) // État du bouton IA
    const [showInfo, setShowInfo] = useState(false)     // Détails techniques

    // Tri des prédictions par priorité (HIGH > MEDIUM > LOW)
    // sortAsc = true  → les plus urgentes en premier
    // sortAsc = false → les moins urgentes en premier
    const filtered = useMemo(() => {
        const items = [...predictions.data]
        return items.sort((a, b) => sortAsc ? priorityOrder[a.priority] - priorityOrder[b.priority] : priorityOrder[b.priority] - priorityOrder[a.priority])
    }, [predictions.data, sortAsc])

    return (
        <div className="space-y-6">
            {/* ═══════════ En-tête ═══════════ */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Brain className="w-6 h-6 text-purple-400" />Prédictions IA
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">
                        Anticipation des débordements par régression linéaire
                    </p>
                </div>
                {/* Bouton "Lancer l'IA" — visible ADMIN, SUPERVISEUR, OPERATEUR */}
                {(userRole === 'ADMIN' || userRole === 'SUPERVISEUR' || userRole === 'OPERATEUR') && (
                    <button
                        onClick={() => { setGenerating(true); router.post('/predictions/generate', {}, { preserveState: true, onFinish: () => setGenerating(false) }); }}
                        disabled={generating}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold transition-all disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
                        {generating ? 'Génération...' : "Lancer l'IA"}
                    </button>
                )}
            </div>

            {/* ═══════════ Message explicatif ═══════════ */}
            <div className="glass rounded-xl p-4 bg-gradient-to-r from-purple-500/5 to-transparent border border-purple-500/10">
                <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-purple-500/10 shrink-0"><Brain className="w-5 h-5 text-purple-400" /></div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white">Comment ça marche ?</p>
                        <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                            Le modèle analyse les <strong className="text-purple-400">24 derniers relevés</strong> de chaque benne (espacés de ~30 min)
                            et calcule une <strong className="text-purple-400">droite de tendance</strong> par régression linéaire.
                            En prolongeant cette droite, il estime le moment où la benne atteindra <strong className="text-purple-400">100% de remplissage</strong>.
                            {stats.high > 0 && (
                                <span className="text-red-400"> {stats.high} benne{stats.high > 1 ? 's' : ''} à risque élevé détectée{stats.high > 1 ? 's' : ''}.</span>
                            )}
                        </p>
                        <button onClick={() => setShowInfo(!showInfo)} className="text-[10px] text-gray-500 hover:text-gray-400 mt-1 underline underline-offset-2">
                            {showInfo ? 'Masquer les détails' : 'Voir les détails techniques'}
                        </button>
                        {showInfo && (
                            <div className="mt-2 text-[10px] text-gray-500 space-y-0.5 pl-2 border-l border-purple-500/30">
                                <p>📊 <strong className="text-gray-400">Algorithme :</strong> Régression linéaire (numpy.polyfit)</p>
                                <p>📐 <strong className="text-gray-400">Équation :</strong> y = a·x + b (a = pente de remplissage en %/h)</p>
                                <p>📈 <strong className="text-gray-400">Confiance :</strong> Coefficient R² (qualité de l'alignement des points)</p>
                                <p>⏱️ <strong className="text-gray-400">Données :</strong> 24 relevés × {predictions.total} prédictions</p>
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
                            <p className="text-xs text-gray-500">Prédictions</p>
                            <p className="text-lg font-bold text-purple-400">{stats.total}</p>
                        </div>
                    </div>
                    {/* Barre de distribution proportionnelle HIGH/MEDIUM/LOW */}
                    {stats.total > 0 && (
                        <div className="flex h-1.5 rounded-full overflow-hidden bg-[#1E293B]">
                            {[
                                { count: stats.high, color: 'bg-red-500', label: 'Urgent' },
                                { count: stats.medium, color: 'bg-amber-400', label: 'Planifier' },
                                { count: stats.low, color: 'bg-blue-400', label: 'Routine' },
                            ].map(({ count, color, label }) =>
                                count > 0 && (
                                    <div key={label} className={`${color} h-full transition-all`} style={{ width: `${(count / stats.total) * 100}%` }} title={`${label}: ${count}`} />
                                )
                            )}
                        </div>
                    )}
                    {/* Légende */}
                    <div className="flex items-center gap-3 mt-2 text-[9px] text-gray-600">
                        {[
                            { count: stats.high, color: 'bg-red-500', label: 'Urgent' },
                            { count: stats.medium, color: 'bg-amber-400', label: 'Planifier' },
                            { count: stats.low, color: 'bg-blue-400', label: 'Routine' },
                        ].map(({ count, color, label }) => (
                            <span key={label} className="flex items-center gap-1">
                                <span className={`w-1.5 h-1.5 rounded-full ${color}`} />
                                {count} {label}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Cartes 2-4 : Niveaux de priorité — cliquables pour filtrer */}
                {[
                    { key: 'high', label: 'Haute priorité', value: stats.high, color: 'text-red-400', icon: AlertTriangle, desc: 'Intervention immédiate' },
                    { key: 'medium', label: 'Planification', value: stats.medium, color: 'text-amber-400', icon: AlertTriangle, desc: 'Collecte à programmer' },
                    { key: 'low', label: 'Surveillance', value: stats.low, color: 'text-blue-400', icon: ShieldCheck, desc: 'Routine' },
                ].map(({ key, label, value, color, icon: Icon, desc }) => {
                    const isActive = priorityFilter === key
                    return (
                        <button
                            key={key}
                            onClick={() => {
                                const newFilter = isActive ? 'Toutes' : key
                                setPriorityFilter(newFilter)
                                router.get('/predictions', { priority: newFilter === 'Toutes' ? '' : newFilter, search }, { preserveState: true, replace: true })
                            }}
                            className={`glass rounded-xl p-4 text-left transition-all cursor-pointer hover:scale-[1.02] ${isActive ? 'ring-2 ring-purple-500/60 shadow-lg shadow-purple-500/20' : ''}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2.5 rounded-xl ${levelBg[key]}`}><Icon className={`w-5 h-5 ${color}`} /></div>
                                <div>
                                    <p className="text-xs text-gray-500">{label}</p>
                                    <p className={`text-lg font-bold ${color}`}>{value}</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#334155]/50 text-[10px] text-gray-600">
                                <span>{desc}</span>
                                {isActive && <span className="text-purple-400 font-semibold text-[9px]">● Filtre actif</span>}
                            </div>
                        </button>
                    )
                })}

                {/* Carte 5 : Confiance moyenne + infos bennes */}
                <div className="glass rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 rounded-xl bg-emerald-500/10"><ShieldCheck className="w-5 h-5 text-emerald-400" /></div>
                        <div>
                            <p className="text-xs text-gray-500">Confiance R²</p>
                            <p className="text-lg font-bold text-emerald-400">{stats.avgConfidence}%</p>
                        </div>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#334155]/50 text-[10px] text-gray-600">
                        <span>Bennes suivies</span>
                        <span className="text-cyan-400 font-semibold">{bins.length} bennes</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-gray-600">
                        <span>Dernière exécution</span>
                        <span className="text-gray-500 font-semibold">À la demande</span>
                    </div>
                </div>
            </div>

            {/* ═══════════ Timeline : temps avant débordement ═══════════ */}
            {predictions.data.length > 0 && (
                <div className="glass rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-bold text-white flex items-center gap-2">
                            <Brain className="w-4 h-4 text-purple-400" />Temps avant débordement
                        </h2>
                        {/* Légende des seuils */}
                        <div className="flex items-center gap-2 text-[10px] text-gray-500">
                            <span className="w-2 h-2 rounded-full bg-red-500" />&lt;3h
                            <span className="w-2 h-2 rounded-full bg-amber-400" />3-12h
                            <span className="w-2 h-2 rounded-full bg-blue-400" />&gt;12h
                        </div>
                    </div>
                    {/* Barres horizontales triées par urgence */}
                    <div className="space-y-1.5">
                        {[...predictions.data].sort((a, b) => a.estimatedHours - b.estimatedHours).map((p) => {
                            // widthPct : largeur de la barre (proportionnelle à 24h max)
                            const widthPct = Math.min(100, (p.estimatedHours / 24) * 100)
                            const barColor = p.priority === 'high' ? 'bg-red-500/80' : p.priority === 'medium' ? 'bg-amber-400/70' : 'bg-blue-400/60'
                            const dotColor = p.priority === 'high' ? 'bg-red-500' : p.priority === 'medium' ? 'bg-amber-400' : 'bg-blue-400'
                            return (
                                <div key={p.id} className="flex items-center gap-3 group">
                                    {/* Nom + lieu */}
                                    <div className="w-20 shrink-0 text-right">
                                        <p className="text-[10px] font-bold text-white truncate" title={p.binName}>{p.binName}</p>
                                        <p className="text-[8px] text-gray-600 truncate">{p.binLocation}</p>
                                    </div>
                                    {/* Barre de progression */}
                                    <div className="flex-1 h-6 bg-[#1E293B] rounded-md overflow-hidden relative">
                                        <div className={`h-full rounded-md ${barColor} transition-all duration-500`} style={{ width: `${widthPct}%` }} />
                                        <div className="absolute inset-0 flex items-center px-2 justify-between">
                                            {/* Point indicateur + animation pulse si HIGH */}
                                            <div className={`w-2 h-2 rounded-full ${dotColor} ${p.priority === 'high' ? 'animate-pulse' : ''}`} />
                                            <span className="text-[9px] font-bold text-white drop-shadow-md">
                                                {p.estimatedHours > 0 ? `~${Math.round(p.estimatedHours)}h` : '< 1h'}
                                            </span>
                                        </div>
                                    </div>
                                    {/* Label priorité */}
                                    <span className={`text-[9px] font-semibold w-10 shrink-0 hidden sm:block text-center ${p.priority === 'high' ? 'text-red-400' : p.priority === 'medium' ? 'text-amber-400' : 'text-blue-400'}`}>
                                        {p.priority === 'high' ? 'Urgent' : p.priority === 'medium' ? 'Planifier' : 'Routine'}
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
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input value={search} onChange={(e) => { setSearch(e.target.value); router.get('/predictions', { search: e.target.value, priority: priorityFilter === 'Toutes' ? '' : priorityFilter }, { preserveState: true, replace: true }) }} placeholder="Rechercher par benne, lieu..." className="w-full pl-10 pr-4 py-2.5 bg-[#1E293B]/80 rounded-xl border border-[#334155] focus:border-purple-500 outline-none text-sm text-white placeholder:text-gray-600 transition-all" />
                    </div>
                    {/* Filtre priorité actif + tri */}
                    <div className="flex items-center gap-3 flex-wrap">
                        {priorityFilter !== 'Toutes' && (
                            <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                Filtre : <span className={`font-semibold ${priorityFilter === 'high' ? 'text-red-400' : priorityFilter === 'medium' ? 'text-amber-400' : 'text-blue-400'}`}>
                                    {priorityFilter === 'high' ? 'Urgent' : priorityFilter === 'medium' ? 'Planifier' : 'Routine'}
                                </span>
                                <button onClick={() => { setPriorityFilter('Toutes'); router.get('/predictions', { priority: '', search }, { preserveState: true, replace: true }) }} className="ml-1 text-gray-600 hover:text-white transition-colors">✕</button>
                            </span>
                        )}
                        {/* Bouton tri urgent */}
                        <button onClick={() => setSortAsc(!sortAsc)} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1E293B]/80 rounded-lg text-xs text-gray-500 hover:text-gray-300 transition-all">
                            <ArrowUpDown className="w-3.5 h-3.5" />{sortAsc ? 'Urgent ▲' : 'Urgent ▼'}
                        </button>
                    </div>
                </div>
            )}

            {/* ═══════════ État vide (aucune prédiction) ═══════════ */}
            {predictions.total === 0 ? (
                <div className="glass rounded-xl p-10 text-center">
                    <Brain className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-lg font-bold text-white">Aucune prédiction</p>
                    <p className="text-sm text-gray-400 mt-1 max-w-md mx-auto">
                        Cliquez sur <strong className="text-purple-400">"Lancer l'IA"</strong> pour générer les prédictions. 
                        Le modèle analysera les relevés de toutes les bennes et estimera les risques de débordement.
                    </p>
                    {(userRole === 'ADMIN' || userRole === 'SUPERVISEUR' || userRole === 'OPERATEUR') && (
                        <button
                            onClick={() => { setGenerating(true); router.post('/predictions/generate', {}, { preserveState: true, onFinish: () => setGenerating(false) }); }}
                            disabled={generating}
                            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold transition-all disabled:opacity-50"
                        >
                            <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
                            {generating ? 'Génération...' : "Lancer l'IA"}
                        </button>
                    )}
                </div>
            ) : (
                <>
                    {/* ═══════════ Cartes prédictions ═══════════ */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filtered.map((p) => (
                            // Bordure gauche colorée selon priorité
                            <div key={p.id} className={`glass rounded-xl p-5 border-l-4 transition-all hover:bg-[rgba(255,255,255,0.04)] ${p.priority === 'high' ? 'border-l-red-500' : p.priority === 'medium' ? 'border-l-amber-400' : 'border-l-blue-400'}`}>
                                {/* En-tête : nom + badge priorité + bouton supprimer */}
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <p className="text-xs font-bold text-white flex items-center gap-2">
                                            {p.binName}
                                            <span className="text-[9px] font-normal text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded-full">IA</span>
                                        </p>
                                        <p className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-1">
                                            <MapPin className="w-3 h-3" />{p.binLocation}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {/* Badge de priorité */}
                                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${levelColors[p.priority]}`}>
                                            {p.priority === 'high' ? 'Urgent' : p.priority === 'medium' ? 'Planifier' : 'Routine'}
                                        </span>
                                        {/* Bouton supprimer — ADMIN et SUPERVISEUR uniquement */}
                                        {(userRole === 'ADMIN' || userRole === 'SUPERVISEUR') && (
                                            <button onClick={() => { if (confirm('Supprimer cette prédiction ?')) router.delete(`/predictions/${p.id}`, { preserveState: true }) }} className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-all" title="Supprimer">
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Message de recommandation */}
                                <p className="text-xs text-gray-300 mb-3 leading-relaxed">{p.message}</p>

                                {/* Barre de progression temps restant */}
                                <div className="space-y-1.5 mb-3">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-500">Temps avant débordement</span>
                                        <span className="font-semibold text-white">
                                            {p.estimatedHours > 0 ? `~${Math.round(p.estimatedHours)}h` : '< 1h'}
                                        </span>
                                    </div>
                                    <div className="w-full h-2 bg-[#1E293B] rounded-full overflow-hidden">
                                        {/* 100 - progress = la barre diminue quand le temps approche */}
                                        <div className={`h-full rounded-full transition-all duration-700 ${p.priority === 'high' ? 'bg-red-500' : p.priority === 'medium' ? 'bg-amber-400' : 'bg-blue-400'}`} style={{ width: `${100 - p.progress}%` }} />
                                    </div>
                                </div>

                                {/* Métriques : Confiance, Score de risque, Localisation */}
                                <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-[#334155]/50">
                                    <div className="text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                                            <span className="text-xs font-bold text-emerald-400">{p.confidence}%</span>
                                        </div>
                                        <p className="text-[9px] text-gray-600 mt-0.5">Confiance R²</p>
                                    </div>
                                    <div className="text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <AlertTriangle className={`w-3 h-3 ${p.priority === 'high' ? 'text-red-400' : p.priority === 'medium' ? 'text-amber-400' : 'text-blue-400'}`} />
                                            <span className={`text-xs font-bold ${p.priority === 'high' ? 'text-red-400' : p.priority === 'medium' ? 'text-amber-400' : 'text-blue-400'}`}>{p.riskScore}</span>
                                        </div>
                                        <p className="text-[9px] text-gray-600 mt-0.5">Score de risque</p>
                                    </div>
                                    <div className="text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <MapPin className="w-3 h-3 text-cyan-400" />
                                            <span className="text-xs font-bold text-white truncate max-w-[80px] block" title={p.binLocation}>{p.binLocation}</span>
                                        </div>
                                        <p className="text-[9px] text-gray-600 mt-0.5">Localisation</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* ═══════════ Pagination ═══════════ */}
                    {predictions.last_page > 1 && (
                        <div className="flex items-center justify-center gap-2 overflow-x-auto no-scrollbar">
                            <button onClick={() => router.get('/predictions', { page: predictions.current_page - 1, search: filters?.search, priority: filters?.priority }, { preserveState: true })} disabled={predictions.current_page === 1} className="p-2 rounded-lg bg-[#1E293B]/80 text-gray-500 hover:text-white disabled:opacity-30 transition-all shrink-0"><ChevronLeft className="w-4 h-4" /></button>
                            {Array.from({ length: predictions.last_page }, (_, i) => (
                                <button key={i} onClick={() => router.get('/predictions', { page: i + 1, search: filters?.search, priority: filters?.priority }, { preserveState: true })} className={`w-8 h-8 rounded-lg text-xs font-bold transition-all shrink-0 ${predictions.current_page === i + 1 ? 'bg-purple-600 text-white shadow-lg' : 'bg-[#1E293B]/80 text-gray-500 hover:text-white'}`}>{i + 1}</button>
                            ))}
                            <button onClick={() => router.get('/predictions', { page: predictions.current_page + 1, search: filters?.search, priority: filters?.priority }, { preserveState: true })} disabled={predictions.current_page === predictions.last_page} className="p-2 rounded-lg bg-[#1E293B]/80 text-gray-500 hover:text-white disabled:opacity-30 transition-all shrink-0"><ChevronRight className="w-4 h-4" /></button>
                        </div>
                    )}
                </>
            )}

            {/* ═══════════ Info bas de page ═══════════ */}
            <div className="glass rounded-xl p-4 flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-4 flex-wrap">
                    <span className="flex items-center gap-1.5"><Brain className="w-3.5 h-3.5 text-purple-400" />Régression linéaire (numpy)</span>
                    <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />R² = confiance</span>
                    <span className="flex items-center gap-1.5"><Target className="w-3.5 h-3.5 text-cyan-400" />{predictions.total} prédictions sur {bins.length} bennes</span>
                </div>
                <span>Analyse à la demande</span>
            </div>
        </div>
    )
}

// Layout Inertia : enveloppe la page dans le layout principal (sidebar + navbar)
PredictionsPage.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>
export default PredictionsPage
