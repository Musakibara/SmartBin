import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { MessageCircle, User } from 'lucide-react';
import { Link, useForm, usePage } from '@inertiajs/react';
import { useToast } from '@/Components/Toast';

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    className = '',
}) {
    const user = usePage().props.auth.user;
    const { notify } = useToast();

    const { data, setData, patch, errors, processing, recentlySuccessful } =
        useForm({
            name: user.name,
            email: user.email,
            phone: user.phone || '',
            telegram_chat_id: user.telegram_chat_id || '',
        });

    const submit = (e) => {
        e.preventDefault();

        patch(route('profile.update'), {
            onSuccess: () => notify({ message: 'Profil mis à jour', sub: 'Vos informations ont été enregistrées.', type: 'success' }),
        });
    };

    return (
        <section className={`glass rounded-xl p-6 hover:border-emerald-500/30 transition-all duration-300 ${className}`}>
            <header className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-text-primary">
                        Informations personnelles
                    </h2>
                    <p className="text-sm text-text-secondary">
                        Mettez à jour votre nom, email, téléphone et Telegram.
                    </p>
                </div>
            </header>

            <form onSubmit={submit} className="space-y-5">
                <div>
                    <InputLabel htmlFor="name" value="Nom" className="text-text-primary text-xs font-semibold" />

                    <TextInput
                        id="name"
                        className="mt-1 block w-full border-border bg-input-bg text-text-primary placeholder:text-text-muted focus:border-emerald-500 focus:ring-emerald-500"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                        isFocused
                        autoComplete="name"
                    />

                    <InputError className="mt-2" message={errors.name} />
                </div>

                <div>
                    <InputLabel htmlFor="email" value="Email" className="text-text-primary text-xs font-semibold" />

                    <TextInput
                        id="email"
                        type="email"
                        className="mt-1 block w-full border-border bg-input-bg text-text-primary placeholder:text-text-muted focus:border-emerald-500 focus:ring-emerald-500"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        required
                        autoComplete="username"
                    />

                    <InputError className="mt-2" message={errors.email} />
                </div>

                <div>
                    <InputLabel htmlFor="phone" value="Téléphone" className="text-text-primary text-xs font-semibold" />

                    <TextInput
                        id="phone"
                        type="tel"
                        className="mt-1 block w-full border-border bg-input-bg text-text-primary placeholder:text-text-muted focus:border-emerald-500 focus:ring-emerald-500"
                        value={data.phone}
                        onChange={(e) => setData('phone', e.target.value)}
                        autoComplete="tel"
                        placeholder="+237 XXXXXXXXX"
                    />

                    <InputError className="mt-2" message={errors.phone} />
                </div>

                <div>
                    <InputLabel htmlFor="telegram_chat_id" value="Telegram Chat ID" className="text-text-primary text-xs font-semibold" />

                    <TextInput
                        id="telegram_chat_id"
                        type="text"
                        className="mt-1 block w-full border-border bg-input-bg text-text-primary placeholder:text-text-muted focus:border-emerald-500 focus:ring-emerald-500"
                        value={data.telegram_chat_id}
                        onChange={(e) => setData('telegram_chat_id', e.target.value)}
                        placeholder="1739774375"
                    />

                    <div className="mt-1.5 flex items-center gap-1.5">
                        <MessageCircle className="w-3 h-3 text-sky-400" />
                        <p className="text-[11px] text-text-muted">
                            ID numérique récupéré depuis <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:underline">@BotFather</a>
                        </p>
                    </div>

                    <InputError className="mt-2" message={errors.telegram_chat_id} />
                </div>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                        <p className="text-sm text-amber-400">
                            Votre adresse email n'est pas vérifiée.
                            <Link
                                href={route('verification.send')}
                                method="post"
                                as="button"
                                className="ml-1 rounded-md text-sm text-emerald-400 underline hover:text-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                            >
                                Renvoyer le lien de vérification.
                            </Link>
                        </p>

                        {status === 'verification-link-sent' && (
                            <p className="mt-1 text-sm font-medium text-emerald-400">
                                Un nouveau lien de vérification a été envoyé.
                            </p>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-4 pt-2">
                    <PrimaryButton disabled={processing} className="bg-emerald-600 hover:bg-emerald-500 focus:ring-emerald-500 active:bg-emerald-700">
                        Enregistrer
                    </PrimaryButton>
                </div>
            </form>
        </section>
    );
}
