import { useState } from 'react'
import { Bell, Shield, Globe, Database, Clock, Webhook, Save, RefreshCw, Wifi, Mail, type LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import AppLayout from '../../Layouts/AppLayout'
import { useToast } from '../../Components/Toast'

interface ToggleItem { key: string; label: string; desc: string; icon: LucideIcon }

const toggleKeys: Array<{ key: string; labelKey: string; descKey: string; icon: LucideIcon }> = [
    { key: 'emailNotif', labelKey: 'settings.emailNotif', descKey: 'settings.emailNotifDesc', icon: Mail },
    { key: 'smsNotif', labelKey: 'settings.smsNotif', descKey: 'settings.smsNotifDesc', icon: Bell },
    { key: 'autoResolve', labelKey: 'settings.autoResolve', descKey: 'settings.autoResolveDesc', icon: Shield },
    { key: 'predictionAI', labelKey: 'settings.aiEnabled', descKey: 'settings.aiEnabledDesc', icon: Database },
    { key: 'realtimeSync', labelKey: 'settings.realtimeSync', descKey: 'settings.realtimeSyncDesc', icon: Wifi },
]

function SettingsPage() {
    const { t } = useTranslation()
    const { notify } = useToast()
    const [prefs, setPrefs] = useState<Record<string, boolean>>({
        emailNotif: true, smsNotif: false, autoResolve: true, predictionAI: true, realtimeSync: true,
    })
    const [refreshInterval, setRefreshInterval] = useState('30')
    const [webhookUrl, setWebhookUrl] = useState('https://hooks.smartbin.cm/alert')
    const [retention, setRetention] = useState('90')

    function save() {
        notify({ message: t('settings.toastSaved'), type: 'success' })
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-text-primary">{t('settings.title')}</h1>
                <p className="text-sm text-text-secondary mt-1">{t('settings.subtitle')}</p>
            </div>

            {/* Notifications */}
            <div className="glass rounded-xl p-5">
                <h2 className="text-sm font-bold text-text-primary flex items-center gap-2 mb-4">
                    <Bell className="w-4 h-4 text-emerald-400" />{t('settings.notifications')}
                </h2>
                <div className="space-y-3">
                    {toggleKeys.map(({ key, labelKey, descKey, icon: Icon }) => (
                        <label key={key} className="flex items-center justify-between cursor-pointer group">
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-input-bg">
                                    <Icon className="w-4 h-4 text-text-secondary" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-text-primary">{t(labelKey)}</p>
                                    <p className="text-xs text-text-muted">{t(descKey)}</p>
                                </div>
                            </div>
                            <input type="checkbox" checked={prefs[key]} onChange={() => setPrefs({ ...prefs, [key]: !prefs[key] })} className="hidden" />
                            <div className={`w-10 h-5 rounded-full transition-all cursor-pointer ${prefs[key] ? 'bg-emerald-500' : 'bg-border'}`}>
                                <div className={`w-4 h-4 rounded-full bg-white shadow transition-all mt-0.5 ${prefs[key] ? 'ml-5' : 'ml-0.5'}`} />
                            </div>
                        </label>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Intervalle rafraîchissement */}
                <div className="glass rounded-xl p-5">
                    <h2 className="text-sm font-bold text-text-primary flex items-center gap-2 mb-4">
                        <RefreshCw className="w-4 h-4 text-blue-400" />{t('settings.refresh')}
                    </h2>
                    <div className="space-y-2">
                        <label className="text-xs text-text-muted">{t('settings.intervalSeconds')}</label>
                        <select value={refreshInterval} onChange={(e) => setRefreshInterval(e.target.value)} className="w-full px-3 py-2.5 bg-input-bg rounded-lg border border-border focus:border-blue-500 outline-none text-sm text-text-primary transition-all">
                            <option value="10">{t('settings.10s')}</option>
                            <option value="30">{t('settings.30s')}</option>
                            <option value="60">{t('settings.60s')}</option>
                            <option value="300">{t('settings.300s')}</option>
                        </select>
                    </div>
                </div>

                {/* Rétention données */}
                <div className="glass rounded-xl p-5">
                    <h2 className="text-sm font-bold text-text-primary flex items-center gap-2 mb-4">
                        <Clock className="w-4 h-4 text-purple-400" />{t('settings.retention')}
                    </h2>
                    <div className="space-y-2">
                        <label className="text-xs text-text-muted">{t('settings.retentionLabel')}</label>
                        <select value={retention} onChange={(e) => setRetention(e.target.value)} className="w-full px-3 py-2.5 bg-input-bg rounded-lg border border-border focus:border-purple-500 outline-none text-sm text-text-primary transition-all">
                            <option value="30">{t('settings.retention30')}</option>
                            <option value="60">{t('settings.retention60')}</option>
                            <option value="90">{t('settings.retention90')}</option>
                            <option value="180">{t('settings.retention180')}</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Webhook */}
            <div className="glass rounded-xl p-5">
                <h2 className="text-sm font-bold text-text-primary flex items-center gap-2 mb-4">
                        <Webhook className="w-4 h-4 text-cyan-400" />Webhook
                    </h2>
                    <div className="space-y-2">
                        <label className="text-xs text-text-muted">{t('settings.webhookUrlLabel')}</label>
                        <input value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} className="w-full px-3 py-2.5 bg-input-bg rounded-lg border border-border focus:border-cyan-500 outline-none text-sm text-text-primary transition-all font-mono" />
                </div>
            </div>

            {/* API */}
            <div className="glass rounded-xl p-5">
                <h2 className="text-sm font-bold text-text-primary flex items-center gap-2 mb-4">
                        <Globe className="w-4 h-4 text-amber-400" />API
                    </h2>
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs text-text-muted">{t('settings.apiStatus')}</label>
                        <div className="flex items-center gap-2 mt-1 text-sm">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50" />
                            <span className="text-emerald-400 font-semibold">{t('settings.apiOperational')}</span>
                            <span className="text-text-muted">· v2.4.8</span>
                        </div>
                    </div>
                    <div>
                            <label className="text-xs text-text-muted">{t('settings.apiKey')}</label>
                        <div className="flex items-center gap-2 mt-1">
                            <code className="px-3 py-2 bg-input-bg rounded-lg border border-border text-xs text-text-secondary font-mono">sk-smartbin-••••••••••••••••</code>
                            <button onClick={() => notify({ message: t('settings.apiKeyCopied'), type: 'info' })} className="px-3 py-2 bg-input-bg rounded-lg text-xs text-text-muted hover:text-text-primary transition-all">{t('settings.apiKeyCopy')}</button>
                            <button onClick={() => notify({ message: t('settings.toastKeyGenerated'), type: 'success' })} className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-colors">{t('settings.apiKeyRegenerate')}</button>
                        </div>
                    </div>
                </div>
            </div>

            <button onClick={save} className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors shadow-lg shadow-emerald-600/20">
                <Save className="w-4 h-4" />{t('settings.saveButton')}
            </button>
        </div>
    )
}

SettingsPage.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>
export default SettingsPage
