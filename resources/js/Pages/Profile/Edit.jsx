import AppLayout from '@/Layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({ mustVerifyEmail, status }) {
    const user = usePage().props.auth?.user;

    return (
        <AppLayout>
            <Head title="Profile" />

            <div className="py-8 space-y-6 max-w-4xl mx-auto px-4 sm:px-6">
                {/* En-tête avec photo */}
                <div className="glass rounded-xl p-6 flex items-center gap-5">
                    <img src="/images/Profile.png" alt="Profile" className="h-20 w-20 rounded-full border-2 border-emerald-500/30 object-cover shadow-lg" />
                    <div>
                        <h1 className="text-2xl font-bold text-white">{user?.name || 'Admin User'}</h1>
                        <p className="text-sm text-gray-400">{user?.email || ''}</p>
                    </div>
                </div>

                <div className="glass rounded-xl p-6">
                    <UpdateProfileInformationForm
                        mustVerifyEmail={mustVerifyEmail}
                        status={status}
                        className="max-w-xl"
                    />
                </div>

                <div className="glass rounded-xl p-6">
                    <UpdatePasswordForm className="max-w-xl" />
                </div>

                <div className="glass rounded-xl p-6">
                    <DeleteUserForm className="max-w-xl" />
                </div>
            </div>
        </AppLayout>
    );
}
