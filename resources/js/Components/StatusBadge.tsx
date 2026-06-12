import { clsx } from 'clsx'

// Statuts possibles d'une benne ou d'une alerte
interface StatusBadgeProps {
    status: 'normal' | 'warning' | 'full' | 'pending' | 'resolved'
}

/** Configuration visuelle pour chaque statut */
const statusConfig = {
    normal: { label: 'Normal', class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    warning: { label: 'Attention', class: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    full: { label: 'Pleine', class: 'bg-red-500/10 text-red-400 border-red-500/20' },
    pending: { label: 'En attente', class: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    resolved: { label: 'Résolue', class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
}

/**
 * Badge coloré indiquant l'état d'une benne ou d'une alerte
 */
export default function StatusBadge({ status }: StatusBadgeProps) {
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
            {config.label}
        </span>
    )
}
