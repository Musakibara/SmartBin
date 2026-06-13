import { useState, useMemo } from 'react'
import { Search, User, Mail, Shield, Clock, CheckCircle, XCircle, MoreHorizontal, Edit3, Trash2, Ban, UserPlus, ChevronLeft, ChevronRight, type LucideIcon } from 'lucide-react'
import AppLayout from '../../Layouts/AppLayout'
import { useToast } from '../../Components/Toast'

interface AppUser {
    id: string
    name: string
    email: string
    role: 'Admin' | 'Superviseur' | 'Operateur' | 'Technicien'
    status: 'online' | 'offline' | 'suspendu'
    lastActive: string
    initials: string
    color: string
}

const users: AppUser[] = [
    { id: 'USR-001', name: 'Admin User', email: 'admin@smartbin.cm', role: 'Admin', status: 'online', lastActive: 'À l\'instant', initials: 'AU', color: 'from-emerald-500 to-emerald-600' },
    { id: 'USR-002', name: 'Sarah Mbah', email: 'sarah@smartbin.cm', role: 'Superviseur', status: 'online', lastActive: 'Il y a 5 min', initials: 'SM', color: 'from-blue-500 to-blue-600' },
    { id: 'USR-003', name: 'Jean Nkoulou', email: 'jean@smartbin.cm', role: 'Operateur', status: 'offline', lastActive: 'Il y a 2h', initials: 'JN', color: 'from-purple-500 to-purple-600' },
    { id: 'USR-004', name: 'Marie Onguéné', email: 'marie@smartbin.cm', role: 'Technicien', status: 'online', lastActive: 'Il y a 1 min', initials: 'MO', color: 'from-amber-500 to-amber-600' },
    { id: 'USR-005', name: 'Paul Biya', email: 'paul@smartbin.cm', role: 'Operateur', status: 'online', lastActive: 'Il y a 15 min', initials: 'PB', color: 'from-cyan-500 to-cyan-600' },
    { id: 'USR-006', name: 'Esther Mengue', email: 'esther@smartbin.cm', role: 'Superviseur', status: 'suspendu', lastActive: 'Il y a 3 jours', initials: 'EM', color: 'from-red-500 to-red-600' },
    { id: 'USR-007', name: 'David Mbarga', email: 'david@smartbin.cm', role: 'Technicien', status: 'offline', lastActive: 'Il y a 1 jour', initials: 'DM', color: 'from-pink-500 to-pink-600' },
    { id: 'USR-008', name: 'Alice Ndongo', email: 'alice@smartbin.cm', role: 'Operateur', status: 'online', lastActive: 'Il y a 8 min', initials: 'AN', color: 'from-teal-500 to-teal-600' },
    { id: 'USR-009', name: 'Robert Tchinda', email: 'robert@smartbin.cm', role: 'Technicien', status: 'offline', lastActive: 'Il y a 4h', initials: 'RT', color: 'from-indigo-500 to-indigo-600' },
    { id: 'USR-010', name: 'Claire Ngane', email: 'claire@smartbin.cm', role: 'Superviseur', status: 'online', lastActive: 'Il y a 2 min', initials: 'CN', color: 'from-rose-500 to-rose-600' },
    { id: 'USR-011', name: 'Michel Obama', email: 'michel@smartbin.cm', role: 'Operateur', status: 'online', lastActive: 'Il y a 12 min', initials: 'MO', color: 'from-orange-500 to-orange-600' },
    { id: 'USR-012', name: 'Sylvie Nkotto', email: 'sylvie@smartbin.cm', role: 'Admin', status: 'suspendu', lastActive: 'Il y a 2 jours', initials: 'SN', color: 'from-lime-500 to-lime-600' },
    { id: 'USR-013', name: 'Joseph Mvondo', email: 'joseph@smartbin.cm', role: 'Technicien', status: 'online', lastActive: 'Il y a 5 min', initials: 'JM', color: 'from-violet-500 to-violet-600' },
    { id: 'USR-014', name: 'Anne-Marie Etoa', email: 'anne@smartbin.cm', role: 'Operateur', status: 'offline', lastActive: 'Il y a 6h', initials: 'AE', color: 'from-fuchsia-500 to-fuchsia-600' },
    { id: 'USR-015', name: 'Pierre Balé', email: 'pierre@smartbin.cm', role: 'Superviseur', status: 'online', lastActive: 'Il y a 1 min', initials: 'PB', color: 'from-sky-500 to-sky-600' },
    { id: 'USR-016', name: 'Martine Edzoa', email: 'martine@smartbin.cm', role: 'Admin', status: 'online', lastActive: 'À l\'instant', initials: 'ME', color: 'from-emerald-500 to-emerald-600' },
    { id: 'USR-017', name: 'Christophe Menga', email: 'christophe@smartbin.cm', role: 'Technicien', status: 'online', lastActive: 'Il y a 3 min', initials: 'CM', color: 'from-cyan-500 to-cyan-600' },
    { id: 'USR-018', name: 'Brigitte Ntamack', email: 'brigitte@smartbin.cm', role: 'Operateur', status: 'suspendu', lastActive: 'Il y a 5 jours', initials: 'BN', color: 'from-rose-500 to-rose-600' },
]

