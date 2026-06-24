import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@/Components/ThemeProvider';
import I18nProvider from '@/Components/I18nProvider';

const appName = import.meta.env.VITE_APP_NAME || 'SmartBin';

const pages = import.meta.glob(['./Pages/**/*.tsx', './Pages/**/*.jsx']);

createInertiaApp({
    title: (title) => `${title} — ${appName}`,
    resolve: (name) => {
        const page = pages[`./Pages/${name}.tsx`] || pages[`./Pages/${name}.jsx`];
        if (!page) throw new Error(`Page not found: ${name}`);
        return page();
    },
    setup({ el, App, props }) {
        const root = createRoot(el);
        root.render(
            <I18nProvider>
                <ThemeProvider>
                    <App {...props} />
                </ThemeProvider>
            </I18nProvider>
        );
    },
    progress: {
        color: '#10B981',
    },
});
