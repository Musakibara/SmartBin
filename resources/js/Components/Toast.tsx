import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface Toast {
    id: number
    message: string
    sub?: string
    type: 'info' | 'warning' | 'error' | 'success'
}

interface ToastContextType {
    notify: (toast: Omit<Toast, 'id'>) => void
}

const ToastContext = createContext<ToastContextType>({ notify: () => {} })

let nextId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const notify = useCallback((t: Omit<Toast, 'id'>) => {
        const id = nextId++
        setToasts((prev) => [...prev, { ...t, id }])
        setTimeout(() => setToasts((prev) => prev.filter((toast) => toast.id !== id)), 4000)
    }, [])

    const dismiss = useCallback((id: number) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, [])

    const colors = {
        info: { bg: 'from-blue-600/95 to-blue-700/95', border: 'border-blue-400/30', icon: 'text-blue-200', shadow: 'shadow-blue-900/50' },
        warning: { bg: 'from-amber-600/95 to-amber-700/95', border: 'border-amber-400/30', icon: 'text-amber-200', shadow: 'shadow-amber-900/50' },
        error: { bg: 'from-red-600/95 to-red-700/95', border: 'border-red-400/30', icon: 'text-red-200', shadow: 'shadow-red-900/50' },
        success: { bg: 'from-emerald-600/95 to-emerald-700/95', border: 'border-emerald-400/30', icon: 'text-emerald-200', shadow: 'shadow-emerald-900/50' },
    }

    return (
        <ToastContext.Provider value={{ notify }}>
            {children}
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-2 pointer-events-none">
                {toasts.map((toast) => {
                    const c = colors[toast.type]
                    return (
                        <div
                            key={toast.id}
                            onClick={() => dismiss(toast.id)}
                            className={`pointer-events-auto bg-gradient-to-r ${c.bg} backdrop-blur-md border ${c.border} shadow-2xl ${c.shadow} animate-slide-down rounded-xl py-2.5 px-5 cursor-pointer`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-7 h-7 rounded-full bg-white/15 flex items-center justify-center ${c.icon}`}>
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        {toast.type === 'error' || toast.type === 'warning'
                                            ? <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                            : <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        }
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-white">{toast.message}</p>
                                    {toast.sub && <p className="text-xs text-white/70">{toast.sub}</p>}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </ToastContext.Provider>
    )
}

export function useToast() {
    return useContext(ToastContext)
}
