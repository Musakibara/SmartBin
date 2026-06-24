import { useState, useRef, useEffect, useCallback } from 'react'
import { Search, User, Clock, CheckCircle, XCircle, Ban, Edit3, Trash2, UserPlus, ChevronLeft, ChevronRight, X, Loader2, AlertTriangle, type LucideIcon } from 'lucide-react'
import { usePage, router } from '@inertiajs/react'
import { useTranslation } from 'react-i18next'
import AppLayout from '../../Layouts/AppLayout'
import { useToast } from '../../Components/Toast'
import '@/echo'

type AppUser = {
    id: string
    name: string
    email: string
    role: string
    status: 'online' | 'offline' | 'suspendu'
    lastActive: string
    initials: string
    color: string
}

type UserPaginator = {
    data: AppUser[]
    current_page: number
    last_page: number
    per_page: number
    total: number
    from: number | null
    to: number | null
}

type PageProps = {
    users: UserPaginator
    filters: { search?: string; role?: string }
}

const roleColors: Record<string, string> = {
    Admin: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    Superviseur: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    'Opérateur': 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    Technicien: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    Agent: 'bg-gray-500/15 text-text-secondary border-gray-500/30',
}
const statusIcons: Record<string, LucideIcon> = { online: CheckCircle, offline: XCircle, suspendu: Ban }
const statusColors: Record<string, string> = { online: 'text-emerald-400', offline: 'text-text-muted', suspendu: 'text-red-400' }

const roleToDb: Record<string, string> = {
    Admin: 'ADMIN', Superviseur: 'SUPERVISEUR', 'Opérateur': 'OPERATEUR', Technicien: 'TECHNICIEN', Agent: 'AGENT',
}

const roleTranslationKeys: Record<string, string> = {
    Tous: 'users.filterAll',
    Admin: 'users.roleAdmin',
    Superviseur: 'users.roleSuperviseur',
    Opérateur: 'users.roleOperateur',
    Technicien: 'users.roleTechnicien',
    Agent: 'users.roleAgent',
}

