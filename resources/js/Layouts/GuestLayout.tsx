import { ReactNode } from 'react'

interface GuestLayoutProps {
    children: ReactNode
}

/**
 * Layout pour les pages publiques (login, signup)
 * Simple wrapper sans structure d'application
 */
export default function GuestLayout({ children }: GuestLayoutProps) {
    return <>{children}</>
}
