// resources/js/Pages/Auth/Login.jsx
import { Head, Link, useForm } from '@inertiajs/react';

export default function Login({ status, canResetPassword }) {
  const { data, setData, post, processing, errors, reset } = useForm({
    email: '',
    password: '',
    remember: false,
  });

  const submit = (e) => {
    e.preventDefault();
    post(route('login'), {
      onFinish: () => reset('password'),
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Head title="Connexion" />
      <div className="w-full max-w-md bg-white rounded shadow p-6">
        <h1 className="text-2xl font-semibold mb-2 text-center">Connexion</h1>
        <p className="text-sm text-gray-600 mb-6 text-center">Connectez-vous à votre compte</p>

        {status && (
          <div className="mb-4 text-sm font-medium text-green-600">
            {status}
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="email" className="text-sm text-gray-700">Email</label>
            <input
              id="email"
              type="email"
              name="email"
              value={data.email}
              className="mt-1 block w-full border rounded p-2"
              autoComplete="username"
              onChange={(e) => setData('email', e.target.value)}
              required
            />
            {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="password" className="text-sm text-gray-700">Mot de passe</label>
            <input
              id="password"
              type="password"
              name="password"
              value={data.password}
              className="mt-1 block w-full border rounded p-2"
              autoComplete="current-password"
              onChange={(e) => setData('password', e.target.value)}
              required
            />
            {errors.password && <p className="text-sm text-red-600 mt-1">{errors.password}</p>}
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={data.remember}
                onChange={(e) => setData('remember', e.target.checked)}
                className="h-4 w-4"
              />
              Se souvenir de moi
            </label>

            {canResetPassword && (
              <Link
                href={route('password.request')}
                className="text-sm text-blue-600 hover:underline"
              >
                Mot de passe oublié ?
              </Link>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white rounded py-2 hover:bg-blue-700 disabled:opacity-50"
            disabled={processing}
          >
            Se connecter
          </button>

          <div className="text-sm text-center text-gray-600">
            Pas encore de compte ?{' '}
            <Link href={route('register')} className="text-blue-600 hover:underline">
              S'inscrire
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
