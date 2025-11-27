import { Head, Link, useForm } from '@inertiajs/react';
import SidebarLayout from '@/Layouts/Sidebar';

function Button({ variant = 'default', className = '', disabled = false, ...props }) {
  const base = 'inline-flex items-center justify-center rounded px-4 py-2 text-sm font-medium transition-colors';
  const variants = {
    default: 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:bg-gray-100',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 disabled:bg-gray-300',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${className} ${disabled ? 'cursor-not-allowed' : ''}`}
      disabled={disabled}
      {...props}
    />
  );
}

function Card({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

function FormField({ label, error, children, required = false }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

export default function RoomCreate({ roomTypes }) {
  const { data, setData, post, processing, errors, reset } = useForm({
    room_number: '',
    capacity: '',
    type: '',
    description: '',
  });

  const getRoomTypeIcon = (type) => {
    switch (type) {
      case 'conference':
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm3 1h6v4H7V5zm8 8v2a1 1 0 01-1 1H6a1 1 0 01-1-1v-2h10zm-6-4a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
          </svg>
        );
      case 'office':
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 2a1 1 0 00-1 1v14a1 1 0 001 1h12a1 1 0 001-1V3a1 1 0 00-1-1H4zm3 3a1 1 0 000 2h6a1 1 0 100-2H7zm0 4a1 1 0 100 2h6a1 1 0 100-2H7zm0 4a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
          </svg>
        );
      case 'training':
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.75 2.524z"/>
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    post('/rooms', {
      onSuccess: () => {
        // La redirection est gérée côté serveur
      }
    });
  };

  const handleReset = () => {
    reset();
  };

  return (
    <SidebarLayout>
      <Head title="Créer une Salle" />

      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Créer une Nouvelle Salle</h1>
            <p className="text-gray-600">
              Ajoutez une nouvelle salle de réunion, bureau ou espace de formation
            </p>
          </div>

          <Link href="/rooms">
            <Button variant="outline" className="flex items-center space-x-2">
              <span>←</span>
              <span>Retour à la liste</span>
            </Button>
          </Link>
        </div>

        {/* Formulaire */}
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Numéro de salle */}
              <FormField
                label="Numéro de salle"
                error={errors.room_number}
                required
              >
                <input
                  type="text"
                  value={data.room_number}
                  onChange={e => setData('room_number', e.target.value)}
                  placeholder="Ex: CONF-001, BUR-101..."
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Utilisez un identifiant unique (lettres, chiffres, tirets autorisés)
                </p>
              </FormField>

              {/* Capacité */}
              <FormField
                label="Capacité maximale"
                error={errors.capacity}
                required
              >
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={data.capacity}
                  onChange={e => setData('capacity', e.target.value)}
                  placeholder="Nombre de personnes"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Nombre maximum de personnes pouvant occuper la salle
                </p>
              </FormField>
            </div>

            {/* Type de salle */}
            <FormField
              label="Type de salle"
              error={errors.type}
              required
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {Object.entries(roomTypes).map(([key, label]) => {

                  return (
                    <label
                      key={key}
                      className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        data.type === key
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="type"
                        value={key}
                        checked={data.type === key}
                        onChange={e => setData('type', e.target.value)}
                        className="sr-only"
                      />
                      <div className="flex items-center space-x-3">
                        <div className="text-blue-600">{getRoomTypeIcon(key)}</div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{label}</div>
                          <div className="text-xs text-gray-500">
                            {key === 'conference' && 'Pour réunions et présentations'}
                            {key === 'office' && 'Espaces de travail privés'}
                            {key === 'training' && 'Salles de formation équipées'}
                          </div>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </FormField>

            {/* Description */}
            <FormField
              label="Description"
              error={errors.description}
            >
              <textarea
                value={data.description}
                onChange={e => setData('description', e.target.value)}
                placeholder="Description de la salle, équipements disponibles, particularités..."
                rows="4"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Décrivez les équipements et caractéristiques de la salle (optionnel)
              </p>
            </FormField>

            {/* Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={processing}
              >
                Réinitialiser
              </Button>

              <div className="flex items-center space-x-3">
                <Link href="/rooms">
                  <Button variant="secondary" disabled={processing}>
                    Annuler
                  </Button>
                </Link>

                <Button
                  type="submit"
                  disabled={processing || !data.room_number || !data.capacity || !data.type}
                  className="min-w-[120px]"
                >
                  {processing ? 'Création...' : 'Créer la salle'}
                </Button>
              </div>
            </div>
          </form>
        </Card>

        {/* Aide */}
        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <span className="text-2xl">💡</span>
            </div>
            <div>
              <h3 className="text-lg font-medium text-blue-900 mb-2">Conseils pour créer une salle</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Utilisez une convention de nommage claire (ex: CONF-001, BUR-101, FORM-A)</li>
                <li>• Indiquez la capacité réelle en considérant l'espace et le mobilier</li>
                <li>• Choisissez le type approprié pour faciliter la recherche</li>
                <li>• Décrivez les équipements disponibles (projecteur, tableau, wifi...)</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </SidebarLayout>
  );
}
