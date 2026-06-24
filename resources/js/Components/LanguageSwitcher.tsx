import { useTranslation } from 'react-i18next'
import { Languages } from 'lucide-react'
import { changeLanguage, currentLanguage } from './I18nProvider'
import { useState, useRef, useEffect } from 'react'

export default function LanguageSwitcher() {
    const { t } = useTranslation()
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)
    const current = currentLanguage()

    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape') setOpen(false)
        }
        function onClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('keydown', onKey)
        document.addEventListener('mousedown', onClick)
        return () => {
            document.removeEventListener('keydown', onKey)
            document.removeEventListener('mousedown', onClick)
        }
    }, [])

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen((p) => !p)}
                className="p-2 text-text-secondary hover:text-[#10B981] hover:bg-white/5 rounded-xl transition-all active:scale-95"
                title={t('env.language')}
            >
                <Languages className="w-[20px] h-[20px]" />
            </button>
            {open && (
                <div className="absolute right-0 mt-2 w-36 rounded-xl border border-border bg-bg-secondary shadow-xl backdrop-blur-xl overflow-hidden z-50">
                    <button
                        onClick={() => { changeLanguage('fr'); setOpen(false) }}
                        className={`flex items-center gap-2 w-full px-4 py-2.5 text-sm transition-colors ${current === 'fr' ? 'text-emerald-400 bg-emerald-500/10' : 'text-text-secondary hover:text-text-primary hover:bg-white/5'}`}
                    >
                        <span className="text-base">🇫🇷</span>
                        {t('env.french')}
                    </button>
                    <button
                        onClick={() => { changeLanguage('en'); setOpen(false) }}
                        className={`flex items-center gap-2 w-full px-4 py-2.5 text-sm transition-colors ${current === 'en' ? 'text-emerald-400 bg-emerald-500/10' : 'text-text-secondary hover:text-text-primary hover:bg-white/5'}`}
                    >
                        <span className="text-base">🇬🇧</span>
                        {t('env.english')}
                    </button>
                </div>
            )}
        </div>
    )
}
