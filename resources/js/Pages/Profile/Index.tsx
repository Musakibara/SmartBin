import { useState } from 'react'
import { User, Mail, Phone, MapPin, Lock, Bell, Shield, Moon, Sun, Eye, EyeOff, Save, Camera, Clock, Activity, CheckCircle, XCircle, type LucideIcon } from 'lucide-react'
import AppLayout from '../../Layouts/AppLayout'
import { useToast } from '../../Components/Toast'

interface Activity {
    icon: LucideIcon
    label: string
    time: string
    status: 'success' | 'error' | 'info'
}

const recentActivity: Activity[] = [
    { icon: CheckCircle, label: 'Connexion réussie', time: 'Il y a 2 min', status: 'success' },
    { icon: Activity, label: 'Benne BIN-024 modifiée', time: 'Il y a 15 min', status: 'info' },
    { icon: CheckCircle, label: 'Mot de passe changé', time: 'Il y a 3 jours', status: 'success' },
    { icon: XCircle, label: 'Tentative de connexion échouée', time: 'Il y a 5 jours', status: 'error' },
    { icon: Activity, label: 'Benne BIN-018 ajoutée', time: 'Il y a 1 semaine', status: 'info' },
]

function ProfilePage() {
    const { notify } = useToast()

    const [info, setInfo] = useState({ name: 'Admin User', email: 'admin@smartbin.cm', phone: '+237 691 234 567', location: 'Yaoundé, Cameroun' })
    const [editing, setEditing] = useState(false)
    const [editDraft, setEditDraft] = useState(info)

    const [pass, setPass] = useState({ current: '', new: '', confirm: '' })
    const [showPass, setShowPass] = useState(false)
    const [showNewPass, setShowNewPass] = useState(false)

    const [prefs, setPrefs] = useState({ emailNotif: true, smsNotif: false, darkMode: true, twoFactor: false })

    function saveInfo() {
        if (!editDraft.name.trim() || !editDraft.email.trim()) return
        setInfo(editDraft)
        setEditing(false)
        notify({ message: 'Profil mis à jour', type: 'success' })
    }

    function cancelEdit() {
        setEditDraft(info)
        setEditing(false)
    }

    function savePassword() {
        if (!pass.current || !pass.new || !pass.confirm) { notify({ message: 'Tous les champs sont requis', type: 'warning' }); return }
        if (pass.new !== pass.confirm) { notify({ message: 'Les mots de passe ne correspondent pas', type: 'error' }); return }
        if (pass.new.length < 6) { notify({ message: 'Minimum 6 caractères', type: 'warning' }); return }
        notify({ message: 'Mot de passe mis à jour', type: 'success' })
        setPass({ current: '', new: '', confirm: '' })
    }

    const statusColors: Record<string, string> = {
        success: 'text-emerald-400 bg-emerald-500/10',
        error: 'text-red-400 bg-red-500/10',
        info: 'text-blue-400 bg-blue-500/10',
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* En-tête profil */}
            <div className="glass rounded-2xl p-6 flex items-center gap-5">
                <div className="relative group">
                    <div className="w-20 h-20 rounded-full border-2 border-emerald-500/50 bg-[#1E293B] flex items-center justify-center overflow-hidden">
                        <User className="w-10 h-10 text-emerald-400" />
                    </div>
                    <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-lg transition-all opacity-0 group-hover:opacity-100">
                        <Camera className="w-3.5 h-3.5" />
                    </button>
                </div>
                <div className="flex-1">
                    <h1 className="text-xl font-bold text-white">{info.name}</h1>
                    <p className="text-sm text-gray-400">Administrateur système</p>
                    <div className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            En ligne
                        </span>
                        <span className="text-xs text-gray-500">Membre depuis Mars 2024</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Colonne gauche : Infos et Sécurité */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Informations personnelles */}
                    <div className="glass rounded-xl p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-bold text-white flex items-center gap-2">
                                <User className="w-4 h-4 text-emerald-400" />
                                Informations personnelles
                            </h2>
                            {!editing ? (
                                <button onClick={() => setEditing(true)} className="text-xs text-blue-400 hover:text-blue-300 font-semibold px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 transition-all">Modifier</button>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <button onClick={saveInfo} className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 transition-all">
                                        <Save className="w-3.5 h-3.5" />Sauvegarder
                                    </button>
                                    <button onClick={cancelEdit} className="text-xs text-gray-400 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-all">Annuler</button>
                                </div>
                            )}
                        </div>

                        {editing ? (
                            <div className="space-y-3">
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                    <input value={editDraft.name} onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })} className="w-full pl-10 pr-4 py-2.5 bg-[#1E293B]/80 rounded-lg border border-[#334155] focus:border-emerald-500 outline-none text-sm text-white transition-all" placeholder="Nom" />
                                </div>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                    <input value={editDraft.email} onChange={(e) => setEditDraft({ ...editDraft, email: e.target.value })} className="w-full pl-10 pr-4 py-2.5 bg-[#1E293B]/80 rounded-lg border border-[#334155] focus:border-emerald-500 outline-none text-sm text-white transition-all" placeholder="Email" />
                                </div>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                    <input value={editDraft.phone} onChange={(e) => setEditDraft({ ...editDraft, phone: e.target.value })} className="w-full pl-10 pr-4 py-2.5 bg-[#1E293B]/80 rounded-lg border border-[#334155] focus:border-emerald-500 outline-none text-sm text-white transition-all" placeholder="Téléphone" />
                                </div>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                    <input value={editDraft.location} onChange={(e) => setEditDraft({ ...editDraft, location: e.target.value })} className="w-full pl-10 pr-4 py-2.5 bg-[#1E293B]/80 rounded-lg border border-[#334155] focus:border-emerald-500 outline-none text-sm text-white transition-all" placeholder="Localisation" />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {[
                                    { icon: Mail, label: info.email },
                                    { icon: Phone, label: info.phone },
                                    { icon: MapPin, label: info.location },
                                ].map(({ icon: Icon, label }) => (
                                    <div key={label} className="flex items-center gap-3 text-sm text-gray-400">
                                        <Icon className="w-4 h-4 text-gray-500" />
                                        <span>{label}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Sécurité */}
                    <div className="glass rounded-xl p-5">
                        <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                            <Lock className="w-4 h-4 text-amber-400" />
                            Mot de passe
                        </h2>
                        <div className="space-y-3">
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input type={showPass ? 'text' : 'password'} value={pass.current} onChange={(e) => setPass({ ...pass, current: e.target.value })} className="w-full pl-10 pr-10 py-2.5 bg-[#1E293B]/80 rounded-lg border border-[#334155] focus:border-amber-500 outline-none text-sm text-white transition-all" placeholder="Mot de passe actuel" />
                                <button onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-400">
                                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input type={showNewPass ? 'text' : 'password'} value={pass.new} onChange={(e) => setPass({ ...pass, new: e.target.value })} className="w-full pl-10 pr-10 py-2.5 bg-[#1E293B]/80 rounded-lg border border-[#334155] focus:border-amber-500 outline-none text-sm text-white transition-all" placeholder="Nouveau mot de passe" />
                                <button onClick={() => setShowNewPass(!showNewPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-400">
                                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input type="password" value={pass.confirm} onChange={(e) => setPass({ ...pass, confirm: e.target.value })} className="w-full pl-10 pr-4 py-2.5 bg-[#1E293B]/80 rounded-lg border border-[#334155] focus:border-amber-500 outline-none text-sm text-white transition-all" placeholder="Confirmer le mot de passe" />
                            </div>
                            <button onClick={savePassword} className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-colors">Mettre à jour</button>
                        </div>
                    </div>
                </div>

                {/* Colonne droite : Préférences et Activité */}
                <div className="space-y-6">
                    {/* Préférences */}
                    <div className="glass rounded-xl p-5">
                        <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                            <Bell className="w-4 h-4 text-purple-400" />
                            Préférences
                        </h2>
                        <div className="space-y-3">
                            {[
                                { key: 'emailNotif' as const, icon: Mail, label: 'Notifications email', desc: 'Alertes et rapports par email' },
                                { key: 'smsNotif' as const, icon: Shield, label: 'Notifications SMS', desc: 'Alertes urgentes par SMS' },
                                { key: 'twoFactor' as const, icon: Shield, label: 'Double authentification', desc: 'Sécurité renforcée' },
                            ].map(({ key, icon: Icon, label, desc }) => (
                                <label key={key} className="flex items-start gap-3 cursor-pointer group">
                                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all mt-0.5 ${prefs[key] ? 'bg-emerald-500 border-emerald-500' : 'border-[#334155] group-hover:border-gray-500'}`}>
                                        {prefs[key] && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                                    </div>
                                    <input type="checkbox" checked={prefs[key]} onChange={() => setPrefs({ ...prefs, [key]: !prefs[key] })} className="hidden" />
                                    <div>
                                        <p className="text-sm font-semibold text-white">{label}</p>
                                        <p className="text-xs text-gray-500">{desc}</p>
                                    </div>
                                </label>
                            ))}
                            <div className="border-t border-[#334155] pt-3 mt-3">
                                <label className="flex items-center justify-between cursor-pointer">
                                    <div className="flex items-center gap-2">
                                        {prefs.darkMode ? <Moon className="w-4 h-4 text-blue-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
                                        <span className="text-sm font-semibold text-white">Mode sombre</span>
                                    </div>
                                    <div onClick={() => setPrefs({ ...prefs, darkMode: !prefs.darkMode })} className={`w-10 h-5 rounded-full transition-all cursor-pointer ${prefs.darkMode ? 'bg-emerald-500' : 'bg-[#334155]'}`}>
                                        <div className={`w-4 h-4 rounded-full bg-white shadow transition-all mt-0.5 ${prefs.darkMode ? 'ml-5' : 'ml-0.5'}`} />
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Activité récente */}
                    <div className="glass rounded-xl p-5">
                        <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                            <Clock className="w-4 h-4 text-cyan-400" />
                            Activité récente
                        </h2>
                        <div className="space-y-3">
                            {recentActivity.map(({ icon: Icon, label, time, status }, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <div className={`p-1.5 rounded-lg ${statusColors[status]}`}>
                                        <Icon className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-white truncate">{label}</p>
                                        <p className="text-[10px] text-gray-500">{time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

ProfilePage.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>

export default ProfilePage
