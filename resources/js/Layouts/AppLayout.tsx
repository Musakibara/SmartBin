import { useState, useEffect, ReactNode } from 'react'
import { usePage, router } from '@inertiajs/react'
import AppSidebar from '@/Components/AppSidebar'
import AppNavbar from '@/Components/AppNavbar'
import { ToastProvider } from '@/Components/Toast'
import '@/echo'

interface AppLayoutProps {
    children: ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const user = usePage().props.auth?.user

    useEffect(() => {
        if (user) {
            window.Echo.join('online-users')
                .here(() => {})
                .joining(() => {})
                .leaving(() => {})
        }
        return () => {
            if (user) {
                window.Echo.leave('online-users')
            }
        }
    }, [user])

    return (
        <ToastProvider>
            <div className="min-h-screen bg-bg-primary">
                <AppSidebar
                    isOpen={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                />
                <div className="flex min-h-screen flex-col lg:pl-64">
                    <AppNavbar
                        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                        user={user ?? undefined}
                    />
                    <main className="min-h-0 flex-1 p-4 pb-4 sm:p-6">
                        {children}
                    </main>
                    <footer className="border-t border-border bg-bg-secondary/50 px-6 py-4 backdrop-blur-md">
                        <div className="flex flex-col items-center justify-between gap-4 text-[11px] font-bold uppercase tracking-widest text-text-secondary md:flex-row">
                            <div className="flex items-center gap-4">
                                <span>© 2024 SmartBin Command</span>
                                <span className="h-1 w-1 rounded-full bg-text-muted" />
                                <span>v2.4.8-Enterprise</span>
                            </div>
                            <div className="flex items-center gap-6">
                                <a
                                    href="#"
                                    className="transition-colors hover:text-[#10B981]"
                                >
                                    Privacy Policy
                                </a>
                                <a
                                    href="#"
                                    className="transition-colors hover:text-[#10B981]"
                                >
                                    System Health
                                </a>
                                <a
                                    href="#"
                                    className="transition-colors hover:text-[#10B981]"
                                >
                                    API Access
                                </a>
                            </div>
                        </div>
                    </footer>
                </div>
            </div>
        </ToastProvider>
    )
}
