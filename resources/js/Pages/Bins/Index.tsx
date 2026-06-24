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
import { useTranslation } from 'react-i18next'

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
    const { t } = useTranslation()
    const mapRef = useRef<HTMLDivElement>(null)
    const markerRef = useRef<L.Marker | null>(null)
    const instanceRef = useRef<L.Map | null>(null)
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<NominatimResult[]>([])
    const [searching, setSearching] = useState(false)
    const [showResults, setShowResults] = useState(false)
    const [searchError, setSearchError] = useState('')
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const pendingQueryRef = useRef('')
    const editingRef = useRef(false)

    const [coordLat, setCoordLat] = useState(lat.toFixed(6))
    const [coordLng, setCoordLng] = useState(lng.toFixed(6))

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
            editingRef.current = false
            setCoordLat(pos.lat.toFixed(6))
            setCoordLng(pos.lng.toFixed(6))
            onLocationChange(pos.lat, pos.lng)
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
        if (!editingRef.current) {
            setCoordLat(lat.toFixed(6))
            setCoordLng(lng.toFixed(6))
        }
    }, [lat, lng])

    useEffect(() => {
        if (!searching) return
        const q = pendingQueryRef.current
        const controller = new AbortController()
        let rafId: number

        rafId = requestAnimationFrame(() => {
            fetch(`/api/geocode/search?q=${encodeURIComponent(q)}`, { signal: controller.signal })
                .then((res) => {
                    if (!res.ok) throw new Error('Erreur serveur')
                    return res.json() as Promise<NominatimResult[]>
                })
                .then((data) => setResults(data))
                .catch(() => { if (!controller.signal.aborted) { setResults([]); setSearchError(t('bins.searchError')) } })
                .finally(() => { if (!controller.signal.aborted) setSearching(false) })
        })

        return () => { controller.abort(); cancelAnimationFrame(rafId) }
    }, [searching])

    function onSearch(value: string) {
        setQuery(value)
        setShowResults(true)
        setSearchError('')
        if (debounceRef.current) clearTimeout(debounceRef.current)
        if (!value.trim()) { setResults([]); return }

        debounceRef.current = setTimeout(() => {
            pendingQueryRef.current = value
            setSearching(true)
        }, 500)
    }

    function selectResult(r: NominatimResult) {
        onLocationChange(parseFloat(r.lat), parseFloat(r.lon))
        setCoordLat(r.lat)
        setCoordLng(r.lon)
        setQuery(r.display_name.split(',')[0])
        setResults([])
        setShowResults(false)
    }

    function applyCoordInput() {
        editingRef.current = false
        const newLat = parseFloat(coordLat)
        const newLng = parseFloat(coordLng)
        if (isNaN(newLat) || isNaN(newLng)) {
            setCoordLat(lat.toFixed(6))
            setCoordLng(lng.toFixed(6))
            return
        }
        const clampedLat = Math.max(-90, Math.min(90, newLat))
        const clampedLng = Math.max(-180, Math.min(180, newLng))
        setCoordLat(clampedLat.toFixed(6))
        setCoordLng(clampedLng.toFixed(6))
        if (clampedLat !== lat || clampedLng !== lng) {
            onLocationChange(clampedLat, clampedLng)
        }
    }

    return (
        <div className="relative w-full h-full min-h-[300px] sm:min-h-[350px]">
            {/* Barre de recherche */}
            <div className="absolute top-3 left-3 right-3 z-[1000]">
                <div className="relative">
                    <input
                        type="text"
                        placeholder={t('bins.searchPlace')}
                        value={query}
                        onChange={(e) => onSearch(e.target.value)}
                        onFocus={() => setShowResults(true)}
                        className="w-full pl-9 pr-3 py-2 bg-bg-secondary/90 backdrop-blur-md rounded-lg border border-border focus:border-emerald-500 outline-none text-xs text-text-primary placeholder:text-text-muted transition-all"
                    />
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    {searching && <span className="absolute right-3 top-1/2 -translate-y-1/2"><span className="block w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></span>}
                </div>
                {/* Dropdown résultats */}
                {showResults && results.length > 0 && (
                    <div className="mt-1 bg-bg-secondary/95 backdrop-blur-md rounded-lg border border-border overflow-hidden shadow-xl max-h-48 overflow-y-auto">
                        {results.map((r, i) => (
                            <button
                                key={i}
                                onClick={() => selectResult(r)}
                                className="w-full text-left px-3 py-2 text-xs text-text-primary hover:bg-white/5 hover:text-text-primary transition-all border-b border-border/50 last:border-0"
                            >
                                <span>{r.display_name}</span>
                            </button>
                        ))}
                    </div>
                )}
                {showResults && !searching && query && results.length === 0 && (
                    <div className="mt-1 bg-bg-secondary/95 backdrop-blur-md rounded-lg border border-border px-3 py-2 text-xs text-text-muted">
                        {searchError || t('common.noResults')}
                    </div>
                )}
                {/* Coordonnées manuelles */}
                <div className="mt-2 flex gap-2">
                    <div className="flex-1">
                        <label className="block text-[10px] font-medium uppercase tracking-wider text-text-muted mb-0.5">{t('bins.coordLat')}</label>
                        <input
                            type="text"
                            value={coordLat}
                            onFocus={() => { editingRef.current = true; setShowResults(false) }}
                            onChange={(e) => setCoordLat(e.target.value)}
                            onBlur={applyCoordInput}
                            onKeyDown={(e) => { if (e.key === 'Enter') { (e.target as HTMLInputElement).blur() } }}
                            className="w-full px-2 py-1.5 bg-bg-secondary/80 backdrop-blur-md rounded border border-border focus:border-emerald-500 outline-none text-[11px] text-text-primary font-mono transition-all"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-[10px] font-medium uppercase tracking-wider text-text-muted mb-0.5">{t('bins.coordLng')}</label>
                        <input
                            type="text"
                            value={coordLng}
                            onFocus={() => { editingRef.current = true; setShowResults(false) }}
                            onChange={(e) => setCoordLng(e.target.value)}
                            onBlur={applyCoordInput}
                            onKeyDown={(e) => { if (e.key === 'Enter') { (e.target as HTMLInputElement).blur() } }}
                            className="w-full px-2 py-1.5 bg-bg-secondary/80 backdrop-blur-md rounded border border-border focus:border-emerald-500 outline-none text-[11px] text-text-primary font-mono transition-all"
                        />
                    </div>
                </div>
                <p className="mt-1 text-[10px] text-text-muted text-center">
                    {t('bins.coordHint')}
                </p>
            </div>
            {/* Carte */}
            <div ref={mapRef} className="w-full h-full min-h-[300px] sm:min-h-[350px]" />
        </div>
    )
}

