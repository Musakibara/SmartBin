import { useState } from 'react'
import { Link, Head, useForm } from '@inertiajs/react'
import { Mail, Lock, Eye, EyeOff, User, Phone, Loader2, Leaf, UserPlus } from 'lucide-react'
import GuestLayout from '../../Layouts/GuestLayout'
import InputError from '@/Components/InputError'

/**
 * Page d'inscription — création de compte utilisateur
 * Même structure que Login avec un champ nom supplémentaire
 */
function SignUpPage() {
    const [showPassword, setShowPassword] = useState(false)
    const [focusedField, setFocusedField] = useState<'name' | 'email' | 'phone' | 'password' | null>(null)

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        phone: '',
        password: '',
        password_confirmation: '',
    })

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        })
    }

    // Classe dynamique pour les champs selon le focus
    const inputClass = (field: 'name' | 'email' | 'phone' | 'password') =>
        `w-full rounded-xl border bg-white py-2.5 pl-10 pr-3 text-[14px] text-[#191c1e] placeholder:text-[#bbcabf]/70 outline-none transition-all duration-200 ${
            focusedField === field
                ? 'border-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.15)]'
                : 'border-[#dce8e0] hover:border-[#bbcabf]'
        }`

    return (
        <main className="flex h-dvh min-h-dvh flex-col overflow-hidden bg-white">
            <Head title="Sign up" />
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
                <section className="flex h-full w-full flex-col items-center justify-center bg-[#f0f4f2] px-6 md:w-[60%]">
                    <div className="w-full max-w-sm">
                        <div className="text-center">
                            <img src="/images/logo.png" alt="SmartBin" className="mx-auto mb-3 h-auto w-28" />
                            <h2 className="text-[24px] font-semibold tracking-[-0.01em] text-[#191c1e]">Create your account</h2>
                            <p className="text-[14px] text-[#6c7a71]">Get started with SmartBin monitoring</p>
                        </div>

                        <div className="mt-4 rounded-2xl border border-[#dce8e0]/50 bg-white p-5 shadow-lg shadow-black/[0.02]">
                            <form onSubmit={handleSubmit} className="space-y-2.5">
                                {/* Champ nom complet */}
                                <div>
                                    <label htmlFor="name" className="mb-1 block text-[12px] font-medium tracking-[0.01em] text-[#3c4a42]">Full Name</label>
                                    <div className="relative">
                                        <User
                                            className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200 ${
                                                focusedField === 'name' ? 'text-emerald-500' : 'text-[#bbcabf]'
                                            }`}
                                            size={16}
                                        />
                                        <input
                                            id="name"
                                            type="text"
                                            value={data.name}
                                            onChange={e => setData('name', e.target.value)}
                                            required
                                            placeholder="John Doe"
                                            onFocus={() => setFocusedField('name')}
                                            onBlur={() => setFocusedField(null)}
                                            className={inputClass('name')}
                                            autoComplete="name"
                                        />
                                    </div>
                                    <InputError message={errors.name} className="mt-0.5" />
                                </div>

                                {/* Champ email */}
                                <div>
                                    <label htmlFor="email" className="mb-1 block text-[12px] font-medium tracking-[0.01em] text-[#3c4a42]">Email</label>
                                    <div className="relative">
                                        <Mail
                                            className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200 ${
                                                focusedField === 'email' ? 'text-emerald-500' : 'text-[#bbcabf]'
                                            }`}
                                            size={16}
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
                                    <InputError message={errors.email} className="mt-0.5" />
                                </div>

                                {/* Champ téléphone */}
                                <div>
                                    <label htmlFor="phone" className="mb-1 block text-[12px] font-medium tracking-[0.01em] text-[#3c4a42]">Phone Number</label>
                                    <div className="relative">
                                        <Phone
                                            className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200 ${
                                                focusedField === 'name' ? 'text-emerald-500' : 'text-[#bbcabf]'
                                            }`}
                                            size={16}
                                        />
                                        <input
                                            id="phone"
                                            type="tel"
                                            value={data.phone}
                                            onChange={e => setData('phone', e.target.value)}
                                            placeholder="+237 6XX XXX XXX"
                                            onFocus={() => setFocusedField('name')}
                                            onBlur={() => setFocusedField(null)}
                                            className={inputClass('name')}
                                            autoComplete="tel"
                                        />
                                    </div>
                                    <InputError message={errors.phone} className="mt-0.5" />
                                </div>

                                {/* Champ mot de passe */}
                                <div>
                                    <label htmlFor="password" className="mb-1 block text-[12px] font-medium tracking-[0.01em] text-[#3c4a42]">Password</label>
                                    <div className="relative">
                                        <Lock
                                            className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200 ${
                                                focusedField === 'password' ? 'text-emerald-500' : 'text-[#bbcabf]'
                                            }`}
                                            size={16}
                                        />
                                        <input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            value={data.password}
                                            onChange={e => setData('password', e.target.value)}
                                            required
                                            placeholder="Create a strong password"
                                            minLength={8}
                                            onFocus={() => setFocusedField('password')}
                                            onBlur={() => setFocusedField(null)}
                                            className={inputClass('password')}
                                            autoComplete="new-password"
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
                                    <InputError message={errors.password} className="mt-0.5" />
                                </div>

                                {/* Champ confirmation mot de passe */}
                                <div>
                                    <label htmlFor="password_confirmation" className="mb-1 block text-[12px] font-medium tracking-[0.01em] text-[#3c4a42]">Confirm Password</label>
                                    <div className="relative">
                                        <Lock
                                            className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200 ${
                                                focusedField === 'password' ? 'text-emerald-500' : 'text-[#bbcabf]'
                                            }`}
                                            size={16}
                                        />
                                        <input
                                            id="password_confirmation"
                                            type={showPassword ? 'text' : 'password'}
                                            value={data.password_confirmation}
                                            onChange={e => setData('password_confirmation', e.target.value)}
                                            required
                                            placeholder="Repeat your password"
                                            onFocus={() => setFocusedField('password')}
                                            onBlur={() => setFocusedField(null)}
                                            className={inputClass('password')}
                                            autoComplete="new-password"
                                        />
                                    </div>
                                    <InputError message={errors.password_confirmation} className="mt-0.5" />
                                </div>

                                {/* Bouton inscription */}
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm transition-all duration-200 hover:bg-emerald-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {processing ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            <span>Creating account...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Sign up</span>
                                            <UserPlus size={18} />
                                        </>
                                    )}
                                </button>

                                {/* Séparateur avec "or" */}
                                <div className="relative flex items-center">
                                    <div className="flex-grow border-t border-[#dce8e0]" />
                                    <span className="mx-3 text-[10px] font-medium uppercase tracking-[0.1em] text-[#6c7a71]">or</span>
                                    <div className="flex-grow border-t border-[#dce8e0]" />
                                </div>

                                {/* Boutons SSO */}
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        className="flex items-center justify-center gap-1.5 rounded-xl border border-[#dce8e0] bg-white px-3 py-2 text-[12px] font-medium text-[#3c4a42] transition-colors hover:bg-[#f2f5f3] active:scale-[0.98]"
                                    >
                                        <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24">
                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                        </svg>
                                        <span>Google</span>
                                    </button>
                                    <button
                                        type="button"
                                        className="flex items-center justify-center gap-1.5 rounded-xl border border-[#dce8e0] bg-white px-3 py-2 text-[12px] font-medium text-[#3c4a42] transition-colors hover:bg-[#f2f5f3] active:scale-[0.98]"
                                    >
                                        <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24">
                                            <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z" fill="#00a4ef" />
                                        </svg>
                                        <span>Microsoft</span>
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Lien vers connexion */}
                        <div className="mt-4 text-center">
                            <span className="text-[12px] text-[#6c7a71]">
                                Already have an account?{' '}
                                <Link href="/login" className="font-medium text-emerald-600 transition-colors hover:text-emerald-700">
                                    Sign in
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
SignUpPage.layout = (page: React.ReactNode) => <GuestLayout>{page}</GuestLayout>

export default SignUpPage