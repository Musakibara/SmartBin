import AppLayout from '@/Layouts/AppLayout';
import { Head, usePage } from '@inertiajs/react';
import { Clock, MessageCircle, Shield, Activity } from 'lucide-react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

const roleLabels = {
    ADMIN: 'Admin',
    SUPERVISEUR: 'Superviseur',
    OPERATEUR: 'Opérateur',
    TECHNICIEN: 'Technicien',
    AGENT: 'Agent',
}

const roleColors = {
    ADMIN: 'from-emerald-500 to-emerald-600',
    SUPERVISEUR: 'from-blue-500 to-blue-600',
    OPERATEUR: 'from-purple-500 to-purple-600',
    TECHNICIEN: 'from-amber-500 to-amber-600',
    AGENT: 'from-gray-500 to-gray-600',
}

const roleBadgeColors = {
    ADMIN: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    SUPERVISEUR: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    OPERATEUR: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    TECHNICIEN: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    AGENT: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
}

function initials(name) {
    const parts = (name || '').trim().split(/\s+/)
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return (name || '??').slice(0, 2).toUpperCase()
}

export default function Edit({ mustVerifyEmail, status }) {
    const user = usePage().props.auth?.user;
    const role = user?.role || 'AGENT'

    return (
        <AppLayout>
            <Head title="Profile" />

            <div className="py-8 space-y-6 max-w-4xl mx-auto px-4 sm:px-6">
                {/* En-tête avec photo/initiales + infos */}
                <div className="glass rounded-xl p-6 flex flex-col sm:flex-row items-center gap-5 hover:border-emerald-500/30 transition-all duration-300">
                    {role === 'ADMIN' ? (
                        <img src="/images/Profile.png" alt="Profile" className="h-20 w-20 rounded-full border-2 border-emerald-500/30 object-cover shadow-lg shrink-0" />
                    ) : (
                        <div className={`h-20 w-20 rounded-full bg-gradient-to-br ${roleColors[role] || roleColors.AGENT} flex items-center justify-center text-white text-2xl font-bold shadow-lg shrink-0`}>
                            {initials(user?.name)}
                        </div>
                    )}
                    <div className="flex-1 text-center sm:text-left">
                        <div className="flex items-center gap-3 justify-center sm:justify-start flex-wrap">
                            <h1 className="text-2xl font-bold text-white">{user?.name || 'Admin User'}</h1>
                            <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold tracking-wide ${roleBadgeColors[role] || roleBadgeColors.AGENT}`}>
                                {roleLabels[role] || role}
                            </span>
                            {user?.last_active_at && (
                                <span className="flex items-center gap-1 text-[10px] text-gray-500">
                                    <Activity className="w-3 h-3" />
                                    {new Date(user.last_active_at).toLocaleDateString('fr-FR')}
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-gray-400 mt-0.5">{user?.email || ''}</p>
                        <div className="flex items-center gap-4 mt-2 justify-center sm:justify-start text-xs text-gray-500">
                            {user?.phone && (
                                <span className="flex items-center gap-1">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                    {user.phone}
                                </span>
                            )}
                            <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                Membre depuis {new Date(user?.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Mini stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: 'Rôle', value: roleLabels[role] || role, icon: Shield, color: 'text-purple-400', bg: 'bg-purple-500/10' },
                        { label: 'Statut', value: user?.status === 'SUSPENDED' ? 'Suspendu' : 'Actif', icon: Activity, color: user?.status === 'SUSPENDED' ? 'text-red-400' : 'text-emerald-400', bg: user?.status === 'SUSPENDED' ? 'bg-red-500/10' : 'bg-emerald-500/10' },
                        { label: 'Email', value: user?.email_verified_at ? 'Vérifié' : 'Non vérifié', icon: Clock, color: user?.email_verified_at ? 'text-emerald-400' : 'text-amber-400', bg: user?.email_verified_at ? 'bg-emerald-500/10' : 'bg-amber-500/10' },
                        { label: 'Téléphone', value: user?.phone || 'Non renseigné', icon: Clock, color: user?.phone ? 'text-blue-400' : 'text-gray-500', bg: user?.phone ? 'bg-blue-500/10' : 'bg-gray-500/10' },
                        { label: 'Telegram', value: user?.telegram_chat_id ? 'Connecté' : 'Non connecté', icon: MessageCircle, color: user?.telegram_chat_id ? 'text-sky-400' : 'text-gray-500', bg: user?.telegram_chat_id ? 'bg-sky-500/10' : 'bg-gray-500/10' },
                    ].map(({ label, value, icon: Icon, color, bg }) => (
                        <div key={label} className="glass rounded-xl p-4 flex items-center gap-3 hover:border-emerald-500/30 transition-all duration-300">
                            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                                <Icon className={`w-5 h-5 ${color}`} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">{label}</p>
                                <p className="text-sm font-bold text-white truncate">{value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="space-y-6">
                    <UpdateProfileInformationForm
                        mustVerifyEmail={mustVerifyEmail}
                        status={status}
                    />
                    <UpdatePasswordForm />
                    <DeleteUserForm />
                </div>
            </div>
        </AppLayout>
    );
}
