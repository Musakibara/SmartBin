import { Search, Bell, HelpCircle, Moon, User } from 'lucide-react'

/**
 * Barre de navigation supérieure
 * Contient la recherche, les actions rapides et le profil utilisateur
 */
export default function AppNavbar() {
    return (
        <header className="sticky top-0 z-40 flex items-center justify-between h-16 w-full bg-[#0F172A]/80 backdrop-blur-xl border-b border-[#334155] px-6">
            {/* Barre de recherche */}
            <div className="flex items-center gap-6">
                <div className="relative group">
                    <span className="absolute inset-y-0 left-3 flex items-center text-[#94a3b8]">
                        <Search className="w-[20px] h-[20px]" />
                    </span>
                    <input
                        type="text"
                        placeholder="Search systems..."
                        className="pl-10 pr-4 py-2 bg-[#1E293B]/80 rounded-xl border border-[#334155] focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] text-[14px] leading-[20px] font-medium w-64 transition-all text-[#f8fafc] placeholder:text-[#94a3b8] outline-none"
                    />
                </div>
            </div>

            {/* Actions et profil */}
            <div className="flex items-center gap-4">
                <button className="p-2 text-[#94a3b8] hover:text-[#10B981] hover:bg-white/5 rounded-xl transition-all active:scale-95">
                    <Bell className="w-5 h-5" />
                </button>
                <button className="p-2 text-[#94a3b8] hover:text-[#10B981] hover:bg-white/5 rounded-xl transition-all active:scale-95">
                    <HelpCircle className="w-5 h-5" />
                </button>
                <button className="p-2 text-[#94a3b8] hover:text-[#10B981] hover:bg-white/5 rounded-xl transition-all active:scale-95">
                    <Moon className="w-5 h-5" />
                </button>

                <div className="h-8 w-px bg-[#334155] mx-2"></div>

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