function BinsPage() {
    const { t } = useTranslation()
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
            notify({ message: t('bins.toastModified'), sub: `${form.name} — ${form.location}`, type: 'info' })
        } else {
            router.post('/bins', { name: form.name, location: form.location, latitude: form.lat, longitude: form.lng }, { preserveScroll: true })
            notify({ message: t('bins.toastAdded'), sub: `${form.name} — ${form.location}`, type: 'success' })
        }

        setForm({ name: '', location: '', lat: 3.848, lng: 11.502 })
        setShowAddModal(false)
        setEditingBin(null)
    }

    function confirmDelete() {
        if (!deleteTarget) return
        router.delete(`/bins/${deleteTarget.id}`, { preserveScroll: true })
        setLocalBins((prev) => prev.filter((b) => b.id !== deleteTarget.id))
        notify({ message: t('bins.toastDeleted'), sub: `${deleteTarget.name} — ${deleteTarget.location}`, type: 'success' })
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
                                <svg className="w-4 h-4 text-text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-text-primary">{t('bins.deleteConfirm')}</p>
                                <p className="text-xs text-red-200/80">{deleteTarget.name} — {deleteTarget.location}</p>
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
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-text-primary">{t('bins.title')}</h1>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{localBins.length} {t('common.total')}</span>
                    </div>
                    <p className="text-sm text-text-secondary mt-1">{t('bins.subtitle')}</p>
                </div>
                {(userRole === 'ADMIN' || userRole === 'SUPERVISEUR' || userRole === 'OPERATEUR') && (
                    <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-text-primary text-sm font-semibold rounded-xl transition-colors">
                        <Trash2 className="w-4 h-4" />
                        {t('bins.add')}
                    </button>
                )}
            </div>

            {/* Barre de filtres & tri */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                        <input
                            type="text"
                            placeholder={t('bins.search')}
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                            className="w-full pl-10 pr-4 py-2.5 bg-input-bg rounded-xl border border-border focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] text-sm text-text-primary placeholder:text-text-secondary outline-none transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <SlidersHorizontal className="w-4 h-4 text-text-muted shrink-0" />
                        {statusFilters.map((filter) => (
                            <button
                                key={filter}
                                onClick={() => { setStatusFilter(filter); setPage(1) }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                    statusFilter === filter
                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                        : 'text-text-secondary border border-transparent hover:text-text-primary hover:bg-white/5'
                                }`}
                            >
                                {filter === 'Tous' ? t('bins.filterAll') : filter === 'Normal' ? t('bins.filterNormal') : filter === 'Attention' ? t('bins.filterWarning') : t('bins.filterFull')}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-text-secondary flex-wrap">
                    <ArrowUpDown className="w-3.5 h-3.5" />
                    <span>{t('bins.sortBy')}</span>
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
                                    ? 'bg-white/10 text-text-primary'
                                    : 'hover:text-text-primary hover:bg-white/5'
                            }`}
                        >
                            {opt.value === 'name' ? t('bins.sortName') : opt.value === 'fillLevel' ? t('bins.sortFill') : opt.value === 'battery' ? t('bins.sortBattery') : t('bins.sortTemp')} {sortBy === opt.value && (sortAsc ? '↑' : '↓')}
                        </button>
                    ))}
                    <div className="sm:ml-auto flex items-center gap-1 bg-bg-card/60 rounded-lg p-0.5 border border-border">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                                viewMode === 'grid' ? 'bg-emerald-500/20 text-emerald-400' : 'text-text-muted hover:text-text-primary'
                            }`}
                        >
                            <Grid3X3 className="w-3 h-3" /> {t('bins.viewGrid')}
                        </button>
                        <button
                            onClick={() => setViewMode('map')}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                                viewMode === 'map' ? 'bg-emerald-500/20 text-emerald-400' : 'text-text-muted hover:text-text-primary'
                            }`}
                        >
                            <MapIcon className="w-3 h-3" /> {t('bins.viewMap')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Vue Grille */}
            {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {paginated.map((bin) => {
                    const styles = fillLevelStyles(bin.fillLevel)
                    return (
                        <div
                            key={bin.id}
                            onClick={() => setSelectedBin(bin)}
                            className="group glass rounded-xl p-5 hover:bg-[rgba(255,255,255,0.06)] transition-all duration-300 cursor-pointer w-full text-left"
                        >
                            {/* En-tête carte */}
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">{bin.id}</p>
                                    <h3 className="text-base font-bold text-text-primary mt-0.5">{bin.name}</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <StatusBadge status={bin.status} />
                                </div>
                            </div>

                            {/* Emplacement */}
                            <div className="flex items-center gap-2 text-xs text-text-secondary mb-4">
                                <MapPin className="w-3.5 h-3.5" />
                                <span>{bin.location}</span>
                            </div>

                            {/* Barre de remplissage */}
                            <div className="space-y-1.5 mb-4">
                                <div className="flex justify-between text-xs">
                                    <span className="text-text-muted">{t('bins.fillLevel')}</span>
                                    <span className={`font-semibold ${styles.text}`}>{bin.fillLevel}%</span>
                                </div>
                                <div className="w-full h-2 bg-bg-card rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${styles.bg}`}
                                        style={{ width: `${bin.fillLevel}%` }}
                                    />
                                </div>
                            </div>

                            {/* Métriques supplémentaires + actions */}
                            <div className="flex items-center gap-4 text-xs text-text-muted pt-3 border-t border-border/50">
                                <span className="flex items-center gap-1.5">
                                    <BatteryCharging className="w-3.5 h-3.5" />
                                    {bin.battery}%
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Thermometer className="w-3.5 h-3.5" />
                                    {bin.temperature}°C
                                </span>
                                <span className="text-text-muted">{bin.lastUpdate}</span>

                                <div className="ml-auto flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:sm:opacity-100 transition-all duration-300 sm:translate-x-2 group-hover:sm:translate-x-0">
                                    {(userRole === 'ADMIN' || userRole === 'SUPERVISEUR' || userRole === 'OPERATEUR') && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); openEdit(bin) }}
                                            className="p-1.5 sm:p-2 rounded-lg bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 hover:text-blue-300 transition-all"
                                            title={t('common.edit')}
                                        >
                                            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                        </button>
                                    )}
                                    {(userRole === 'ADMIN' || userRole === 'SUPERVISEUR') && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setDeleteTarget(bin) }}
                                            className="p-1.5 sm:p-2 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 hover:text-red-300 transition-all"
                                            title={t('common.delete')}
                                        >
                                            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
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
                        <div className="bg-bg-card p-2 rounded-lg flex gap-3 shadow-lg border border-white/10">
                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div><span className="text-[10px] text-text-primary">{t('bins.filterNormal')}</span></div>
                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-orange-400"></div><span className="text-[10px] text-text-primary">{t('bins.filterWarning')}</span></div>
                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500"></div><span className="text-[10px] text-text-primary">{t('bins.filterFull')}</span></div>
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
                            {result.map((bin) => (
                                <Marker
                                    key={bin.id}
                                    position={[bin.lat, bin.lng]}
                                    icon={bin.status === 'full' ? markerIconFull : bin.status === 'warning' ? markerIconWarning : markerIcon}
                                >
                                    <Popup>
                                        <div className="text-sm">
                                            <p className="font-semibold">{bin.id} - {bin.name}</p>
                                            <p className="text-text-muted text-xs mt-1">{bin.location}</p>
                                            <p className="mt-1">
                                                {t('bins.fillLevel')} : <span className={`font-medium ${bin.fillLevel > 80 ? 'text-red-500' : bin.fillLevel > 50 ? 'text-amber-500' : 'text-emerald-500'}`}>{bin.fillLevel}%</span>
                                            </p>
                                            <p className="text-xs text-text-muted mt-1">{t('bins.lastUpdate')} : {bin.lastUpdate}</p>
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
                        className="flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all shrink-0"
                    >
                        <ChevronLeft className="w-4 h-4" /> <span className="hidden sm:inline">{t('common.prev')}</span>
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPage(p)}
                            className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                                p === page
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : 'text-text-muted hover:text-text-primary hover:bg-white/5'
                            }`}
                        >
                            {p}
                        </button>
                    ))}
                    <button
                        onClick={() => setPage(Math.min(totalPages, page + 1))}
                        disabled={page >= totalPages}
                        className="flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all shrink-0"
                    >
                        <span className="hidden sm:inline">{t('common.next')}</span> <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Modale de détail benne */}
            {selectedBin && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelectedBin(null)}>
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                    <div
                        className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto glass rounded-2xl p-6 sm:p-8 border border-border shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header modal */}
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">{selectedBin.id}</p>
                                    <StatusBadge status={selectedBin.status} />
                                </div>
                                <h2 className="text-xl font-bold text-text-primary">{selectedBin.name}</h2>
                            </div>
                            <button onClick={() => setSelectedBin(null)} className="p-1.5 rounded-lg hover:bg-white/5 text-text-muted hover:text-text-primary transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Métriques principales */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                            {[
                                { key: 'fillLevel' as const, value: `${selectedBin.fillLevel}%`, color: fillLevelStyles(selectedBin.fillLevel).text },
                                { key: 'battery' as const, value: `${selectedBin.battery}%`, icon: BatteryCharging, color: selectedBin.battery > 20 ? 'text-emerald-400' : 'text-red-400' },
                                { key: 'temperature' as const, value: `${selectedBin.temperature}°C`, icon: Thermometer, color: 'text-orange-400' },
                                { key: 'location' as const, value: selectedBin.location, icon: MapPin, color: 'text-blue-400' },
                            ].map((m) => (
                                <div key={m.key} className="bg-bg-card/60 rounded-xl p-3">
                                    <div className="flex items-center gap-1.5 text-[10px] text-text-muted mb-1">
                                        {m.icon && <m.icon className="w-3 h-3" />}
                                        {m.key === 'fillLevel' ? t('bins.fillLevel') : m.key === 'battery' ? t('common.battery') : m.key === 'temperature' ? t('bins.temperature') : t('bins.locationLabel')}
                                    </div>
                                    <p className={`text-sm font-bold ${m.color}`}>{m.value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Graphique d'évolution */}
                        <div className="mb-6">
                            <h3 className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary mb-3">
                                <Activity className="w-3.5 h-3.5" />
                                {t('bins.detailTitle')}
                            </h3>
                            <div className="bg-bg-card/40 rounded-xl p-4">
                                <ResponsiveContainer width="100%" height={180}>
                                    <LineChart data={binHistoryData}>
                                        <XAxis dataKey="time" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <Tooltip
                                            contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                                            labelStyle={{ color: 'var(--text-secondary)' }}
                                            formatter={(value) => [`${Math.round(Number(value))}%`, t('bins.fillLevel')]}
                                        />
                                        <Line type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#10B981' }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Alertes & Prédictions */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <h3 className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary mb-2">
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                    {t('bins.detailAlerts')} ({binDetailAlerts.length})
                                </h3>
                                <div className="space-y-1.5">
                                    {binDetailAlerts.length === 0 ? (
                                        <p className="text-xs text-text-muted italic">{t('bins.noAlerts')}</p>
                                    ) : binDetailAlerts.map((a) => (
                                        <div key={a.id} className="flex items-start gap-2 bg-bg-card/40 rounded-lg p-2.5">
                                            <div className={`mt-0.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                                                a.severity === 'critical' ? 'bg-red-500' :
                                                a.severity === 'high' ? 'bg-orange-500' :
                                                a.severity === 'medium' ? 'bg-amber-500' : 'bg-yellow-500'
                                            }`} />
                                            <div className="min-w-0">
                                                <p className="text-xs text-text-primary">{a.message}</p>
                                                <p className="text-[10px] text-text-muted mt-0.5">{a.time}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h3 className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary mb-2">
                                    <Brain className="w-3.5 h-3.5" />
                                    {t('bins.detailPredictions')} ({binPredictions.length})
                                </h3>
                                <div className="space-y-1.5">
                                    {binPredictions.length === 0 ? (
                                        <p className="text-xs text-text-muted italic">{t('bins.noPredictions')}</p>
                                    ) : binPredictions.map((p) => (
                                        <div key={p.id} className="bg-bg-card/40 rounded-lg p-2.5">
                                            <div className="flex items-center gap-1.5 text-xs text-text-primary">
                                                <Clock className="w-3 h-3 text-blue-400" />
                                                <span>{p.message}</span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                                    p.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                                                    p.priority === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                                                    'bg-yellow-500/20 text-yellow-400'
                                                }`}>{p.priority}</span>
                                                <span className="text-[10px] text-text-muted">{t('bins.estimated', { hours: p.estimatedHours })}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Dernière mise à jour */}
                        <p className="text-[10px] text-text-muted text-center mt-6">{t('bins.lastUpdate')} : {selectedBin.lastUpdate}</p>
                    </div>
                </div>
            )}

            {/* Modale d'ajout / modification de benne */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => { setShowAddModal(false); setEditingBin(null) }}>
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                    <div className="relative w-full max-w-3xl glass rounded-2xl border border-border shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 pt-6 pb-3">
                            <h2 className="text-lg font-bold text-text-primary">{editingBin ? t('bins.edit') : t('bins.newBin')}</h2>
                            <button onClick={() => { setShowAddModal(false); setEditingBin(null) }} className="p-1 rounded-lg hover:bg-white/5 text-text-muted hover:text-text-primary transition-all">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-6 p-6 pt-3">
                            {/* Colonne gauche : formulaire */}
                            <div className="sm:w-72 space-y-4 shrink-0">
                                <div>
                                    <label className="text-[12px] font-medium text-text-secondary mb-1.5 block">{t('bins.district')}</label>
                                    <input type="text" placeholder={t('bins.districtPlaceholder')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        className="w-full px-3 py-2.5 bg-input-bg rounded-lg border border-border focus:border-emerald-500 outline-none text-sm text-text-primary placeholder:text-text-muted transition-all" />
                                </div>
                                <div>
                                    <label className="text-[12px] font-medium text-text-secondary mb-1.5 block">{t('bins.address')}</label>
                                    <input type="text" placeholder={t('bins.addressPlaceholder')} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                                        className="w-full px-3 py-2.5 bg-input-bg rounded-lg border border-border focus:border-emerald-500 outline-none text-sm text-text-primary placeholder:text-text-muted transition-all" />
                                </div>
                                <div className="flex items-center gap-2 py-2 px-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                                    <Crosshair className="w-4 h-4 text-emerald-400 shrink-0" />
                                    <div className="text-xs text-text-secondary">
                                        <span className="text-text-primary font-medium">{form.lat.toFixed(4)}</span>, <span className="text-text-primary font-medium">{form.lng.toFixed(4)}</span>
                                    </div>
                                </div>
                                <button onClick={saveBin}
                                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-text-primary text-sm font-semibold rounded-xl transition-colors">
                                    {editingBin ? t('common.save') : t('common.add')}
                                </button>
                            </div>

                            {/* Colonne droite : carte de sélection */}
                            <div className="flex-1 min-h-[300px] sm:min-h-[350px] rounded-xl overflow-hidden border border-border relative">
                                <MapClickPicker lat={form.lat} lng={form.lng} onLocationChange={(lat, lng) => setForm({ ...form, lat, lng })} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Message si aucun résultat (grille uniquement) */}
            {viewMode === 'grid' && paginated.length === 0 && (
                <div className="text-center py-16">
                    <Trash2 className="w-12 h-12 text-text-muted mx-auto mb-4" />
                    <p className="text-text-secondary text-sm">{t('bins.noBins')}</p>
                    <p className="text-text-muted text-xs mt-1">{t('bins.noBinsHint')}</p>
                </div>
            )}
        </div>
    )
}

BinsPage.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>

export default BinsPage