const roleColors: Record<string, string> = {
    Admin: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    Superviseur: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    Operateur: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    Technicien: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
}
const statusIcons: Record<string, LucideIcon> = { online: CheckCircle, offline: XCircle, suspendu: Ban }
const statusColors: Record<string, string> = { online: 'text-emerald-400', offline: 'text-gray-500', suspendu: 'text-red-400' }

function UsersPage() {
    const { notify } = useToast()
    const [search, setSearch] = useState('')
    const [roleFilter, setRoleFilter] = useState('Tous')
    const [page, setPage] = useState(1)
    const perPage = 9

    const filtered = useMemo(() => {
        const roles = ['Tous', 'Admin', 'Superviseur', 'Operateur', 'Technicien']
        return users.filter((u) => {
            const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
            const matchRole = roleFilter === 'Tous' || u.role === roleFilter
            return matchSearch && matchRole
        })
    }, [search, roleFilter])

    const totalPages = Math.ceil(filtered.length / perPage)
    const paginated = filtered.slice((page - 1) * perPage, page * perPage)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Utilisateurs</h1>
                    <p className="text-sm text-gray-400 mt-1">{users.length} membres · {users.filter((u) => u.status === 'online').length} en ligne</p>
                </div>
                <button onClick={() => notify({ message: 'Fonctionnalité à venir', type: 'info' })} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors">
                    <UserPlus className="w-4 h-4" />Ajouter
                </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Rechercher par nom ou email..." className="w-full pl-10 pr-4 py-2.5 bg-[#1E293B]/80 rounded-xl border border-[#334155] focus:border-emerald-500 outline-none text-sm text-white placeholder:text-gray-600 transition-all" />
                </div>
                <div className="flex items-center gap-1 bg-[#1E293B]/80 rounded-lg p-0.5 overflow-x-auto no-scrollbar">
                    {['Tous', 'Admin', 'Superviseur', 'Operateur', 'Technicien'].map((r) => (
                        <button key={r} onClick={() => { setRoleFilter(r); setPage(1) }} className={`shrink-0 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${roleFilter === r ? 'bg-emerald-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>{r}</button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {paginated.map((u) => {
                    const StatusIcon = statusIcons[u.status]
                    return (
                        <div key={u.id} className="glass rounded-xl p-5 hover:bg-[rgba(255,255,255,0.06)] transition-all duration-300">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${u.color} flex items-center justify-center text-white text-sm font-bold shadow-lg`}>{u.initials}</div>
                                    <div>
                                        <p className="text-sm font-bold text-white">{u.name}</p>
                                        <p className="text-xs text-gray-500">{u.email}</p>
                                    </div>
                                </div>
                                <div className="relative group">
                                    <button className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-all"><MoreHorizontal className="w-4 h-4" /></button>
                                    <div className="absolute right-0 top-full mt-1 w-36 bg-[#1E293B] border border-[#334155] rounded-lg shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 overflow-hidden">
                                        {[
                                            { icon: Edit3, label: 'Modifier', color: 'text-blue-400 hover:bg-blue-500/10' },
                                            { icon: Ban, label: 'Suspendre', color: 'text-amber-400 hover:bg-amber-500/10' },
                                            { icon: Trash2, label: 'Supprimer', color: 'text-red-400 hover:bg-red-500/10' },
                                        ].map(({ icon: Icon, label, color }) => (
                                            <button key={label} onClick={() => notify({ message: `${label} — ${u.name}`, type: 'info' })} className={`flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold transition-all ${color}`}>
                                                <Icon className="w-3.5 h-3.5" />{label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-xs">
                                <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${roleColors[u.role]}`}>{u.role}</span>
                                <span className={`flex items-center gap-1 ${statusColors[u.status]}`}>
                                    <StatusIcon className="w-3 h-3" />
                                    {u.status}
                                </span>
                                <span className="ml-auto text-gray-600 flex items-center gap-1"><Clock className="w-3 h-3" />{u.lastActive}</span>
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

UsersPage.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>
export default UsersPage
