// resources/js/Pages/Auth/Register.jsx
import { Head, Link, useForm } from '@inertiajs/react';

export default function Register() {
  const { data, setData, post, processing, errors, reset } = useForm({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
  });

  const submit = (e) => {
    e.preventDefault();
    post(route('register'), {
      onFinish: () => reset('password', 'password_confirmation'),
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Head title="Inscription" />
      <div className="w-full max-w-md bg-white rounded shadow p-6">
        <h1 className="text-2xl font-semibold mb-2 text-center">Créer un compte</h1>
        <p className="text-sm text-gray-600 mb-6 text-center">Renseignez vos informations pour vous inscrire</p>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="name" className="text-sm text-gray-700">Nom</label>
            <input
              id="name"
              name="name"
              value={data.name}
              className="mt-1 block w-full border rounded p-2"
              autoComplete="name"
              onChange={(e) => setData('name', e.target.value)}
              required
            />
            {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
          </div>

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
              autoComplete="new-password"
              onChange={(e) => setData('password', e.target.value)}
              required
            />
            {errors.password && <p className="text-sm text-red-600 mt-1">{errors.password}</p>}
          </div>

          <div>
            <label htmlFor="password_confirmation" className="text-sm text-gray-700">Confirmer le mot de passe</label>
            <input
              id="password_confirmation"
              type="password"
              name="password_confirmation"
              value={data.password_confirmation}
              className="mt-1 block w-full border rounded p-2"
              autoComplete="new-password"
              onChange={(e) => setData('password_confirmation', e.target.value)}
              required
            />
            {errors.password_confirmation && (
              <p className="text-sm text-red-600 mt-1">{errors.password_confirmation}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white rounded py-2 hover:bg-blue-700 disabled:opacity-50"
            disabled={processing}
          >
            S'inscrire
          </button>

          <div className="text-sm text-center text-gray-600">
            Déjà inscrit ?{' '}
            <Link href={route('login')} className="text-blue-600 hover:underline">
              Se connecter
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
