import { Head, useForm } from '@inertiajs/react';
import { EnvelopeIcon, LockClosedIcon, KeyIcon } from '@heroicons/react/24/outline';

export default function ResetPassword({ token, email }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                        <Head title="Réinitialiser le mot de passe - ReservaSalle" />
            <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                        <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-blue-600 mb-4">ReservaSalle</h1>
                    <h2 className="text-2xl font-semibold mb-2">Nouveau mot de passe</h2>
                    <p className="text-sm text-gray-600">
                        Choisissez un nouveau mot de passe sécurisé
                    </p>
                </div>

                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="text-sm text-gray-700 flex items-center gap-2">
                            <EnvelopeIcon className="w-4 h-4" />
                            Email
                        </label>
                        <div className="relative mt-1">
                            <input
                                id="email"
                                type="email"
                                name="email"
                                value={data.email}
                                className="block w-full border rounded p-2 pl-10 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                autoComplete="username"
                                onChange={(e) => setData('email', e.target.value)}
                                readOnly
                            />
                            <EnvelopeIcon className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                        </div>
                        {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
                    </div>

                    <div>
                        <label htmlFor="password" className="text-sm text-gray-700 flex items-center gap-2">
                            <LockClosedIcon className="w-4 h-4" />
                            Nouveau mot de passe
                        </label>
                        <div className="relative mt-1">
                            <input
                                id="password"
                                type="password"
                                name="password"
                                value={data.password}
                                className="block w-full border rounded p-2 pl-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                autoComplete="new-password"
                                onChange={(e) => setData('password', e.target.value)}
                                autoFocus
                                required
                            />
                            <LockClosedIcon className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                        </div>
                        {errors.password && <p className="text-sm text-red-600 mt-1">{errors.password}</p>}
                    </div>

                    <div>
                        <label htmlFor="password_confirmation" className="text-sm text-gray-700 flex items-center gap-2">
                            <LockClosedIcon className="w-4 h-4" />
                            Confirmer le mot de passe
                        </label>
                        <div className="relative mt-1">
                            <input
                                id="password_confirmation"
                                type="password"
                                name="password_confirmation"
                                value={data.password_confirmation}
                                className="block w-full border rounded p-2 pl-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                autoComplete="new-password"
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                required
                            />
                            <LockClosedIcon className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                        </div>
                        {errors.password_confirmation && (
                            <p className="text-sm text-red-600 mt-1">{errors.password_confirmation}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white rounded py-2 hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                        disabled={processing}
                    >
                        <KeyIcon className="w-5 h-5" />
                        Réinitialiser le mot de passe
                    </button>
                </form>
            </div>
        </div>
    );
}
