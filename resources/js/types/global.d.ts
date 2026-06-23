/// <reference types="vite/client" />

import { route as routeFn } from 'ziggy-js'

declare global {
    var route: typeof routeFn
}

declare module '@inertiajs/core' {
    interface PageProps {
        auth?: {
            user: {
                id: string
                name: string
                email: string
                role: string
                phone?: string
                avatar?: string | null
            } | null
        }
    }
}

export {}
