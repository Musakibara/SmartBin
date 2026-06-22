import { useState, useMemo, useEffect, useRef } from 'react'
import { Search, SlidersHorizontal, MapPin, BatteryCharging, Thermometer, Trash2, ArrowUpDown, ChevronLeft, ChevronRight, AlertTriangle, X, Clock, Brain, Activity, Map as MapIcon, Grid3X3, Crosshair } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import AppLayout from '../../Layouts/AppLayout'
import StatusBadge from '../../Components/StatusBadge'
import { useToast } from '../../Components/Toast'
import { usePage, router } from '@inertiajs/react'

const markerIcon = L.divIcon({
    className: '',
    html: '<div style="width:12px;height:12px;border-radius:50%;background:#10B981;border:2px solid #fff;box-shadow:0 0 0 4px rgba(16,185,129,0.2)"></div>',
    iconSize: [12, 12],
    iconAnchor: [6, 6],
})
const markerIconWarning = L.divIcon({
    className: '',
    html: '<div style="width:12px;height:12px;border-radius:50%;background:#f59e0b;border:2px solid #fff;box-shadow:0 0 0 4px rgba(245,158,11,0.2)"></div>',
    iconSize: [12, 12],
    iconAnchor: [6, 6],
})
const markerIconFull = L.divIcon({
    className: '',
    html: '<div class="animate-pulse" style="width:14px;height:14px;border-radius:50%;background:#ef4444;border:2px solid #fff;box-shadow:0 0 0 6px rgba(239,68,68,0.3)"></div>',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
})

const statusFilters = ['Tous', 'Normal', 'Attention', 'Pleine'] as const
const sortOptions = [
    { label: 'Nom', value: 'name' as const },
    { label: 'Remplissage', value: 'fillLevel' as const },
    { label: 'Batterie', value: 'battery' as const },
    { label: 'Température', value: 'temperature' as const },
]
const PER_PAGE = 9

const pickerIcon = L.divIcon({
    className: '',
    html: '<div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#10B981,#059669);border:3px solid #fff;box-shadow:0 2px 12px rgba(16,185,129,0.5)"></div>',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
})

interface NominatimResult {
    display_name: string
    lat: string
    lon: string
}

