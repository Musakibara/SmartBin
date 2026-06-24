import { ReactNode, useEffect, useState } from 'react'
import i18n from 'i18next'
import { I18nextProvider, initReactI18next } from 'react-i18next'
import fr from '../locales/fr.json'
import en from '../locales/en.json'

const STORAGE_KEY = 'smartbin_locale'
const FALLBACK_LNG = 'fr'

function detectLanguage(): string {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'fr' || stored === 'en') return stored
    const browser = navigator.language?.slice(0, 2)
    if (browser === 'fr') return 'fr'
    return FALLBACK_LNG
}

void i18n.use(initReactI18next).init({
    resources: { fr: { translation: fr }, en: { translation: en } },
    lng: detectLanguage(),
    fallbackLng: FALLBACK_LNG,
    interpolation: { escapeValue: false },
})

i18n.on('languageChanged', (lng) => {
    localStorage.setItem(STORAGE_KEY, lng)
})

export function changeLanguage(lng: 'fr' | 'en') {
    void i18n.changeLanguage(lng)
}

export function currentLanguage(): 'fr' | 'en' {
    return (i18n.language?.slice(0, 2) as 'fr' | 'en') || FALLBACK_LNG
}

export default function I18nProvider({ children }: { children: ReactNode }) {
    const [ready, setReady] = useState(i18n.isInitialized)

    useEffect(() => {
        if (!ready) {
            void i18n.init().then(() => setReady(true))
        }
    }, [ready])

    if (!ready) return null

    return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}
