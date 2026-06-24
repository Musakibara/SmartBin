import { Link, usePage, router } from '@inertiajs/react'
import { useCallback } from 'react'
import {
    LayoutDashboard,
    Trash2,
    Map,
    Radio,
    Bell,
    Brain,
    FileText,
    Users,
    Settings,
    User,
    LogOut,
    X,
    type LucideIcon,
} from 'lucide-react'

interface NavItem {
    label: string
    icon: LucideIcon
    href: string
}

function useTilt() {
    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
        const el = e.currentTarget
        const rect = el.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const rotateX = (y - rect.height / 2) / 20
        const rotateY = (rect.width / 2 - x) / 20
        el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`
    }, [])

    const handleMouseLeave = useCallback((e: React.MouseEvent<HTMLElement>) => {
        e.currentTarget.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)'
    }, [])

    return { handleMouseMove, handleMouseLeave }
}

interface AppSidebarProps {
    isOpen: boolean
    onClose: () => void
}

export default function AppSidebar({ isOpen, onClose }: AppSidebarProps) {
    const { url, props } = usePage()
    const userRole = (props.auth as { user?: { role?: string } } | undefined)?.user?.role

    const navItems: NavItem[] = [
        { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
        { label: 'Smart Bins', icon: Trash2, href: '/bins' },
        { label: 'Capteurs', icon: Radio, href: '/sensors' },
        { label: 'Monitoring', icon: Map, href: '/monitoring' },
        { label: 'Alertes', icon: Bell, href: '/alerts' },
        { label: 'IA Prédictions', icon: Brain, href: '/predictions' },
        { label: 'Rapports', icon: FileText, href: '/reports' },
        ...(userRole === 'ADMIN' || userRole === 'SUPERVISEUR' ? [{ label: 'Utilisateurs', icon: Users, href: '/users' }] : []),
        ...(userRole === 'ADMIN' || userRole === 'SUPERVISEUR' ? [{ label: 'Paramètres', icon: Settings, href: '/settings' }] : []),
    ]
    const tilt = useTilt()

    function isActive(href: string) {
        const path = url.split(/[?#]/)[0]
        if (href === '/dashboard' || href === '/profile') return path === href
        return path.startsWith(href)
    }

    return (<>
        {isOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={onClose} />
        )}
        <aside className={`
            fixed left-0 top-0 h-screen w-64 bg-bg-secondary/90 backdrop-blur-xl border-r border-border z-50 flex flex-col
            transition-transform duration-300 ease-in-out
            ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            lg:translate-x-0
        `}>
            <div className="px-6 py-6 flex items-center gap-3 border-b border-border">
                <div className="w-10 h-10 rounded-lg bg-bg-card overflow-hidden shrink-0">
                    <img src="/images/logo.png" alt="SmartBin Logo" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                    <h1 className="text-[24px] leading-[32px] font-semibold text-[#10B981]">SmartBin</h1>
                    <p className="text-[12px] leading-[16px] font-semibold text-text-secondary">City Infrastructure</p>
                </div>
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-text-muted hover:text-text-primary transition-all lg:hidden">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <nav className="flex-1 flex flex-col px-4 py-4 overflow-y-auto">
                <div className="space-y-1.5 flex-1">
                    {navItems.map((item) => {
                        const active = isActive(item.href)
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onMouseMove={tilt.handleMouseMove}
                                onMouseLeave={tilt.handleMouseLeave}
                                className={`relative flex items-center gap-3 px-5 py-3.5 rounded-xl text-[14px] leading-[20px] font-semibold tracking-[0.01em] transition-all duration-200 overflow-hidden ${
                                    active
                                        ? 'text-emerald-400 bg-[#10B981]/10 shadow-[0_0_20px_-8px_rgba(16,185,129,0.3)]'
                                        : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                                }`}
                            >
                                {active && (
                                    <span className="absolute left-0 inset-y-2 w-1 bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-r-full shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                                )}
                                <item.icon className={`w-5 h-5 transition-transform duration-200 ${active ? 'scale-110 drop-shadow-[0_0_6px_rgba(16,185,129,0.5)]' : ''}`} />
                                {item.label}
                            </Link>
                        )
                    })}
                </div>
                <div className="mt-auto pt-6">
                    <div className="mb-3 border-t border-border" />
                    <div className="space-y-1.5">
                        <Link
                            href="/profile"
                            onMouseMove={tilt.handleMouseMove}
                            onMouseLeave={tilt.handleMouseLeave}
                            className={`relative flex items-center gap-3 px-5 py-3.5 rounded-xl text-[14px] leading-[20px] font-semibold tracking-[0.01em] transition-all duration-200 overflow-hidden ${
                                isActive('/profile')
                                    ? 'text-emerald-400 bg-[#10B981]/10 shadow-[0_0_20px_-8px_rgba(16,185,129,0.3)]'
                                    : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                            }`}
                        >
                            {isActive('/profile') && (
                                <span className="absolute left-0 inset-y-2 w-1 bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-r-full shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                            )}
                            <User className={`w-5 h-5 transition-transform duration-200 ${isActive('/profile') ? 'scale-110 drop-shadow-[0_0_6px_rgba(16,185,129,0.5)]' : ''}`} />
                            Profile
                        </Link>
                        <button
                            onClick={() => router.post(route('logout'))}
                            onMouseMove={tilt.handleMouseMove}
                            onMouseLeave={tilt.handleMouseLeave}
                            className="flex w-full items-center gap-3 px-5 py-3.5 rounded-xl text-[14px] leading-[20px] font-semibold tracking-[0.01em] text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                            Logout
                        </button>
                    </div>
                </div>
            </nav>
        </aside>
    </>)
}
