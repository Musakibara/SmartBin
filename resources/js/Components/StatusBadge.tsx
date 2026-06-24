import { clsx } from 'clsx'
import { useTranslation } from 'react-i18next'

// Statuts possibles d'une benne ou d'une alerte
interface StatusBadgeProps {
    status: 'normal' | 'warning' | 'full' | 'pending' | 'resolved'
}

/** Configuration visuelle pour chaque statut */
const statusConfig = {
    normal: { class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    warning: { class: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    full: { class: 'bg-red-500/10 text-red-400 border-red-500/20' },
    pending: { class: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    resolved: { class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
}

/**
 * Badge coloré indiquant l'état d'une benne ou d'une alerte
 */
export default function StatusBadge({ status }: StatusBadgeProps) {
    const { t } = useTranslation()
    const config = statusConfig[status]
    return (
        <span className={clsx(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
            config.class
        )}>
            <span className={clsx('w-1.5 h-1.5 rounded-full', {
                'bg-emerald-400': status === 'normal' || status === 'resolved',
                'bg-amber-400': status === 'warning' || status === 'pending',
                'bg-red-400': status === 'full',
            })} />
            {t(`statusBadge.${status}`)}
        </span>
    )
}
