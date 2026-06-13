import { useState } from 'react'
import { Bell, Shield, Globe, Database, Clock, Webhook, Save, RefreshCw, Wifi, Mail, type LucideIcon } from 'lucide-react'
import AppLayout from '../../Layouts/AppLayout'
import { useToast } from '../../Components/Toast'

interface ToggleItem { key: string; label: string; desc: string; icon: LucideIcon }

const toggles: ToggleItem[] = [
    { key: 'emailNotif', label: 'Notifications email', desc: 'Alertes et rapports quotidiens', icon: Mail },
    { key: 'smsNotif', label: 'Notifications SMS', desc: 'Alertes critiques par SMS', icon: Bell },
    { key: 'autoResolve', label: 'Résolution automatique', desc: 'Marquer les alertes comme résolues après intervention', icon: Shield },
    { key: 'predictionAI', label: 'Prédictions IA', desc: 'Activer les algorithmes de prédiction des débordements', icon: Database },
    { key: 'realtimeSync', label: 'Synchronisation temps réel', desc: 'Mettre à jour les données en continu', icon: Wifi },
]

function SettingsPage() {
    const { notify } = useToast()
    const [prefs, setPrefs] = useState<Record<string, boolean>>({
        emailNotif: true, smsNotif: false, autoResolve: true, predictionAI: true, realtimeSync: true,
    })
    const [refreshInterval, setRefreshInterval] = useState('30')
    const [webhookUrl, setWebhookUrl] = useState('https://hooks.smartbin.cm/alert')
    const [retention, setRetention] = useState('90')

    function save() {
        notify({ message: 'Paramètres sauvegardés', type: 'success' })
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Paramètres</h1>
                <p className="text-sm text-gray-400 mt-1">Configuration générale du système</p>
            </div>

            {/* Notifications */}
            <div className="glass rounded-xl p-5">
                <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                    <Bell className="w-4 h-4 text-emerald-400" />Notifications
                </h2>
                <div className="space-y-3">
                    {toggles.map(({ key, label, desc, icon: Icon }) => (
                        <label key={key} className="flex items-center justify-between cursor-pointer group">
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-[#1E293B]/80">
                                    <Icon className="w-4 h-4 text-gray-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-white">{label}</p>
                                    <p className="text-xs text-gray-500">{desc}</p>
                                </div>
                            </div>
                            <input type="checkbox" checked={prefs[key]} onChange={() => setPrefs({ ...prefs, [key]: !prefs[key] })} className="hidden" />
                            <div className={`w-10 h-5 rounded-full transition-all cursor-pointer ${prefs[key] ? 'bg-emerald-500' : 'bg-[#334155]'}`}>
                                <div className={`w-4 h-4 rounded-full bg-white shadow transition-all mt-0.5 ${prefs[key] ? 'ml-5' : 'ml-0.5'}`} />
                            </div>
                        </label>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Intervalle rafraîchissement */}
                <div className="glass rounded-xl p-5">
                    <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                        <RefreshCw className="w-4 h-4 text-blue-400" />Rafraîchissement
                    </h2>
                    <div className="space-y-2">
                        <label className="text-xs text-gray-500">Intervalle (secondes)</label>
                        <select value={refreshInterval} onChange={(e) => setRefreshInterval(e.target.value)} className="w-full px-3 py-2.5 bg-[#1E293B]/80 rounded-lg border border-[#334155] focus:border-blue-500 outline-none text-sm text-white transition-all">
                            <option value="10">10 secondes</option>
                            <option value="30">30 secondes</option>
                            <option value="60">1 minute</option>
                            <option value="300">5 minutes</option>
                        </select>
                    </div>
                </div>

                {/* Rétention données */}
                <div className="glass rounded-xl p-5">
                    <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                        <Clock className="w-4 h-4 text-purple-400" />Rétention
                    </h2>
                    <div className="space-y-2">
                        <label className="text-xs text-gray-500">Conserver les données (jours)</label>
                        <select value={retention} onChange={(e) => setRetention(e.target.value)} className="w-full px-3 py-2.5 bg-[#1E293B]/80 rounded-lg border border-[#334155] focus:border-purple-500 outline-none text-sm text-white transition-all">
                            <option value="30">30 jours</option>
                            <option value="60">60 jours</option>
                            <option value="90">90 jours</option>
                            <option value="180">180 jours</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Webhook */}
            <div className="glass rounded-xl p-5">
                <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                    <Webhook className="w-4 h-4 text-cyan-400" />Webhook
                </h2>
                <div className="space-y-2">
                    <label className="text-xs text-gray-500">URL de notification</label>
                    <input value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} className="w-full px-3 py-2.5 bg-[#1E293B]/80 rounded-lg border border-[#334155] focus:border-cyan-500 outline-none text-sm text-white transition-all font-mono" />
                </div>
            </div>

            {/* API */}
            <div className="glass rounded-xl p-5">
                <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                    <Globe className="w-4 h-4 text-amber-400" />API
                </h2>
                <div className="space-y-3">
                    <div>
                        <label className="text-xs text-gray-500">Statut</label>
                        <div className="flex items-center gap-2 mt-1 text-sm">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50" />
                            <span className="text-emerald-400 font-semibold">Opérationnel</span>
                            <span className="text-gray-600">· v2.4.8</span>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500">Clé API</label>
                        <div className="flex items-center gap-2 mt-1">
                            <code className="px-3 py-2 bg-[#1E293B]/80 rounded-lg border border-[#334155] text-xs text-gray-400 font-mono">sk-smartbin-••••••••••••••••</code>
                            <button onClick={() => notify({ message: 'Clé API copiée', type: 'info' })} className="px-3 py-2 bg-[#1E293B]/80 rounded-lg text-xs text-gray-500 hover:text-white transition-all">Copier</button>
                            <button onClick={() => notify({ message: 'Nouvelle clé générée', type: 'success' })} className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-colors">Régénérer</button>
                        </div>
                    </div>
                </div>
            </div>

            <button onClick={save} className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors shadow-lg shadow-emerald-600/20">
                <Save className="w-4 h-4" />Sauvegarder les paramètres
            </button>
        </div>
    )
}

SettingsPage.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>
export default SettingsPage
