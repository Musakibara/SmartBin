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
                        <svg className="w-5 h-5 shrink-0" viewBox="0 0 640 480"><g fillRule="evenodd" strokeWidth="1pt"><path fill="#fff" d="M0 0h640v480H0z"/><path fill="#00267f" d="M0 0h213.3v480H0z"/><path fill="#f31830" d="M426.7 0H640v480H426.7z"/></g></svg>
                        {t('env.french')}
                    </button>
                    <button
                        onClick={() => { changeLanguage('en'); setOpen(false) }}
                        className={`flex items-center gap-2 w-full px-4 py-2.5 text-sm transition-colors ${current === 'en' ? 'text-emerald-400 bg-emerald-500/10' : 'text-text-secondary hover:text-text-primary hover:bg-white/5'}`}
                    >
                        <svg className="w-5 h-5 shrink-0" viewBox="0 0 640 480"><g fillRule="evenodd" strokeWidth="1pt"><path fill="#012169" d="M0 0h640v480H0z"/><path fill="#FFF" d="m75 0 244 181L562 0h78v62L400 241l240 178v61h-80L320 301 81 480H0v-60l239-178L0 64V0h75z"/><path fill="#C8102E" d="m424 281 216 159v40L369 281h55zm-184 20 6 35L54 480H0l240-179zM640 0v3L391 191l2-44L590 0h50zM0 0l239 176h-60L0 42V0z"/><path fill="#FFF" d="M241 0v480h160V0H241zM0 160v160h640V160H0z"/><path fill="#C8102E" d="M0 193v96h640v-96H0zM273 0v480h96V0h-96z"/></g></svg>                        {t('env.english')}
                    </button>
                </div>
            )}
        </div>
    )
}
