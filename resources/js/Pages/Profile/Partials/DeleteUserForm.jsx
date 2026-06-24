import DangerButton from '@/Components/DangerButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { Trash2 } from 'lucide-react';
import { useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function DeleteUserForm({ className = '' }) {
    const { t } = useTranslation();
    const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);
    const passwordInput = useRef();

    const {
        data,
        setData,
        delete: destroy,
        processing,
        reset,
        errors,
        clearErrors,
    } = useForm({
        password: '',
    });

    const confirmUserDeletion = () => {
        setConfirmingUserDeletion(true);
    };

    const deleteUser = (e) => {
        e.preventDefault();

        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => passwordInput.current.focus(),
            onFinish: () => reset(),
        });
    };

    const closeModal = () => {
        setConfirmingUserDeletion(false);

        clearErrors();
        reset();
    };

    return (
        <section className={`glass rounded-xl p-6 hover:border-red-500/30 transition-all duration-300 border border-red-500/10 ${className}`}>
            <header className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                    <Trash2 className="w-4 h-4 text-red-400" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-text-primary">
                        {t('profile.delete')}
                    </h2>
                    <p className="text-sm text-text-secondary">
                        {t('profile.deleteDesc')}
                    </p>
                </div>
            </header>

            <DangerButton onClick={confirmUserDeletion} className="bg-red-600 hover:bg-red-500 focus:ring-red-500 active:bg-red-700">
                {t('profile.deleteButton')}
            </DangerButton>

            <Modal show={confirmingUserDeletion} onClose={closeModal}>
                <form onSubmit={deleteUser} className="p-6">
                    <h2 className="text-lg font-medium text-text-primary">
                        {t('profile.deleteConfirm')}
                    </h2>

                    <p className="mt-1 text-sm text-text-secondary">
                        {t('profile.deleteHint')}
                    </p>

                    <div className="mt-6">
                        <InputLabel
                            htmlFor="password"
                            value={t('profile.passwordPlaceholder')}
                            className="sr-only"
                        />

                        <TextInput
                            id="password"
                            type="password"
                            name="password"
                            ref={passwordInput}
                            value={data.password}
                            onChange={(e) =>
                                setData('password', e.target.value)
                            }
                            className="mt-1 block w-3/4 border-border bg-input-bg text-text-primary placeholder:text-text-muted focus:border-emerald-500 focus:ring-emerald-500"
                            isFocused
                            placeholder={t('profile.passwordPlaceholder')}
                        />

                        <InputError
                            message={errors.password}
                            className="mt-2"
                        />
                    </div>

                    <div className="mt-6 flex justify-end">
                        <SecondaryButton onClick={closeModal} className="bg-input-bg text-text-primary border-border hover:bg-[#334155]">
                            {t('common.cancel')}
                        </SecondaryButton>

                        <DangerButton className="ms-3 bg-red-600 hover:bg-red-500 focus:ring-red-500 active:bg-red-700" disabled={processing}>
                            {t('common.delete')}
                        </DangerButton>
                    </div>
                </form>
            </Modal>
        </section>
    );
}