function UsersPage() {
    const { t } = useTranslation()
    const { notify } = useToast()
    const { users, filters, errors: inertiaErrors } = usePage<PageProps & { errors: Record<string, string> }>().props

    const statusLabels: Record<string, string> = { online: t('users.online'), offline: t('users.offline'), suspendu: t('users.suspended') }

    const [search, setSearch] = useState(filters.search ?? '')
    const [roleFilter, setRoleFilter] = useState(filters.role ?? 'Tous')
    const [showModal, setShowModal] = useState(false)
    const [editingUser, setEditingUser] = useState<AppUser | null>(null)
    const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'OPERATEUR', password: '' })
    const [processing, setProcessing] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<AppUser | null>(null)
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const modalRef = useRef<HTMLDivElement>(null)

    const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set())

    useEffect(() => {
        const channel = window.Echo.join('online-users')
        channel.here((members: { id: string }[]) => {
            setOnlineIds(new Set(members.map((m) => m.id)))
        })
        channel.joining((member: { id: string }) => {
            setOnlineIds((prev) => new Set(prev).add(member.id))
        })
        channel.leaving((member: { id: string }) => {
            setOnlineIds((prev) => {
                const next = new Set(prev)
                next.delete(member.id)
                return next
            })
        })
        return () => window.Echo.leave('online-users')
    }, [])

    const { data, total, last_page, current_page } = users
    const onlineCount = data.filter((u) => onlineIds.has(u.id)).length

    const navigate = useCallback((overrides?: Record<string, string>) => {
        const params: Record<string, string> = { ...overrides }
        if (!params.search && search) params.search = search
        if (!params.role && roleFilter !== 'Tous') params.role = roleFilter
        router.get('/users', params, { preserveScroll: true, preserveState: true, replace: true })
    }, [search, roleFilter])

    useEffect(() => {
        return () => { if (searchTimer.current) clearTimeout(searchTimer.current) }
    }, [])

    function onSearchChange(value: string) {
        setSearch(value)
        if (searchTimer.current) clearTimeout(searchTimer.current)
        searchTimer.current = setTimeout(() => {
            const params: Record<string, string> = { search: value }
            if (roleFilter !== 'Tous') params.role = roleFilter
            router.get('/users', params, { preserveScroll: true, preserveState: true, replace: true })
        }, 300)
    }

    function onRoleChange(role: string) {
        setRoleFilter(role)
        const params: Record<string, string> = {}
        if (search) params.search = search
        if (role !== 'Tous') params.role = role
        router.get('/users', params, { preserveScroll: true, preserveState: true, replace: true })
    }

    function goPage(page: number) {
        const params: Record<string, string> = { page: String(page) }
        if (search) params.search = search
        if (roleFilter !== 'Tous') params.role = roleFilter
        router.get('/users', params, { preserveScroll: true, preserveState: true, replace: true })
    }

    function openAdd() {
        setEditingUser(null)
        setForm({ name: '', email: '', phone: '', role: 'OPERATEUR', password: '' })
        setShowModal(true)
    }

    function openEdit(u: AppUser) {
        setEditingUser(u)
        setForm({
            name: u.name,
            email: u.email,
            phone: '',
            role: roleToDb[u.role] ?? 'OPERATEUR',
            password: '',
        })
        setShowModal(true)
    }

    useEffect(() => {
        if (!showModal) return
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') setShowModal(false)
        }
        document.addEventListener('keydown', onKeyDown)
        return () => document.removeEventListener('keydown', onKeyDown)
    }, [showModal])

    function submitForm() {
        setProcessing(true)
        const onFinish = () => setProcessing(false)
        const onSuccess = () => {
            setShowModal(false)
            setProcessing(false)
            notify({ message: editingUser ? t('users.toastModified') : t('users.toastAdded'), type: 'success' })
        }

        if (editingUser) {
            router.patch(`/users/${editingUser.id}`, form, {
                preserveScroll: true,
                onSuccess,
                onError: () => setProcessing(false),
                onFinish,
            })
        } else {
            router.post('/users', form, {
                preserveScroll: true,
                onSuccess,
                onError: () => setProcessing(false),
                onFinish,
            })
        }
    }

    function toggleSuspend(u: AppUser) {
        setProcessing(true)
        const newStatus = u.status === 'suspendu' ? 'ACTIVE' : 'SUSPENDED'
        router.patch(`/users/${u.id}`, { status: newStatus }, {
            preserveScroll: true,
            onSuccess: () => {
                notify({ message: newStatus === 'SUSPENDED' ? t('users.toastSuspended', { name: u.name }) : t('users.toastReactivated', { name: u.name }), type: 'info' })
                setProcessing(false)
            },
            onFinish: () => setProcessing(false),
        })
    }

    function confirmDelete(u: AppUser) {
        setDeleteTarget(u)
    }

    function executeDelete() {
        if (!deleteTarget) return
        setProcessing(true)
        router.delete(`/users/${deleteTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                notify({ message: t('users.toastDeleted', { name: deleteTarget.name }), type: 'info' })
                setDeleteTarget(null)
                setProcessing(false)
            },
            onFinish: () => setProcessing(false),
        })
    }

    function getError(field: string): string | undefined {
        return inertiaErrors?.[field]
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">{t('users.title')}</h1>
                    <p className="text-sm text-text-secondary mt-1">
                        {t('users.memberCount', { count: total })}
                        {onlineCount > 0 && <span className="text-emerald-400"> {t('users.onlineCount', { count: onlineCount })}</span>}
                    </p>
                </div>
                <button onClick={openAdd} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.97] text-text-primary text-sm font-semibold rounded-xl transition-all shadow-lg shadow-emerald-600/20">
                    <UserPlus className="w-4 h-4" />{t('common.add')}
                </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder={t('users.search')}
                        className="w-full pl-10 pr-4 py-2.5 bg-input-bg rounded-xl border border-border focus:border-emerald-500 outline-none text-sm text-text-primary placeholder:text-text-muted transition-all"
                    />
                </div>
                <div className="flex items-center gap-1 bg-input-bg rounded-lg p-0.5 overflow-x-auto no-scrollbar">
                    {Object.keys(roleTranslationKeys).map((r) => (
                        <button key={r} onClick={() => onRoleChange(r)} className={`shrink-0 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${roleFilter === r ? 'bg-emerald-600 text-text-primary shadow-lg' : 'text-text-muted hover:text-text-primary'}`}>{t(roleTranslationKeys[r])}</button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {data.length === 0 ? (
                    <div className="col-span-full glass rounded-xl p-12 text-center">
                        <User className="w-12 h-12 text-text-muted mx-auto mb-3" />
                        <p className="text-base font-semibold text-text-primary">{t('users.noUsers')}</p>
                        <p className="text-sm text-text-muted mt-1">
                            {search ? t('users.noUsersHint') : t('users.noUsersRole')}
                        </p>
                    </div>
                ) : data.map((u, i) => {
                    const isOnline = onlineIds.has(u.id)
                    const displayStatus: 'online' | 'offline' | 'suspendu' = isOnline ? 'online' : u.status
                    const StatusIcon = statusIcons[displayStatus]
                    const timeAgo = u.lastActive
                    const isRecent = timeAgo.includes('instant') || timeAgo.includes('min')
                    const isHours = timeAgo.includes('h')
                    const timeColor = isRecent ? 'text-emerald-500' : isHours ? 'text-amber-500' : 'text-text-muted'
                    return (
                        <div key={u.id} className="group relative rounded-xl bg-bg-card/60 border border-border/60 hover:border-emerald-500/30 hover:bg-input-bg hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.15)] hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-300 animate-fade-in overflow-hidden" style={{ animationDelay: `${i * 60}ms` }}>
                            <div className="p-5">
                                <div className="flex items-start gap-2 mb-3">
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${u.color} flex items-center justify-center text-text-primary text-sm font-bold shadow-lg relative shrink-0`}>
                                            {u.initials}
                                            {isOnline && (
                                                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#1E293B] shadow-lg shadow-emerald-500/50 animate-pulse" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-text-primary truncate group-hover:text-emerald-300 transition-colors">{u.name}</p>
                                            <p className="text-xs text-text-muted truncate">{u.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                        <button onClick={() => openEdit(u)} disabled={processing} className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all disabled:opacity-40" title={t('common.edit')}>
                                            <Edit3 className="w-3.5 h-3.5" />
                                        </button>
                                        <button onClick={() => toggleSuspend(u)} disabled={processing} className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-all disabled:opacity-40" title={u.status === 'suspendu' ? t('users.reactivate') : t('users.suspend')}>
                                            <Ban className="w-3.5 h-3.5" />
                                        </button>
                                        <button onClick={() => confirmDelete(u)} disabled={processing} className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-40" title={t('common.delete')}>
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2.5 text-xs pt-3 border-t border-border/50">
                                    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold tracking-wide ${roleColors[u.role] ?? roleColors.Agent}`}>{t(roleTranslationKeys[u.role] ?? 'users.roleAgent')}</span>
                                    <span className={`flex items-center gap-1 ${statusColors[displayStatus]}`}>
                                        <StatusIcon className={`w-3 h-3 ${isOnline ? 'animate-pulse' : ''}`} />
                                        {statusLabels[displayStatus]}
                                    </span>
                                    <span className={`ml-auto flex items-center gap-1 ${timeColor}`}>
                                        <Clock className="w-3 h-3" />{u.lastActive}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {last_page > 1 && (
                <div className="flex flex-col items-center gap-3">
                    <p className="text-xs text-text-muted">{t('common.pageXofY', { current: current_page, last: last_page })}</p>
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                        <button onClick={() => goPage(current_page - 1)} disabled={current_page === 1} className="p-2 rounded-lg bg-input-bg text-text-muted hover:text-text-primary disabled:opacity-30 transition-all shrink-0"><ChevronLeft className="w-4 h-4" /></button>
                        {Array.from({ length: last_page }, (_, i) => (
                            <button key={i} onClick={() => goPage(i + 1)} className={`w-8 h-8 rounded-lg text-xs font-bold transition-all shrink-0 ${current_page === i + 1 ? 'bg-emerald-600 text-text-primary shadow-lg' : 'bg-input-bg text-text-muted hover:text-text-primary'}`}>{i + 1}</button>
                        ))}
                        <button onClick={() => goPage(current_page + 1)} disabled={current_page === last_page} className="p-2 rounded-lg bg-input-bg text-text-muted hover:text-text-primary disabled:opacity-30 transition-all shrink-0"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => !processing && setShowModal(false)}>
                    <div ref={modalRef} className="glass rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl scale-in" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-bold text-text-primary">{editingUser ? t('users.edit') : t('users.newUser')}</h2>
                            <button onClick={() => !processing && setShowModal(false)} className="p-1 rounded-lg text-text-muted hover:text-text-primary transition-all"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="space-y-4">
                            {[
                                { field: 'name', label: 'auth.fullName', type: 'text', placeholder: 'Jean Dupont' },
                                { field: 'email', label: 'auth.email', type: 'email', placeholder: 'jean@smartbin.cm' },
                                { field: 'phone', label: 'profile.phone', type: 'text', placeholder: '+237 6XX XXX XXX' },
                            ].map(({ field, label, type, placeholder }) => (
                                <div key={field}>
                                    <label className="text-xs text-text-muted font-semibold mb-1.5 block">{t(label)}</label>
                                    <input type={type} value={(form as any)[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} disabled={processing}
                                        className={`w-full px-4 py-2.5 bg-input-bg rounded-xl border ${getError(field) ? 'border-red-500/50' : 'border-border'} focus:border-emerald-500 outline-none text-sm text-text-primary placeholder:text-text-muted transition-all disabled:opacity-50`}
                                        placeholder={placeholder} />
                                    {getError(field) && <p className="text-xs text-red-400 mt-1">{getError(field)}</p>}
                                </div>
                            ))}
                            <div>
                                <label className="text-xs text-text-muted font-semibold mb-1.5 block">{t('common.role')}</label>
                                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} disabled={processing}
                                    className={`w-full px-4 py-2.5 bg-input-bg rounded-xl border ${getError('role') ? 'border-red-500/50' : 'border-border'} focus:border-emerald-500 outline-none text-sm text-text-primary transition-all disabled:opacity-50`}>
                                    {Object.keys(roleTranslationKeys).filter((r) => r !== 'Tous').map((r) => (
                                        <option key={r} value={roleToDb[r]}>{t(roleTranslationKeys[r])}</option>
                                    ))}
                                </select>
                                {getError('role') && <p className="text-xs text-red-400 mt-1">{getError('role')}</p>}
                            </div>
                            <div>
                                <label className="text-xs text-text-muted font-semibold mb-1.5 block">{editingUser ? t('users.newPasswordOptional') : t('profile.passwordPlaceholder')}</label>
                                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} disabled={processing}
                                    className={`w-full px-4 py-2.5 bg-input-bg rounded-xl border ${getError('password') ? 'border-red-500/50' : 'border-border'} focus:border-emerald-500 outline-none text-sm text-text-primary placeholder:text-text-muted transition-all disabled:opacity-50`} />
                                {getError('password') && <p className="text-xs text-red-400 mt-1">{getError('password')}</p>}
                            </div>
                            <button onClick={submitForm} disabled={processing}
                                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-text-primary text-sm font-bold rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                                {processing && <Loader2 className="w-4 h-4 animate-spin" />}
                                {editingUser ? t('common.save') : t('common.create')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => !processing && setDeleteTarget(null)}>
                    <div className="glass rounded-xl p-6 w-full max-w-sm mx-4 shadow-2xl scale-in" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                                <AlertTriangle className="w-5 h-5 text-red-400" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-text-primary">{t('users.deleteConfirm')}</h2>
                                <p className="text-sm text-text-secondary">{t('users.deleteHint')}</p>
                            </div>
                        </div>
                        <p className="text-sm text-text-primary mb-6">
                            {t('users.deleteConfirmMessage', { name: deleteTarget.name })}
                        </p>
                        <div className="flex items-center gap-3">
                            <button onClick={() => setDeleteTarget(null)} disabled={processing}
                                className="flex-1 py-2.5 bg-bg-card hover:bg-input-bg text-text-primary text-sm font-semibold rounded-xl transition-all disabled:opacity-50">
                                {t('common.cancel')}
                            </button>
                            <button onClick={executeDelete} disabled={processing}
                                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 active:scale-[0.98] text-text-primary text-sm font-bold rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                                {processing && <Loader2 className="w-4 h-4 animate-spin" />}
                                {t('common.delete')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

UsersPage.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>
export default UsersPage
