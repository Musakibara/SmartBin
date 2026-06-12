import { useState } from 'react'
import { Search, SlidersHorizontal, MapPin, BatteryCharging, Thermometer, Trash2 } from 'lucide-react'
import AppLayout from '../../Layouts/AppLayout'
import StatusBadge from '../../Components/StatusBadge'
import { bins } from '../../data/mock-dashboard'
import type { Bin } from '../../data/mock-dashboard'

const statusFilters = ['Tous', 'Normal', 'Attention', 'Pleine'] as const

/**
 * Page de gestion des Smart Bins
 * Liste toutes les bennes avec filtres, recherche et vue détaillée
 */
function BinsPage() {
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('Tous')

    // Filtre les bennes selon la recherche et le statut
    function filteredBins(): Bin[] {
        return bins.filter((bin) => {
            const matchSearch = bin.id.toLowerCase().includes(search.toLowerCase()) ||
                bin.name.toLowerCase().includes(search.toLowerCase()) ||
                bin.location.toLowerCase().includes(search.toLowerCase())
            const matchStatus = statusFilter === 'Tous' ||
                (statusFilter === 'Normal' && bin.status === 'normal') ||
                (statusFilter === 'Attention' && bin.status === 'warning') ||
                (statusFilter === 'Pleine' && bin.status === 'full')
            return matchSearch && matchStatus
        })
    }

    // Couleurs selon le niveau de remplissage
    function fillLevelStyles(level: number) {
        if (level > 80) return { text: 'text-red-400', bg: 'bg-red-500', bar: 'bg-red-500/20' }
        if (level > 50) return { text: 'text-orange-400', bg: 'bg-orange-400', bar: 'bg-orange-400/20' }
        return { text: 'text-emerald-400', bg: 'bg-emerald-500', bar: 'bg-emerald-500/20' }
    }

    const result = filteredBins()

    return (
        <div className="space-y-6">
            {/* En-tête */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Smart Bins</h1>
                    <p className="text-sm text-gray-400 mt-1">Gestion du réseau de bennes connectées</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors">
                    <Trash2 className="w-4 h-4" />
                    Ajouter une benne
                </button>
            </div>

            {/* Barre de filtres */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Rechercher par ID, nom ou emplacement..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-[#1E293B]/80 rounded-xl border border-[#334155] focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] text-sm text-[#f8fafc] placeholder:text-[#94a3b8] outline-none transition-all"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-gray-500" />
                    {statusFilters.map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setStatusFilter(filter)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                statusFilter === filter
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : 'text-gray-400 border border-transparent hover:text-gray-200 hover:bg-white/5'
                            }`}
                        >
                            {filter}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grille des bennes */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {result.map((bin) => {
                    const styles = fillLevelStyles(bin.fillLevel)
                    return (
                        <div key={bin.id} className="glass rounded-xl p-5 hover:bg-[rgba(255,255,255,0.06)] transition-all duration-300">
                            {/* En-tête carte */}
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{bin.id}</p>
                                    <h3 className="text-base font-bold text-white mt-0.5">{bin.name}</h3>
                                </div>
                                <StatusBadge status={bin.status} />
                            </div>

                            {/* Emplacement */}
                            <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
                                <MapPin className="w-3.5 h-3.5" />
                                <span>{bin.location}</span>
                            </div>

                            {/* Barre de remplissage */}
                            <div className="space-y-1.5 mb-4">
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">Remplissage</span>
                                    <span className={`font-semibold ${styles.text}`}>{bin.fillLevel}%</span>
                                </div>
                                <div className="w-full h-2 bg-[#1E293B] rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${styles.bg}`}
                                        style={{ width: `${bin.fillLevel}%` }}
                                    />
                                </div>
                            </div>

                            {/* Métriques supplémentaires */}
                            <div className="flex items-center gap-4 text-xs text-gray-500 pt-3 border-t border-[#334155]/50">
                                <span className="flex items-center gap-1.5">
                                    <BatteryCharging className="w-3.5 h-3.5" />
                                    {bin.battery}%
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Thermometer className="w-3.5 h-3.5" />
                                    {bin.temperature}°C
                                </span>
                                <span className="ml-auto text-gray-600">{bin.lastUpdate}</span>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Message si aucun résultat */}
            {result.length === 0 && (
                <div className="text-center py-16">
                    <Trash2 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 text-sm">Aucune benne trouvée</p>
                    <p className="text-gray-600 text-xs mt-1">Essayez de modifier vos filtres</p>
                </div>
            )}
        </div>
    )
}

BinsPage.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>

export default BinsPage
