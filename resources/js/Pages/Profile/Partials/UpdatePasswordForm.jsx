import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Lock } from 'lucide-react';
import { useForm } from '@inertiajs/react';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/Components/Toast';

export default function UpdatePasswordForm({ className = '' }) {
    const { t } = useTranslation();
    const passwordInput = useRef();
    const currentPasswordInput = useRef();
    const { notify } = useToast();

    const {
        data,
        setData,
        errors,
        put,
        reset,
        processing,
    } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updatePassword = (e) => {
        e.preventDefault();

        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                notify({ message: t('profile.passwordUpdated'), sub: t('profile.passwordUpdatedSub'), type: 'success' });
            },
            onError: (errors) => {
                if (errors.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current.focus();
                }

                if (errors.current_password) {
                    reset('current_password');
                    currentPasswordInput.current.focus();
                }
            },
        });
    };

    return (
        <section className={`glass rounded-xl p-6 hover:border-emerald-500/30 transition-all duration-300 ${className}`}>
            <header className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Lock className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-text-primary">
                        {t('profile.security')}
                    </h2>
                    <p className="text-sm text-text-secondary">
                        {t('profile.securityDesc')}
                    </p>
                </div>
            </header>

            <form onSubmit={updatePassword} className="space-y-5">
                <div>
                    <InputLabel
                        htmlFor="current_password"
                        value={t('profile.currentPassword')}
                        className="text-text-primary text-xs font-semibold"
                    />

                    <TextInput
                        id="current_password"
                        ref={currentPasswordInput}
                        value={data.current_password}
                        onChange={(e) =>
                            setData('current_password', e.target.value)
                        }
                        type="password"
                        className="mt-1 block w-full border-border bg-input-bg text-text-primary placeholder:text-text-muted focus:border-emerald-500 focus:ring-emerald-500"
                        autoComplete="current-password"
                    />

                    <InputError
                        message={errors.current_password}
                        className="mt-2"
                    />
                </div>

                <div>
                    <InputLabel htmlFor="password" value={t('profile.newPassword')} className="text-text-primary text-xs font-semibold" />

                    <TextInput
                        id="password"
                        ref={passwordInput}
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        type="password"
                        className="mt-1 block w-full border-border bg-input-bg text-text-primary placeholder:text-text-muted focus:border-emerald-500 focus:ring-emerald-500"
                        autoComplete="new-password"
                    />

                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div>
                    <InputLabel
                        htmlFor="password_confirmation"
                        value={t('profile.confirmPassword')}
                        className="text-text-primary text-xs font-semibold"
                    />

                    <TextInput
                        id="password_confirmation"
                        value={data.password_confirmation}
                        onChange={(e) =>
                            setData('password_confirmation', e.target.value)
                        }
                        type="password"
                        className="mt-1 block w-full border-border bg-input-bg text-text-primary placeholder:text-text-muted focus:border-emerald-500 focus:ring-emerald-500"
                        autoComplete="new-password"
                    />

                    <InputError
                        message={errors.password_confirmation}
                        className="mt-2"
                    />
                </div>

                <div className="flex items-center gap-4 pt-2">
                    <PrimaryButton disabled={processing} className="bg-emerald-600 hover:bg-emerald-500 focus:ring-emerald-500 active:bg-emerald-700">
                        {t('common.save')}
                    </PrimaryButton>
                </div>
            </form>
        </section>
    );
}
