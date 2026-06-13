import { useState } from 'react'
import AppSidebar from '../Components/AppSidebar'
import AppNavbar from '../Components/AppNavbar'
import { ToastProvider } from '../Components/Toast'
import { ReactNode } from 'react'

interface AppLayoutProps {
    children: ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false)

    return (
        <ToastProvider>
        <div className="min-h-screen bg-[#020617]">
            <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className="lg:pl-64 flex flex-col min-h-screen">
                <AppNavbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
                <main className="flex-1 min-h-0 p-4 sm:p-6 pb-4">
                    {children}
                </main>
                <footer className="py-4 px-6 border-t border-[#334155] bg-[#0F172A]/50 backdrop-blur-md">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-[11px] text-[#94a3b8] uppercase tracking-widest font-bold">
                        <div className="flex items-center gap-4">
                            <span>© 2024 SmartBin Command</span>
                            <span className="w-1 h-1 bg-[#475569] rounded-full" />
                            <span>v2.4.8-Enterprise</span>
                        </div>
                        <div className="flex items-center gap-6">
                            <a className="hover:text-[#10B981] transition-colors" href="#">Privacy Policy</a>
                            <a className="hover:text-[#10B981] transition-colors" href="#">System Health</a>
                            <a className="hover:text-[#10B981] transition-colors" href="#">API Access</a>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
        </ToastProvider>
    )
}
