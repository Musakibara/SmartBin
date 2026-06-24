import { type LucideIcon } from 'lucide-react'

// Props du composant carte KPI
interface KPICardProps {
    title: string
    value: string | number
    icon: LucideIcon
    trend?: string
    trendUp?: boolean
}

/**
 * Carte d'indicateur clé de performance
 * Affiche une métrique avec son icône et une tendance optionnelle
 */
export default function KPICard({ title, value, icon: Icon, trend, trendUp }: KPICardProps) {
    return (
        <div className="glass kpi-card rounded-xl p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 sm:space-y-2 min-w-0">
                    <p className="text-xs sm:text-sm text-text-secondary font-medium truncate">{title}</p>
                    <p className="text-xl sm:text-2xl font-bold text-text-primary">{value}</p>
                    {trend && (
                        <p className={`text-[10px] sm:text-xs flex items-center gap-1 ${trendUp ? 'text-emerald-400' : 'text-red-400'}`}>
                            <span>{trendUp ? '↑' : '↓'}</span>
                            {trend}
                        </p>
                    )}
                </div>
                <div className="p-2 sm:p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 shrink-0">
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                </div>
            </div>
        </div>
    )
}
