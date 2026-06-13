import { useState, useMemo } from 'react'
import { Brain, AlertTriangle, Search, ChevronLeft, ChevronRight, ArrowUpDown, Target, Layers, Cpu, Activity, ShieldCheck, GitBranch, Sigma } from 'lucide-react'
import AppLayout from '../../Layouts/AppLayout'
import { predictions, bins } from '../../data/mock-dashboard'

const priorityColors: Record<string, string> = {
    high: 'bg-red-500/15 text-red-400 border-red-500/30',
    medium: 'bg-amber-500/15 text-amber-400 border-amber-400/25',
    low: 'bg-blue-500/15 text-blue-400 border-blue-400/25',
}

const modelInfo = {
    version: 'DeepBin v3.2',
    accuracy: 96.4,
    trained: '12 mai 2026',
    dataPoints: '15 840',
    lastRun: 'Il y a 3 min',
    algorithm: 'LSTM + Transformer',
}

function PredictionsPage() {
    const [search, setSearch] = useState('')
    const [priorityFilter, setPriorityFilter] = useState('Toutes')
    const [sortAsc, setSortAsc] = useState(false)
    const [page, setPage] = useState(1)
    const perPage = 4

    const enriched = useMemo(() => predictions.map((p, i) => {
        const bin = bins.find((b) => b.id === p.bin)
        const progress = Math.min(95, Math.max(5, (p.estimatedHours - 1) / 12 * 100 + Math.random() * 15))
        const confidence = Number((85 + Math.random() * 14).toFixed(1))
        const riskScore = p.priority === 'high' ? Math.round(75 + Math.random() * 20) : p.priority === 'medium' ? Math.round(45 + Math.random() * 25) : Math.round(15 + Math.random() * 25)
        return { ...p, binName: bin?.name ?? p.bin, binLocation: bin?.location ?? '', fillLevel: bin?.fillLevel ?? 0, progress, confidence, riskScore }
    }), [])

    const filtered = useMemo(() => {
        const f = enriched.filter((p) => {
            const matchSearch = p.id.toLowerCase().includes(search.toLowerCase()) || p.message.toLowerCase().includes(search.toLowerCase()) || p.binName.toLowerCase().includes(search.toLowerCase())
            const matchPriority = priorityFilter === 'Toutes' || p.priority === priorityFilter
            return matchSearch && matchPriority
        })
        const order = { high: 0, medium: 1, low: 2 }
        return f.sort((a, b) => sortAsc ? order[a.priority] - order[b.priority] : order[b.priority] - order[a.priority])
    }, [search, priorityFilter, sortAsc])

    const totalPages = Math.ceil(filtered.length / perPage)
    const paginated = filtered.slice((page - 1) * perPage, page * perPage)
    const highCount = enriched.filter((p) => p.priority === 'high').length
    const imminentCount = enriched.filter((p) => p.estimatedHours <= 3).length
    const avgConfidence = Math.round(enriched.reduce((s, p) => s + p.confidence, 0) / enriched.length)

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Brain className="w-6 h-6 text-purple-400" />AI Predictions
                </h1>
                <p className="text-sm text-gray-400 mt-1">Modèle LSTM + Transformer · Anticipation des débordements en temps réel</p>
            </div>

            {/* Résumé IA */}
            <div className="glass rounded-xl p-5 bg-gradient-to-r from-purple-500/5 to-transparent border-purple-500/10">
                <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-purple-500/10 shrink-0"><Brain className="w-5 h-5 text-purple-400" /></div>
                    <div>
                        <p className="text-sm font-semibold text-white">Analyse IA du réseau</p>
                        <p className="text-xs text-gray-400 mt-1">
                            {highCount > 0
                                ? `${highCount} benne${highCount > 1 ? 's' : ''} à risque critique détectée${highCount > 1 ? 's' : ''}. Intervention recommandée sous ${Math.min(...enriched.filter(p => p.priority === 'high').map(p => p.estimatedHours))}h. `
                                : 'Aucun risque critique détecté. '}
                            Taux de confiance moyen : <span className="text-purple-400 font-semibold">{avgConfidence}%</span> · 
                            Précision historique du modèle : <span className="text-emerald-400 font-semibold">{modelInfo.accuracy}%</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats IA */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Prédictions actives', value: enriched.length, sub: 'Dernière exécution', subValue: modelInfo.lastRun, color: 'text-purple-400', bg: 'bg-purple-500/10', icon: Brain },
                    { label: 'Haute priorité', value: highCount, sub: 'Intervention urgente', subValue: `${imminentCount} imminente${imminentCount > 1 ? 's' : ''}`, color: 'text-red-400', bg: 'bg-red-500/10', icon: AlertTriangle },
                    { label: 'Confiance IA', value: `${avgConfidence}%`, sub: 'Score moyen', subValue: `Modèle ${modelInfo.version}`, color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: ShieldCheck },
                    { label: 'Précision', value: `${modelInfo.accuracy}%`, sub: `${modelInfo.dataPoints} points`, subValue: `v${modelInfo.version}`, color: 'text-cyan-400', bg: 'bg-cyan-500/10', icon: Target },
                ].map(({ label, value, sub, subValue, color, bg, icon: Icon }) => (
                    <div key={label} className="glass rounded-xl p-4">
                        <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-xl ${bg}`}><Icon className={`w-5 h-5 ${color}`} /></div>
                            <div>
                                <p className="text-xs text-gray-500">{label}</p>
                                <p className={`text-lg font-bold ${color}`}>{value}</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#334155]/50 text-[10px] text-gray-600">
                            <span>{sub}</span>
                            <span className="text-gray-500 font-semibold">{subValue}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Timeline des prédictions */}
            <div className="glass rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                        <Layers className="w-4 h-4 text-purple-400" />Timeline de risque
                    </h2>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500">
                        <span className="w-2 h-2 rounded-full bg-red-500" />Critique
                        <span className="w-2 h-2 rounded-full bg-amber-400" />Modéré
                        <span className="w-2 h-2 rounded-full bg-blue-400" />Faible
                    </div>
                </div>
                <div className="space-y-2">
                    {/* En-têtes heures */}
                    <div className="relative h-5">
                        <div className="absolute inset-0 flex">
                            {[0, 3, 6, 9, 12, 15, 18, 21, 24].map((h) => (
                                <div key={h} className="flex-1 text-[9px] text-gray-600 border-l border-[#334155]/50 pl-1">{h}h</div>
                            ))}
                        </div>
                    </div>
                    {/* Barres */}
                    <div className="space-y-1.5">
                        {enriched.sort((a, b) => a.estimatedHours - b.estimatedHours).map((p) => {
                            const widthPct = (p.estimatedHours / 24) * 100
                            const barColor = p.priority === 'high' ? 'bg-red-500/80' : p.priority === 'medium' ? 'bg-amber-400/70' : 'bg-blue-400/60'
                            const dotColor = p.priority === 'high' ? 'bg-red-500 shadow-red-500/50' : p.priority === 'medium' ? 'bg-amber-400 shadow-amber-400/30' : 'bg-blue-400 shadow-blue-400/30'
                            return (
                                <div key={p.id} className="flex items-center gap-3 group cursor-pointer">
                                    <div className="w-16 shrink-0 text-right">
                                        <p className="text-[10px] font-bold text-white truncate">{p.binName}</p>
                                    </div>
                                    <div className="flex-1 h-6 bg-[#1E293B] rounded-md overflow-hidden relative">
                                        <div className={`h-full rounded-md ${barColor} transition-all duration-500`} style={{ width: `${widthPct}%` }} />
                                        <div className="absolute inset-0 flex items-center px-2 justify-between">
                                            <div className={`w-2 h-2 rounded-full ${dotColor} ${p.priority === 'high' ? 'animate-pulse' : ''}`} />
                                            <span className="text-[9px] font-bold text-white drop-shadow-md">T-{p.estimatedHours}h</span>
                                        </div>
                                    </div>
                                    <div className="w-12 shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                        <span className={`text-[9px] font-semibold ${p.priority === 'high' ? 'text-red-400' : p.priority === 'medium' ? 'text-amber-400' : 'text-blue-400'}`}>{p.priority}</span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Filtres */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Rechercher une prédiction..." className="w-full pl-10 pr-4 py-2.5 bg-[#1E293B]/80 rounded-xl border border-[#334155] focus:border-purple-500 outline-none text-sm text-white placeholder:text-gray-600 transition-all" />
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1 bg-[#1E293B]/80 rounded-lg p-0.5 overflow-x-auto no-scrollbar">
                        {['Toutes', 'high', 'medium', 'low'].map((p) => (
                            <button key={p} onClick={() => { setPriorityFilter(p); setPage(1) }} className={`shrink-0 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${priorityFilter === p ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>{p === 'Toutes' ? 'Toutes' : p}</button>
                        ))}
                    </div>
                    <button onClick={() => setSortAsc(!sortAsc)} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1E293B]/80 rounded-lg text-xs text-gray-500 hover:text-gray-300 transition-all">
                        <ArrowUpDown className="w-3.5 h-3.5" />{sortAsc ? '↑' : '↓'}
                    </button>
                </div>
            </div>

            {/* Cartes prédictions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paginated.map((p) => (
                    <div key={p.id} className={`glass rounded-xl p-5 border-l-4 transition-all group hover:bg-[rgba(255,255,255,0.04)] ${p.priority === 'high' ? 'border-l-red-500' : p.priority === 'medium' ? 'border-l-amber-400' : 'border-l-blue-400'}`}>
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <p className="text-[10px] text-gray-500 font-bold flex items-center gap-2">
                                    {p.id}
                                    <span className="flex items-center gap-1 text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded-full"><Cpu className="w-2.5 h-2.5" />IA</span>
                                </p>
                                <p className="text-sm font-bold text-white mt-0.5">{p.binName}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${priorityColors[p.priority]}`}>{p.priority}</span>
                        </div>

                        <p className="text-xs text-gray-300 mb-3">{p.message}</p>

                        {/* Barre de progression temps restant */}
                        <div className="space-y-1.5 mb-3">
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-500">Fenêtre d'intervention</span>
                                <span className="font-semibold text-white">{p.estimatedHours}h restantes</span>
                            </div>
                            <div className="w-full h-2 bg-[#1E293B] rounded-full overflow-hidden">
                                <div className={`h-full rounded-full transition-all duration-700 ${p.priority === 'high' ? 'bg-red-500' : p.priority === 'medium' ? 'bg-amber-400' : 'bg-blue-400'}`} style={{ width: `${100 - p.progress}%` }} />
                            </div>
                        </div>

                        {/* Métriques IA */}
                        <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-[#334155]/50">
                            <div className="text-center">
                                <div className="flex items-center justify-center gap-1">
                                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                                    <span className="text-xs font-bold text-emerald-400">{p.confidence}%</span>
                                </div>
                                <p className="text-[9px] text-gray-600 mt-0.5">Confiance</p>
                            </div>
                            <div className="text-center">
                                <div className="flex items-center justify-center gap-1">
                                    <Activity className="w-3 h-3 text-purple-400" />
                                    <span className="text-xs font-bold text-white">{p.riskScore}</span>
                                </div>
                                <p className="text-[9px] text-gray-600 mt-0.5">Risque</p>
                            </div>
                            <div className="text-center">
                                <div className="flex items-center justify-center gap-1">
                                    <Sigma className="w-3 h-3 text-cyan-400" />
                                    <span className="text-xs font-bold text-white">{p.binLocation}</span>
                                </div>
                                <p className="text-[9px] text-gray-600 mt-0.5">Localisation</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 overflow-x-auto no-scrollbar">
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg bg-[#1E293B]/80 text-gray-500 hover:text-white disabled:opacity-30 transition-all shrink-0"><ChevronLeft className="w-4 h-4" /></button>
                    {Array.from({ length: totalPages }, (_, i) => (
                        <button key={i} onClick={() => setPage(i + 1)} className={`w-8 h-8 rounded-lg text-xs font-bold transition-all shrink-0 ${page === i + 1 ? 'bg-purple-600 text-white shadow-lg' : 'bg-[#1E293B]/80 text-gray-500 hover:text-white'}`}>{i + 1}</button>
                    ))}
                    <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg bg-[#1E293B]/80 text-gray-500 hover:text-white disabled:opacity-30 transition-all shrink-0"><ChevronRight className="w-4 h-4" /></button>
                </div>
            )}

            {/* Modèle info */}
            <div className="glass rounded-xl p-4 flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5"><GitBranch className="w-3.5 h-3.5 text-purple-400" />{modelInfo.version}</span>
                    <span className="flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5 text-cyan-400" />{modelInfo.algorithm}</span>
                    <span className="flex items-center gap-1.5"><Sigma className="w-3.5 h-3.5 text-emerald-400" />{modelInfo.dataPoints} entrées</span>
                </div>
                <span>Dernier entraînement : {modelInfo.trained}</span>
            </div>
        </div>
    )
}

PredictionsPage.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>
export default PredictionsPage
