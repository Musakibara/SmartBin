import { createInertiaApp } from '@inertiajs/react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers'

createInertiaApp({
    resolve: (name) => {
        const pages = import.meta.glob('./Pages/**/*.tsx')
        return resolvePageComponent(`./Pages/${name}.tsx`, pages)
    },
    setup({ el, App, props }) {
        if (import.meta.env.DEV) {
            const root = createRoot(el)
            root.render(<App {...props} />)
        } else {
            hydrateRoot(el, <App {...props} />)
        }
    },
    progress: {
        color: '#10B981',
    },
})
