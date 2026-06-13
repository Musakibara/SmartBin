import { Search, Bell, HelpCircle, Moon, User, Menu } from 'lucide-react'

interface AppNavbarProps {
    onToggleSidebar: () => void
}

export default function AppNavbar({ onToggleSidebar }: AppNavbarProps) {
    return (
        <header className="sticky top-0 z-40 flex items-center justify-between h-16 w-full bg-[#0F172A]/80 backdrop-blur-xl border-b border-[#334155] px-3 sm:px-6">
            {/* Hamburger + Barre de recherche */}
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

            {/* Actions et profil */}
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

                {/* Infos utilisateur */}
                <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                        <p className="text-[14px] leading-[20px] font-bold text-[#f8fafc]">Admin User</p>
                        <p className="text-[10px] text-[#94a3b8]">System Overseer</p>
                    </div>
                    <div className="w-8 h-8 rounded-full border border-[#10B981]/50 bg-[#1E293B] flex items-center justify-center overflow-hidden">
                        <User className="w-4 h-4 text-[#94a3b8]" />
                    </div>
                </div>
            </div>
        </header>
    )
}
