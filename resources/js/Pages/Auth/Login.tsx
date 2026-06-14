import { useState } from 'react'
import { Link, Head, useForm } from '@inertiajs/react'
import { Mail, Lock, Eye, EyeOff, LogIn, Loader2, Leaf } from 'lucide-react'
import GuestLayout from '../../Layouts/GuestLayout'
import InputError from '@/Components/InputError'

interface LoginProps {
    canResetPassword: boolean
    status?: string
}

/**
 * Page d'authentification — connexion utilisateur
 * Composée d'une section visuelle (gauche) et du formulaire (droite)
 */
function LoginPage({ canResetPassword, status }: LoginProps) {
    const [showPassword, setShowPassword] = useState(false)
    const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null)

    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    })

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        post(route('login'), {
            onFinish: () => reset('password'),
        })
    }

    // Classe dynamique pour les champs selon le focus
    const inputClass = (field: 'email' | 'password') =>
        `w-full rounded-xl border bg-white py-3.5 pl-11 pr-4 text-[15px] text-[#191c1e] placeholder:text-[#bbcabf]/70 outline-none transition-all duration-200 ${
            focusedField === field
                ? 'border-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.15)]'
                : 'border-[#dce8e0] hover:border-[#bbcabf]'
        }`

    return (
        <main className="flex h-dvh min-h-dvh flex-col overflow-hidden bg-white">
            <Head title="Sign in" />
            <div className="flex h-full flex-col md:flex-row font-sans">
                {/* Panneau gauche — branding et visuel */}
                <section className="relative hidden h-full overflow-hidden md:flex md:w-[40%]">
                    <img src="/images/login-bg.png" alt="" className="absolute inset-0 h-full w-full object-cover" aria-hidden />
                    <div className="absolute inset-0 bg-[#0F172A]/30" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/90 via-[#0F172A]/40 to-transparent" />

                    <div className="absolute left-10 top-10 z-10">
                        <div className="inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/10 px-4 py-2 shadow-lg backdrop-blur-md">
                            <Leaf className="h-4 w-4 text-emerald-400" />
                            <span className="text-[11px] font-semibold tracking-[0.12em] text-white uppercase">Infrastructure Connectée</span>
                        </div>
                    </div>

                    <div className="relative z-10 mt-auto p-10">
                        <div className="max-w-md">
                            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium tracking-wider text-white/70 uppercase backdrop-blur-sm">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                Smart City · IoT
                            </div>
                            <h1 className="text-[clamp(1.75rem,2.5vw,2.5rem)] font-bold leading-[1.15] tracking-[-0.02em] text-white">
                                Optimizing Urban Ecosystems
                            </h1>
                            <p className="mt-3 text-[15px] leading-relaxed text-white/50">
                                AI-driven waste management for a cleaner, smarter, more sustainable future.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Panneau droit — formulaire */}
                <section className="flex h-full w-full flex-col items-center justify-start overflow-y-auto bg-[#f0f4f2] px-6 md:w-[60%]">
                    <div className="w-full max-w-sm py-10">
                        <div className="mb-2 text-center">
                            <img src="/images/logo.png" alt="SmartBin" className="mx-auto mb-4 h-auto w-32" />
                            <h2 className="text-[26px] font-semibold tracking-[-0.01em] text-[#191c1e]">Welcome back</h2>
                            <p className="mt-1 text-[15px] text-[#6c7a71]">Access your monitoring dashboard</p>
                        </div>

                        {status && (
                            <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-[13px] text-emerald-700">
                                {status}
                            </div>
                        )}

                        <div className="rounded-2xl border border-[#dce8e0]/50 bg-white p-7 shadow-lg shadow-black/[0.02]">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Champ email */}
                                <div>
                                    <label htmlFor="email" className="mb-1.5 block text-[13px] font-medium tracking-[0.01em] text-[#3c4a42]">Email</label>
                                    <div className="relative">
                                        <Mail
                                            className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200 ${
                                                focusedField === 'email' ? 'text-emerald-500' : 'text-[#bbcabf]'
                                            }`}
                                            size={18}
                                        />
                                        <input
                                            id="email"
                                            type="email"
                                            value={data.email}
                                            onChange={e => setData('email', e.target.value)}
                                            required
                                            placeholder="name@domain.com"
                                            onFocus={() => setFocusedField('email')}
                                            onBlur={() => setFocusedField(null)}
                                            className={inputClass('email')}
                                            autoComplete="email"
                                        />
                                    </div>
                                    <InputError message={errors.email} className="mt-1" />
                                </div>

                                {/* Champ mot de passe */}
                                <div>
                                    <div className="mb-1.5 flex items-center justify-between">
                                        <label htmlFor="password" className="block text-[13px] font-medium tracking-[0.01em] text-[#3c4a42]">Password</label>
                                        {canResetPassword && (
                                            <Link href={route('password.request')} className="whitespace-nowrap text-[12px] font-medium text-emerald-600 hover:text-emerald-700">
                                                Forgot Password?
                                            </Link>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <Lock
                                            className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200 ${
                                                focusedField === 'password' ? 'text-emerald-500' : 'text-[#bbcabf]'
                                            }`}
                                            size={18}
                                        />
                                        <input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            value={data.password}
                                            onChange={e => setData('password', e.target.value)}
                                            required
                                            placeholder="Enter your password"
                                            onFocus={() => setFocusedField('password')}
                                            onBlur={() => setFocusedField(null)}
                                            className={inputClass('password')}
                                            autoComplete="current-password"
                                        />
                                        {/* Bouton afficher/masquer le mot de passe */}
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#bbcabf] transition-colors hover:text-[#3c4a42]"
                                            tabIndex={-1}
                                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Se souvenir de moi */}
                                <div className="flex items-center">
                                    <input
                                        id="remember"
                                        type="checkbox"
                                        checked={data.remember}
                                        onChange={e => setData('remember', e.target.checked)}
                                        className="h-4 w-4 rounded border-[#bbcabf] text-emerald-600 focus:ring-emerald-500/30"
                                    />
                                    <label htmlFor="remember" className="ml-2.5 cursor-pointer text-[13px] font-medium text-[#3c4a42] select-none">
                                        Remember me
                                    </label>
                                </div>

                                {/* Bouton de connexion */}
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3.5 text-[14px] font-semibold text-white shadow-sm transition-all duration-200 hover:bg-emerald-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {processing ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            <span>Signing in...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Sign in</span>
                                            <LogIn size={18} />
                                        </>
                                    )}
                                </button>

                                {/* Séparateur avec "or" */}
                                <div className="relative flex items-center py-1">
                                    <div className="flex-grow border-t border-[#dce8e0]" />
                                    <span className="mx-4 text-[11px] font-medium uppercase tracking-[0.1em] text-[#6c7a71]">or</span>
                                    <div className="flex-grow border-t border-[#dce8e0]" />
                                </div>

                                {/* Boutons SSO */}
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        className="flex items-center justify-center gap-2 rounded-xl border border-[#dce8e0] bg-white px-4 py-3 text-[13px] font-medium text-[#3c4a42] transition-colors hover:bg-[#f2f5f3] active:scale-[0.98]"
                                    >
                                        <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24">
                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                        </svg>
                                        <span>Google</span>
                                    </button>
                                    <button
                                        type="button"
                                        className="flex items-center justify-center gap-2 rounded-xl border border-[#dce8e0] bg-white px-4 py-3 text-[13px] font-medium text-[#3c4a42] transition-colors hover:bg-[#f2f5f3] active:scale-[0.98]"
                                    >
                                        <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24">
                                            <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z" fill="#00a4ef" />
                                        </svg>
                                        <span>Microsoft</span>
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Lien vers inscription */}
                        <div className="mt-5 text-center">
                            <span className="text-[13px] text-[#6c7a71]">
                                Don't have an account?{' '}
                                <Link href="/signup" className="font-medium text-emerald-600 transition-colors hover:text-emerald-700">
                                    Sign up
                                </Link>
                            </span>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    )
}

// Applique le layout invité (sans sidebar ni navbar)
LoginPage.layout = (page: React.ReactNode) => <GuestLayout>{page}</GuestLayout>

export default LoginPage