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
        <div className="glass kpi-card rounded-xl p-5">
            <div className="flex items-start justify-between">
                <div className="space-y-2">
                    <p className="text-sm text-gray-400 font-medium">{title}</p>
                    <p className="text-2xl font-bold text-white">{value}</p>
                    {trend && (
                        <p className={`text-xs flex items-center gap-1 ${trendUp ? 'text-emerald-400' : 'text-red-400'}`}>
                            <span>{trendUp ? '↑' : '↓'}</span>
                            {trend}
                        </p>
                    )}
                </div>
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <Icon className="w-5 h-5 text-emerald-400" />
                </div>
            </div>
        </div>
    )
}
