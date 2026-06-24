import { useState, useRef, useEffect } from 'react'
import { Link, router, usePage } from '@inertiajs/react'
import { Search, Bell, HelpCircle, Moon, Sun, User, Menu, LogOut, Settings, CheckCheck, AlertTriangle, Info, Mail } from 'lucide-react'
import { useTheme } from '@/Components/ThemeProvider'
import axios from 'axios'

interface RecentNotification {
    id: string
    message: string
    channel: string
    status: string
    read: boolean
    severity?: string
    bin_code?: string
    sent_at: string
}

interface AppNavbarProps {
    onToggleSidebar: () => void
    user?: {
        name: string
        email: string
    }
}

const severityIcons: Record<string, typeof AlertTriangle> = {
    CRITICAL: AlertTriangle,
    HIGH: AlertTriangle,
    MEDIUM: Info,
    LOW: Info,
}

const severityColors: Record<string, string> = {
    CRITICAL: 'border-l-red-500 bg-red-500/5',
    HIGH: 'border-l-orange-500 bg-orange-500/5',
    MEDIUM: 'border-l-blue-500 bg-blue-500/5',
    LOW: 'border-l-gray-500 bg-gray-500/5',
}

export default function AppNavbar({ onToggleSidebar, user }: AppNavbarProps) {
    const { notifications: notifData } = usePage<{ notifications: { unread_count: number } | null }>().props
    const { theme, toggleTheme } = useTheme()
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const [notifOpen, setNotifOpen] = useState(false)
    const [notifications, setNotifications] = useState<RecentNotification[]>([])
    const [unreadCount, setUnreadCount] = useState(notifData?.unread_count ?? 0)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const notifRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false)
            }
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
                setNotifOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    useEffect(() => {
        setUnreadCount(notifData?.unread_count ?? 0)
    }, [notifData])

    async function toggleNotifPanel() {
        if (!notifOpen) {
            try {
                const res = await axios.get('/notifications/recent')
                setNotifications(res.data.notifications)
                setUnreadCount(res.data.unread_count)
            } catch {
                // fallback silencieux
            }
        }
        setNotifOpen(!notifOpen)
    }

    async function handleMarkAllRead() {
        await axios.post('/notifications/read-all')
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
        setUnreadCount(0)
    }

    async function handleMarkRead(id: string) {
        await axios.patch(`/notifications/${id}/read`)
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
    }

    function handleLogout() {
        router.post(route('logout'))
    }

    return (
        <header className="sticky top-0 z-40 flex items-center justify-between h-16 w-full bg-bg-secondary/80 backdrop-blur-xl border-b border-border px-3 sm:px-6">
            <div className="flex items-center gap-3 sm:gap-6 flex-1 min-w-0">
                <button onClick={onToggleSidebar} className="p-2 text-text-secondary hover:text-[#10B981] hover:bg-white/5 rounded-xl transition-all active:scale-95 lg:hidden">
                    <Menu className="w-5 h-5" />
                </button>
                <div className="relative group flex-1 max-w-md hidden sm:block">
                    <span className="absolute inset-y-0 left-3 flex items-center text-text-muted">
                        <Search className="w-[20px] h-[20px]" />
                    </span>
                    <input
                        type="text"
                        placeholder="Search systems..."
                        className="w-full pl-10 pr-4 py-2 bg-input-bg rounded-xl border border-border focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] text-[14px] leading-[20px] font-medium transition-all text-text-primary placeholder:text-text-muted outline-none"
                    />
                </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                <div className="relative" ref={notifRef}>
                    <button
                        onClick={toggleNotifPanel}
                        className="relative p-2 text-text-secondary hover:text-[#10B981] hover:bg-white/5 rounded-xl transition-all active:scale-95"
                    >
                        <Bell className="w-5 h-5" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full shadow-lg shadow-red-500/30">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>

                    {notifOpen && (
                        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-border bg-bg-secondary shadow-xl backdrop-blur-xl overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                                <h3 className="text-[13px] font-bold text-text-primary">Notifications</h3>
                                <div className="flex items-center gap-2">
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={handleMarkAllRead}
                                            className="flex items-center gap-1 text-[11px] text-[#10B981] hover:text-emerald-400 transition-colors"
                                        >
                                            <CheckCheck className="w-3 h-3" />
                                            Tout lire
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="max-h-80 overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="px-4 py-8 text-center">
                                        <Bell className="w-8 h-8 text-border mx-auto mb-2" />
                                        <p className="text-[13px] text-text-muted">Aucune notification</p>
                                    </div>
                                ) : (
                                    notifications.map((n) => {
                                        const SeverityIcon = severityIcons[n.severity ?? 'LOW'] ?? Info
                                        const borderColor = severityColors[n.severity ?? 'LOW'] ?? 'border-l-gray-500'
                                        return (
                                            <button
                                                key={n.id}
                                                onClick={() => {
                                                    if (!n.read) handleMarkRead(n.id)
                                                }}
                                                className={`w-full text-left px-4 py-3 border-l-2 transition-colors hover:bg-white/5 ${borderColor} ${n.read ? 'opacity-50' : ''}`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <SeverityIcon className={`w-4 h-4 mt-0.5 shrink-0 ${n.severity === 'CRITICAL' || n.severity === 'HIGH' ? 'text-red-400' : 'text-blue-400'}`} />
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-[12px] text-text-primary truncate">{n.message}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="flex items-center gap-1 text-[10px] text-text-muted">
                                                                <Mail className="w-3 h-3" />
                                                                {n.channel}
                                                            </span>
                                                            <span className="text-[10px] text-text-muted">{n.sent_at}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </button>
                                        )
                                    })
                                )}
                            </div>

                            <Link
                                href="/notifications"
                                className="block px-4 py-3 text-center text-[12px] font-medium text-[#10B981] hover:text-emerald-400 border-t border-border transition-colors"
                                onClick={() => setNotifOpen(false)}
                            >
                                Voir toutes les notifications →
                            </Link>
                        </div>
                    )}
                </div>

                <button className="p-2 text-text-secondary hover:text-[#10B981] hover:bg-white/5 rounded-xl transition-all active:scale-95 hidden sm:block">
                    <HelpCircle className="w-5 h-5" />
                </button>
                <button onClick={toggleTheme} className="p-2 text-text-secondary hover:text-[#10B981] hover:bg-white/5 rounded-xl transition-all active:scale-95 hidden sm:block">
                    {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>

                <div className="h-8 w-px bg-border mx-1 sm:mx-2 hidden sm:block"></div>

                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="flex items-center gap-3 cursor-pointer"
                    >
                        <div className="text-right hidden sm:block">
                            <p className="text-[14px] leading-[20px] font-bold text-text-primary">{user?.name || 'Admin User'}</p>
                            <p className="text-[10px] text-text-secondary">System Overseer</p>
                        </div>
                        <div className="w-8 h-8 rounded-full border border-[#10B981]/50 overflow-hidden">
                            <img src="/images/Profile.png" alt="Profile" className="w-full h-full object-cover" />
                        </div>
                    </button>

                    {dropdownOpen && (
                        <div className="absolute right-0 mt-2 w-48 rounded-xl border border-border bg-bg-secondary shadow-xl backdrop-blur-xl">
                            <div className="px-4 py-3 border-b border-border">
                                <p className="text-[13px] font-medium text-text-primary truncate">{user?.name}</p>
                                <p className="text-[11px] text-text-secondary truncate">{user?.email}</p>
                            </div>
                            <div className="py-1">
                                <Link
                                    href={route('profile.edit')}
                                    className="flex items-center gap-2 px-4 py-2 text-[13px] text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
                                    onClick={() => setDropdownOpen(false)}
                                >
                                    <Settings className="w-4 h-4" />
                                    Profile
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-2 w-full px-4 py-2 text-[13px] text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Log Out
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}
