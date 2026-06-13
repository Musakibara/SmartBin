import { useState, useRef, useEffect } from 'react'
import { Link, router } from '@inertiajs/react'
import { Search, Bell, HelpCircle, Moon, User, Menu, LogOut, Settings } from 'lucide-react'

interface AppNavbarProps {
    onToggleSidebar: () => void
    user?: {
        name: string
        email: string
    }
}

export default function AppNavbar({ onToggleSidebar, user }: AppNavbarProps) {
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    function handleLogout() {
        router.post(route('logout'))
    }

    return (
        <header className="sticky top-0 z-40 flex items-center justify-between h-16 w-full bg-[#0F172A]/80 backdrop-blur-xl border-b border-[#334155] px-3 sm:px-6">
            <div className="flex items-center gap-3 sm:gap-6 flex-1 min-w-0">
                <button onClick={onToggleSidebar} className="p-2 text-[#94a3b8] hover:text-[#10B981] hover:bg-white/5 rounded-xl transition-all active:scale-95 lg:hidden">
                    <Menu className="w-5 h-5" />
                </button>
                <div className="relative group flex-1 max-w-md hidden sm:block">
                    <span className="absolute inset-y-0 left-3 flex items-center text-[#94a3b8]">
                        <Search className="w-[20px] h-[20px]" />
                    </span>
                    <input
                        type="text"
                        placeholder="Search systems..."
                        className="w-full pl-10 pr-4 py-2 bg-[#1E293B]/80 rounded-xl border border-[#334155] focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] text-[14px] leading-[20px] font-medium transition-all text-[#f8fafc] placeholder:text-[#94a3b8] outline-none"
                    />
                </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                <button className="p-2 text-[#94a3b8] hover:text-[#10B981] hover:bg-white/5 rounded-xl transition-all active:scale-95">
                    <Bell className="w-5 h-5" />
                </button>
                <button className="p-2 text-[#94a3b8] hover:text-[#10B981] hover:bg-white/5 rounded-xl transition-all active:scale-95 hidden sm:block">
                    <HelpCircle className="w-5 h-5" />
                </button>
                <button className="p-2 text-[#94a3b8] hover:text-[#10B981] hover:bg-white/5 rounded-xl transition-all active:scale-95 hidden sm:block">
                    <Moon className="w-5 h-5" />
                </button>

                <div className="h-8 w-px bg-[#334155] mx-1 sm:mx-2 hidden sm:block"></div>

                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="flex items-center gap-3 cursor-pointer"
                    >
                        <div className="text-right hidden sm:block">
                            <p className="text-[14px] leading-[20px] font-bold text-[#f8fafc]">{user?.name || 'Admin User'}</p>
                            <p className="text-[10px] text-[#94a3b8]">System Overseer</p>
                        </div>
                        <div className="w-8 h-8 rounded-full border border-[#10B981]/50 overflow-hidden">
                            <img src="/images/Profile.png" alt="Profile" className="w-full h-full object-cover" />
                        </div>
                    </button>

                    {dropdownOpen && (
                        <div className="absolute right-0 mt-2 w-48 rounded-xl border border-[#334155] bg-[#0F172A] shadow-xl backdrop-blur-xl">
                            <div className="px-4 py-3 border-b border-[#334155]">
                                <p className="text-[13px] font-medium text-[#f8fafc] truncate">{user?.name}</p>
                                <p className="text-[11px] text-[#94a3b8] truncate">{user?.email}</p>
                            </div>
                            <div className="py-1">
                                <Link
                                    href={route('profile.edit')}
                                    className="flex items-center gap-2 px-4 py-2 text-[13px] text-[#94a3b8] hover:text-[#f8fafc] hover:bg-white/5 transition-colors"
                                    onClick={() => setDropdownOpen(false)}
                                >
                                    <Settings className="w-4 h-4" />
                                    Profile
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-2 w-full px-4 py-2 text-[13px] text-[#94a3b8] hover:text-[#f8fafc] hover:bg-white/5 transition-colors"
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