function MapClickPicker({ lat, lng, onLocationChange }: { lat: number; lng: number; onLocationChange: (lat: number, lng: number) => void }) {
    const mapRef = useRef<HTMLDivElement>(null)
    const markerRef = useRef<L.Marker | null>(null)
    const instanceRef = useRef<L.Map | null>(null)
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<NominatimResult[]>([])
    const [searching, setSearching] = useState(false)
    const [showResults, setShowResults] = useState(false)
    const debounceRef = useRef<ReturnType<typeof setTimeout>>()

    useEffect(() => {
        if (!mapRef.current || instanceRef.current) return

        const map = L.map(mapRef.current, { zoomControl: false }).setView([lat, lng], 14)
        instanceRef.current = map

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap',
        }).addTo(map)

        const marker = L.marker([lat, lng], { draggable: true, icon: pickerIcon }).addTo(map)
        markerRef.current = marker

        function handleMove(m: L.Marker) {
            const pos = m.getLatLng()
            onLocationChange(Math.round(pos.lat * 10000) / 10000, Math.round(pos.lng * 10000) / 10000)
        }

        marker.on('dragend', () => handleMove(marker))
        map.on('click', (e: L.LeafletMouseEvent) => {
            marker.setLatLng(e.latlng)
            handleMove(marker)
        })

        return () => {
            map.remove()
            instanceRef.current = null
            markerRef.current = null
        }
    }, [])

    useEffect(() => {
        if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng])
            instanceRef.current?.setView([lat, lng], instanceRef.current.getZoom())
        }
    }, [lat, lng])

    function onSearch(value: string) {
        setQuery(value)
        setShowResults(true)
        if (debounceRef.current) clearTimeout(debounceRef.current)
        if (!value.trim()) { setResults([]); return }

        debounceRef.current = setTimeout(async () => {
            setSearching(true)
            try {
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&limit=5&countrycodes=cm`,
                    { headers: { 'User-Agent': 'SmartBin/1.0' } }
                )
                const data: NominatimResult[] = await res.json()
                setResults(data)
            } catch { setResults([]) }
            setSearching(false)
        }, 500)
    }

    function selectResult(r: NominatimResult) {
        const newLat = Math.round(parseFloat(r.lat) * 10000) / 10000
        const newLng = Math.round(parseFloat(r.lon) * 10000) / 10000
        onLocationChange(newLat, newLng)
        setQuery(r.display_name.split(',')[0])
        setResults([])
        setShowResults(false)
    }

    return (
        <div className="relative w-full h-full min-h-[300px] sm:min-h-[350px]">
            {/* Barre de recherche */}
            <div className="absolute top-3 left-3 right-3 z-[1000]">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Rechercher un lieu (Yaoundé, Bastos...)"
                        value={query}
                        onChange={(e) => onSearch(e.target.value)}
                        onFocus={() => setShowResults(true)}
                        className="w-full pl-9 pr-3 py-2 bg-[#0F172A]/90 backdrop-blur-md rounded-lg border border-[#334155] focus:border-emerald-500 outline-none text-xs text-white placeholder:text-gray-500 transition-all"
                    />
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    {searching && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />}
                </div>
                {/* Dropdown résultats */}
                {showResults && results.length > 0 && (
                    <div className="mt-1 bg-[#0F172A]/95 backdrop-blur-md rounded-lg border border-[#334155] overflow-hidden shadow-xl">
                        {results.map((r, i) => (
                            <button
                                key={i}
                                onClick={() => selectResult(r)}
                                className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-white/5 hover:text-white transition-all border-b border-[#334155]/50 last:border-0"
                            >
                                <span className="line-clamp-1">{r.display_name}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
            {/* Carte */}
            <div ref={mapRef} className="w-full h-full min-h-[300px] sm:min-h-[350px]" />
        </div>
    )
}

function BinsPage() {
    const { bins: initialBins } = usePage().props as unknown as { bins: Array<{
        id: string; name: string; location: string; fillLevel: number
        status: 'normal' | 'warning' | 'full'; lastUpdate: string
        lat: number; lng: number; battery: number; temperature: number
    }> }
    const userRole = (usePage().props as { auth?: { user?: { role?: string } } })?.auth?.user?.role

    type BinType = typeof initialBins[number]

    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('Tous')
    const [sortBy, setSortBy] = useState<'name' | 'fillLevel' | 'battery' | 'temperature'>('name')
    const [sortAsc, setSortAsc] = useState(true)
    const [page, setPage] = useState(1)
    const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid')
    const [mapReady, setMapReady] = useState(false)
    const [showAddModal, setShowAddModal] = useState(false)
    const [editingBin, setEditingBin] = useState<typeof initialBins[number] | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<typeof initialBins[number] | null>(null)
    const [localBins, setLocalBins] = useState(initialBins)

    useEffect(() => { setMapReady(true) }, [])
    useEffect(() => { setLocalBins(initialBins) }, [initialBins])

    const result = useMemo(() => {
        return localBins
            .filter((bin) => {
                const matchSearch = bin.id.toLowerCase().includes(search.toLowerCase()) ||
                    bin.name.toLowerCase().includes(search.toLowerCase()) ||
                    bin.location.toLowerCase().includes(search.toLowerCase())
                const matchStatus = statusFilter === 'Tous' ||
                    (statusFilter === 'Normal' && bin.status === 'normal') ||
                    (statusFilter === 'Attention' && bin.status === 'warning') ||
                    (statusFilter === 'Pleine' && bin.status === 'full')
                return matchSearch && matchStatus
            })
            .sort((a, b) => {
                const dir = sortAsc ? 1 : -1
                if (sortBy === 'name') return a.name.localeCompare(b.name) * dir
                return (a[sortBy] - b[sortBy]) * dir
            })
    }, [search, statusFilter, sortBy, sortAsc, localBins])

    const totalPages = Math.ceil(result.length / PER_PAGE)
    const paginated = result.slice((page - 1) * PER_PAGE, page * PER_PAGE)

    function fillLevelStyles(level: number) {
        if (level > 80) return { text: 'text-red-400', bg: 'bg-red-500', bar: 'bg-red-500/20' }
        if (level > 50) return { text: 'text-orange-400', bg: 'bg-orange-400', bar: 'bg-orange-400/20' }
        return { text: 'text-emerald-400', bg: 'bg-emerald-500', bar: 'bg-emerald-500/20' }
    }

    // Génére un historique cohérent pour chaque benne
    function binHistory(currentLevel: number) {
        const now = new Date()
        return Array.from({ length: 8 }, (_, i) => {
            const t = new Date(now.getTime() - (7 - i) * 3 * 3600000)
            const hour = t.getHours().toString().padStart(2, '0') + 'h'
            const variation = Math.sin(i * 0.8) * 15 + (Math.random() - 0.5) * 8
            return { time: hour, value: Math.max(0, Math.min(100, currentLevel + variation)) }
        })
    }

    const [selectedBin, setSelectedBin] = useState<BinType | null>(null)

    // Gestion de la modale
    const binDetailAlerts: Array<{ id: string; message: string; severity: string; time: string }> = []
    const binPredictions: Array<{ id: string; message: string; priority: string; estimatedHours: number }> = []
    const binHistoryData = useMemo(() =>
        selectedBin ? binHistory(selectedBin.fillLevel) : [],
    [selectedBin])

    // Close modal on Escape
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape') setSelectedBin(null)
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [])

    useEffect(() => { setPage(1) }, [search, statusFilter])

    const [form, setForm] = useState({ name: '', location: '', lat: 3.848, lng: 11.502 })
    const { notify } = useToast()

    function openEdit(bin: typeof initialBins[number]) {
        setEditingBin(bin)
        setForm({ name: bin.name, location: bin.location, lat: bin.lat, lng: bin.lng })
        setShowAddModal(true)
    }

    function openAdd() {
        setEditingBin(null)
        setForm({ name: '', location: '', lat: 3.848, lng: 11.502 })
        setShowAddModal(true)
    }

    function saveBin() {
        if (!form.name.trim() || !form.location.trim()) return

        if (editingBin) {
            router.patch(`/bins/${editingBin.id}`, { name: form.name, location: form.location }, { preserveScroll: true })
            notify({ message: 'Benne modifiée', sub: `${form.name} — ${form.location}`, type: 'info' })
        } else {
            router.post('/bins', { name: form.name, location: form.location, latitude: form.lat, longitude: form.lng }, { preserveScroll: true })
            notify({ message: 'Nouvelle benne ajoutée', sub: `${form.name} — ${form.location}`, type: 'success' })
        }

        setForm({ name: '', location: '', lat: 3.848, lng: 11.502 })
        setShowAddModal(false)
        setEditingBin(null)
    }

    function confirmDelete() {
        if (!deleteTarget) return
        router.delete(`/bins/${deleteTarget.id}`, { preserveScroll: true })
        setLocalBins((prev) => prev.filter((b) => b.id !== deleteTarget.id))
        notify({ message: 'Benne supprimée', sub: `${deleteTarget.name} — ${deleteTarget.location}`, type: 'success' })
        setDeleteTarget(null)
    }

    return (
        <div className="space-y-6">
            {/* Bannière de confirmation suppression */}
            {deleteTarget && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex items-center bg-gradient-to-r from-red-600/95 to-red-700/95 backdrop-blur-md border border-red-400/30 shadow-2xl shadow-red-900/50 animate-slide-down rounded-xl">
                    <div className="flex items-center gap-4 py-2.5 px-5 justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-white">Supprimer la benne</p>
                                <p className="text-xs text-red-200/80">{deleteTarget.name} — {deleteTarget.location}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={confirmDelete} className="px-4 py-1.5 bg-white text-red-700 text-xs font-bold rounded-lg hover:bg-red-50 transition-all shadow-lg">Confirmer</button>
                            <button onClick={() => setDeleteTarget(null)} className="px-4 py-1.5 bg-white/10 text-white text-xs font-semibold rounded-lg hover:bg-white/20 transition-all">Annuler</button>
                        </div>
                    </div>
                </div>
            )}

            {/* En-tête */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-white">Smart Bins</h1>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{localBins.length} total</span>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">Gestion du réseau de bennes connectées</p>
                </div>
                {(userRole === 'ADMIN' || userRole === 'SUPERVISEUR' || userRole === 'OPERATEUR') && (
                    <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors">
                        <Trash2 className="w-4 h-4" />
                        Ajouter une benne
                    </button>
                )}
            </div>

            {/* Barre de filtres & tri */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Rechercher par ID, nom ou emplacement..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                            className="w-full pl-10 pr-4 py-2.5 bg-[#1E293B]/80 rounded-xl border border-[#334155] focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] text-sm text-[#f8fafc] placeholder:text-[#94a3b8] outline-none transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <SlidersHorizontal className="w-4 h-4 text-gray-500 shrink-0" />
                        {statusFilters.map((filter) => (
                            <button
                                key={filter}
                                onClick={() => { setStatusFilter(filter); setPage(1) }}
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
                <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
                    <ArrowUpDown className="w-3.5 h-3.5" />
                    <span>Trier par :</span>
                    {sortOptions.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => {
                                if (sortBy === opt.value) setSortAsc(!sortAsc)
                                else { setSortBy(opt.value); setSortAsc(true) }
                                setPage(1)
                            }}
                            className={`px-2.5 py-1 rounded-md transition-all ${
                                sortBy === opt.value
                                    ? 'bg-white/10 text-white'
                                    : 'hover:text-gray-200 hover:bg-white/5'
                            }`}
                        >
                            {opt.label} {sortBy === opt.value && (sortAsc ? '↑' : '↓')}
                        </button>
                    ))}
                    <div className="sm:ml-auto flex items-center gap-1 bg-[#1E293B]/60 rounded-lg p-0.5 border border-[#334155]">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                                viewMode === 'grid' ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-500 hover:text-gray-200'
                            }`}
                        >
                            <Grid3X3 className="w-3 h-3" /> Grille
                        </button>
                        <button
                            onClick={() => setViewMode('map')}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                                viewMode === 'map' ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-500 hover:text-gray-200'
                            }`}
                        >
                            <MapIcon className="w-3 h-3" /> Carte
                        </button>
                    </div>
                </div>
            </div>

            {/* Vue Grille */}
            {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {paginated.map((bin) => {
                    const styles = fillLevelStyles(bin.fillLevel)
                    const alertCount = 0
                    return (
                        <div
                            key={bin.id}
                            onClick={() => setSelectedBin(bin)}
                            className="group glass rounded-xl p-5 hover:bg-[rgba(255,255,255,0.06)] transition-all duration-300 cursor-pointer w-full text-left"
                        >
                            {/* En-tête carte */}
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{bin.id}</p>
                                    <h3 className="text-base font-bold text-white mt-0.5">{bin.name}</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    {alertCount > 0 && (
                                        <span className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                                            <AlertTriangle className="w-3 h-3" />
                                            {alertCount}
                                        </span>
                                    )}
                                    <StatusBadge status={bin.status} />
                                </div>
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

                            {/* Métriques supplémentaires + actions */}
                            <div className="flex items-center gap-4 text-xs text-gray-500 pt-3 border-t border-[#334155]/50">
                                <span className="flex items-center gap-1.5">
                                    <BatteryCharging className="w-3.5 h-3.5" />
                                    {bin.battery}%
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Thermometer className="w-3.5 h-3.5" />
                                    {bin.temperature}°C
                                </span>
                                <span className="text-gray-600">{bin.lastUpdate}</span>

                                <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                                    {(userRole === 'ADMIN' || userRole === 'SUPERVISEUR' || userRole === 'OPERATEUR') && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); openEdit(bin) }}
                                            className="p-2 rounded-lg bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 hover:text-blue-300 transition-all"
                                            title="Modifier"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                        </button>
                                    )}
                                    {(userRole === 'ADMIN' || userRole === 'SUPERVISEUR') && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setDeleteTarget(bin) }}
                                            className="p-2 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 hover:text-red-300 transition-all"
                                            title="Supprimer"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
            )}

            {/* Vue Carte */}
            {viewMode === 'map' && (
                <div className="glass rounded-xl overflow-hidden h-[600px] relative">
                    {/* Légende */}
                    <div className="absolute top-4 left-4 z-[9999] flex flex-col gap-2">
                        <div className="bg-[#1E293B] p-2 rounded-lg flex gap-3 shadow-lg border border-white/10">
                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div><span className="text-[10px] text-gray-200">Normal</span></div>
                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-orange-400"></div><span className="text-[10px] text-gray-200">Attention</span></div>
                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500"></div><span className="text-[10px] text-gray-200">Pleine</span></div>
                        </div>
                    </div>
                    {mapReady && (
                        <MapContainer
                            center={[3.848, 11.502]}
                            zoom={13}
                            className="h-full w-full"
                            zoomControl={false}
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            {localBins.map((bin) => (
                                <Marker
                                    key={bin.id}
                                    position={[bin.lat, bin.lng]}
                                    icon={bin.status === 'full' ? markerIconFull : bin.status === 'warning' ? markerIconWarning : markerIcon}
                                >
                                    <Popup>
                                        <div className="text-sm">
                                            <p className="font-semibold">{bin.id} - {bin.name}</p>
                                            <p className="text-gray-600 text-xs mt-1">{bin.location}</p>
                                            <p className="mt-1">
                                                Remplissage : <span className={`font-medium ${bin.fillLevel > 80 ? 'text-red-500' : bin.fillLevel > 50 ? 'text-amber-500' : 'text-emerald-500'}`}>{bin.fillLevel}%</span>
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">Dernière mise à jour : {bin.lastUpdate}</p>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}
                        </MapContainer>
                    )}
                </div>
            )}

            {/* Pagination (grille uniquement) */}
            {viewMode === 'grid' && totalPages > 1 && (
                <div className="flex items-center justify-center gap-1 sm:gap-3 text-sm overflow-x-auto no-scrollbar">
                    <button
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page <= 1}
                        className="flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all shrink-0"
                    >
                        <ChevronLeft className="w-4 h-4" /> <span className="hidden sm:inline">Prev</span>
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPage(p)}
                            className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                                p === page
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : 'text-gray-500 hover:text-gray-200 hover:bg-white/5'
                            }`}
                        >
                            {p}
                        </button>
                    ))}
                    <button
                        onClick={() => setPage(Math.min(totalPages, page + 1))}
                        disabled={page >= totalPages}
                        className="flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all shrink-0"
                    >
                        <span className="hidden sm:inline">Next</span> <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Modale de détail benne */}
            {selectedBin && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelectedBin(null)}>
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                    <div
                        className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto glass rounded-2xl p-6 sm:p-8 border border-[#334155] shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header modal */}
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{selectedBin.id}</p>
                                    <StatusBadge status={selectedBin.status} />
                                </div>
                                <h2 className="text-xl font-bold text-white">{selectedBin.name}</h2>
                            </div>
                            <button onClick={() => setSelectedBin(null)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Métriques principales */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                            {[
                                { label: 'Remplissage', value: `${selectedBin.fillLevel}%`, color: fillLevelStyles(selectedBin.fillLevel).text },
                                { label: 'Batterie', value: `${selectedBin.battery}%`, icon: BatteryCharging, color: selectedBin.battery > 20 ? 'text-emerald-400' : 'text-red-400' },
                                { label: 'Température', value: `${selectedBin.temperature}°C`, icon: Thermometer, color: 'text-orange-400' },
                                { label: 'Localisation', value: selectedBin.location, icon: MapPin, color: 'text-blue-400' },
                            ].map((m) => (
                                <div key={m.label} className="bg-[#1E293B]/60 rounded-xl p-3">
                                    <div className="flex items-center gap-1.5 text-[10px] text-gray-500 mb-1">
                                        {m.icon && <m.icon className="w-3 h-3" />}
                                        {m.label}
                                    </div>
                                    <p className={`text-sm font-bold ${m.color}`}>{m.value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Graphique d'évolution */}
                        <div className="mb-6">
                            <h3 className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 mb-3">
                                <Activity className="w-3.5 h-3.5" />
                                Évolution du remplissage (24h)
                            </h3>
                            <div className="bg-[#1E293B]/40 rounded-xl p-4">
                                <ResponsiveContainer width="100%" height={180}>
                                    <LineChart data={binHistoryData}>
                                        <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <Tooltip
                                            contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
                                            labelStyle={{ color: '#94a3b8' }}
                                            formatter={(value) => [`${Math.round(Number(value))}%`, 'Remplissage']}
                                        />
                                        <Line type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#10B981' }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Alertes & Prédictions */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <h3 className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 mb-2">
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                    Alertes ({binDetailAlerts.length})
                                </h3>
                                <div className="space-y-1.5">
                                    {binDetailAlerts.length === 0 ? (
                                        <p className="text-xs text-gray-600 italic">Aucune alerte</p>
                                    ) : binDetailAlerts.map((a) => (
                                        <div key={a.id} className="flex items-start gap-2 bg-[#1E293B]/40 rounded-lg p-2.5">
                                            <div className={`mt-0.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                                                a.severity === 'critical' ? 'bg-red-500' :
                                                a.severity === 'high' ? 'bg-orange-500' :
                                                a.severity === 'medium' ? 'bg-amber-500' : 'bg-yellow-500'
                                            }`} />
                                            <div className="min-w-0">
                                                <p className="text-xs text-gray-300">{a.message}</p>
                                                <p className="text-[10px] text-gray-600 mt-0.5">{a.time}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h3 className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 mb-2">
                                    <Brain className="w-3.5 h-3.5" />
                                    Prédictions ({binPredictions.length})
                                </h3>
                                <div className="space-y-1.5">
                                    {binPredictions.length === 0 ? (
                                        <p className="text-xs text-gray-600 italic">Aucune prédiction</p>
                                    ) : binPredictions.map((p) => (
                                        <div key={p.id} className="bg-[#1E293B]/40 rounded-lg p-2.5">
                                            <div className="flex items-center gap-1.5 text-xs text-gray-300">
                                                <Clock className="w-3 h-3 text-blue-400" />
                                                <span>{p.message}</span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                                    p.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                                                    p.priority === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                                                    'bg-yellow-500/20 text-yellow-400'
                                                }`}>{p.priority}</span>
                                                <span className="text-[10px] text-gray-600">Estimé dans {p.estimatedHours}h</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Dernière mise à jour */}
                        <p className="text-[10px] text-gray-700 text-center mt-6">Dernière mise à jour : {selectedBin.lastUpdate}</p>
                    </div>
                </div>
            )}

            {/* Modale d'ajout / modification de benne */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => { setShowAddModal(false); setEditingBin(null) }}>
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                    <div className="relative w-full max-w-3xl glass rounded-2xl border border-[#334155] shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 pt-6 pb-3">
                            <h2 className="text-lg font-bold text-white">{editingBin ? 'Modifier' : 'Nouvelle'} benne</h2>
                            <button onClick={() => { setShowAddModal(false); setEditingBin(null) }} className="p-1 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-all">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-6 p-6 pt-3">
                            {/* Colonne gauche : formulaire */}
                            <div className="sm:w-72 space-y-4 shrink-0">
                                <div>
                                    <label className="text-[12px] font-medium text-gray-400 mb-1.5 block">Quartier</label>
                                    <input type="text" placeholder="Ex: Mfoundi, Bastos, Mokolo..." value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        className="w-full px-3 py-2.5 bg-[#1E293B]/80 rounded-lg border border-[#334155] focus:border-emerald-500 outline-none text-sm text-white placeholder:text-gray-600 transition-all" />
                                </div>
                                <div>
                                    <label className="text-[12px] font-medium text-gray-400 mb-1.5 block">Adresse</label>
                                    <input type="text" placeholder="Ex: Avenue Kennedy, Rue de la Paix..." value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                                        className="w-full px-3 py-2.5 bg-[#1E293B]/80 rounded-lg border border-[#334155] focus:border-emerald-500 outline-none text-sm text-white placeholder:text-gray-600 transition-all" />
                                </div>
                                <div className="flex items-center gap-2 py-2 px-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                                    <Crosshair className="w-4 h-4 text-emerald-400 shrink-0" />
                                    <div className="text-xs text-gray-400">
                                        <span className="text-gray-300 font-medium">{form.lat.toFixed(4)}</span>, <span className="text-gray-300 font-medium">{form.lng.toFixed(4)}</span>
                                    </div>
                                </div>
                                <button onClick={saveBin}
                                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors">
                                    {editingBin ? 'Enregistrer' : 'Ajouter'}
                                </button>
                            </div>

                            {/* Colonne droite : carte de sélection */}
                            <div className="flex-1 min-h-[300px] sm:min-h-[350px] rounded-xl overflow-hidden border border-[#334155] relative">
                                <MapClickPicker lat={form.lat} lng={form.lng} onLocationChange={(lat, lng) => setForm({ ...form, lat, lng })} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Message si aucun résultat (grille uniquement) */}
            {viewMode === 'grid' && paginated.length === 0 && (
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
