import { Link, router, usePage } from '@inertiajs/react'
import { Bell, CheckCheck, AlertTriangle, Info, Mail, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useState } from 'react'
import AppLayout from '../../Layouts/AppLayout'
import axios from 'axios'

type AppNotification = {
    id: string
    message: string
    channel: string
    status: string
    read_at: string | null
    severity?: string
    bin_code?: string
    sent_at: string
    alert: {
        severity: string
        bin: { code: string }
    } | null
}

type PageProps = {
    notifications: {
        data: AppNotification[]
        current_page: number
        last_page: number
        total: number
    }
}

const severityConfig: Record<string, { icon: typeof AlertTriangle; color: string; label: string }> = {
    CRITICAL: { icon: AlertTriangle, color: 'text-red-400 bg-red-500/10 border-red-500/30', label: 'Critique' },
    HIGH: { icon: AlertTriangle, color: 'text-orange-400 bg-orange-500/10 border-orange-500/30', label: 'Haute' },
    MEDIUM: { icon: Info, color: 'text-blue-400 bg-blue-500/10 border-blue-500/30', label: 'Moyenne' },
    LOW: { icon: Info, color: 'text-gray-400 bg-gray-500/10 border-gray-500/30', label: 'Basse' },
}

function NotificationsPage() {
    const { notifications } = usePage<PageProps>().props

    const { data, current_page, last_page, total } = notifications
    const unread = data.filter((n) => !n.read_at).length

    async function handleMarkAllRead() {
        await axios.post('/notifications/read-all')
        router.reload({ only: ['notifications'] })
    }

    async function handleMarkRead(id: string) {
        await axios.patch(`/notifications/${id}/read`)
        router.reload({ only: ['notifications'] })
    }

    function goPage(page: number) {
        router.get('/notifications', { page }, { preserveScroll: true, preserveState: true, replace: true })
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Notifications</h1>
                    <p className="text-sm text-gray-400 mt-1">
                        {total} notification{total !== 1 ? 's' : ''}
                        {unread > 0 && <span className="text-emerald-400"> · {unread} non lue{unread !== 1 ? 's' : ''}</span>}
                    </p>
                </div>
                {unread > 0 && (
                    <button
                        onClick={handleMarkAllRead}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-xl transition-all"
                    >
                        <CheckCheck className="w-4 h-4" />
                        Tout marquer comme lu
                    </button>
                )}
            </div>

            <div className="space-y-2">
                {data.length === 0 ? (
                    <div className="glass rounded-xl p-12 text-center">
                        <Bell className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                        <p className="text-base font-semibold text-white">Aucune notification</p>
                        <p className="text-sm text-gray-500 mt-1">Les notifications apparaîtront ici quand des alertes seront générées.</p>
                    </div>
                ) : (
                    data.map((n) => {
                        const sev = (n.alert?.severity ?? n.severity ?? 'LOW') as keyof typeof severityConfig
                        const config = severityConfig[sev] ?? severityConfig.LOW
                        const SeverityIcon = config.icon
                        return (
                            <div
                                key={n.id}
                                className={`group relative rounded-xl border transition-all duration-200 ${
                                    n.read_at
                                        ? 'bg-[#1E293B]/40 border-[#334155]/30 opacity-60'
                                        : 'bg-[#1E293B]/60 border-[#334155]/60 hover:border-emerald-500/30 hover:shadow-[0_0_20px_-5px_rgba(16,185,129,0.1)]'
                                }`}
                            >
                                <div className="flex items-start gap-4 p-4">
                                    <div className={`p-2 rounded-lg border ${config.color}`}>
                                        <SeverityIcon className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm ${n.read_at ? 'text-gray-400' : 'text-white font-medium'}`}>
                                            {n.message}
                                        </p>
                                        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <Mail className="w-3 h-3" />
                                                {n.channel}
                                            </span>
                                            {n.alert?.bin?.code && (
                                                <span>Benne {n.alert.bin.code}</span>
                                            )}
                                            <span>{n.sent_at}</span>
                                            {!n.read_at && (
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            )}
                                        </div>
                                    </div>
                                    {!n.read_at && (
                                        <button
                                            onClick={() => handleMarkRead(n.id)}
                                            className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-400 hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-all"
                                            title="Marquer comme lu"
                                        >
                                            <CheckCheck className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            {last_page > 1 && (
                <div className="flex flex-col items-center gap-3">
                    <p className="text-xs text-gray-600">Page {current_page} / {last_page}</p>
                    <div className="flex items-center gap-2">
                        <button onClick={() => goPage(current_page - 1)} disabled={current_page === 1}
                            className="p-2 rounded-lg bg-[#1E293B]/80 text-gray-500 hover:text-white disabled:opacity-30 transition-all shrink-0">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        {Array.from({ length: last_page }, (_, i) => (
                            <button key={i} onClick={() => goPage(i + 1)}
                                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all shrink-0 ${current_page === i + 1 ? 'bg-emerald-600 text-white shadow-lg' : 'bg-[#1E293B]/80 text-gray-500 hover:text-white'}`}>
                                {i + 1}
                            </button>
                        ))}
                        <button onClick={() => goPage(current_page + 1)} disabled={current_page === last_page}
                            className="p-2 rounded-lg bg-[#1E293B]/80 text-gray-500 hover:text-white disabled:opacity-30 transition-all shrink-0">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

NotificationsPage.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>
export default NotificationsPage
