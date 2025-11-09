import { useEffect, useMemo, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import SidebarLayout from '@/Layouts/Sidebar';

function useAuth() {
  const page = usePage();
  return { user: page?.props?.auth?.user ?? null };
}

function Button({ variant = 'default', className = '', ...props }) {
  const base = 'inline-flex items-center justify-center rounded px-3 py-2 text-sm transition-colors';
  const variants = {
    default: 'bg-blue-600 text-white hover:bg-blue-700',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'text-gray-700 hover:bg-gray-100',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700',
  };
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

function Card({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

function Badge({ children, variant = 'default' }) {
  const variants = {
    default: 'bg-blue-100 text-blue-800',
    confirmed: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    cancelled: 'bg-red-100 text-red-800',
    completed: 'bg-gray-100 text-gray-800',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
}

function formatDateFR(value) {
  const d = new Date(value);
  return isNaN(d.getTime())
    ? value
    : d.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
}

function formatTimeFR(value) {
  return value ? value.slice(0, 5) : '';
}

function StatCard({ title, value, icon, color = 'blue' }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
  };

  return (
    <Card className="p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${colors[color]} border-2`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {icon}
          </svg>
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </Card>
  );
}

function ReservationCard({ reservation, onCancel }) {
  const getStatusVariant = (status) => {
    switch(status) {
      case 'confirmed': return 'confirmed';
      case 'pending': return 'pending';
      case 'cancelled': return 'cancelled';
      case 'completed': return 'completed';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      'confirmed': 'Confirmée',
      'pending': 'En attente',
      'cancelled': 'Annulée',
      'completed': 'Terminée'
    };
    return labels[status] || status;
  };

  const getRoomIcon = (type) => {
    switch (type) {
      case 'conference':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm3 1h6v4H7V5zm8 8v2a1 1 0 01-1 1H6a1 1 0 01-1-1v-2h10zm-6-4a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
          </svg>
        );
      case 'office':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 2a1 1 0 00-1 1v14a1 1 0 001 1h12a1 1 0 001-1V3a1 1 0 00-1-1H4zm3 3a1 1 0 000 2h6a1 1 0 100-2H7zm0 4a1 1 0 100 2h6a1 1 0 100-2H7zm0 4a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
          </svg>
        );
      case 'training':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.75 2.524z"/>
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  return (
    <Card className="p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <div className="text-gray-600">{getRoomIcon(reservation.room?.type)}</div>
            <h3 className="text-lg font-semibold text-gray-900">
              {reservation.room?.room_number}
            </h3>
            <Badge variant={getStatusVariant(reservation.status)}>
              {getStatusLabel(reservation.status)}
            </Badge>
          </div>

          <div className="space-y-1 text-sm text-gray-600">
            <p><span className="font-medium">Date:</span> {formatDateFR(reservation.date)}</p>
            <p><span className="font-medium">Heure:</span> {(() => {
              // Correction automatique des heures inversées à l'affichage
              if (reservation.start_time && reservation.end_time) {
                const start = new Date(`1970-01-01T${reservation.start_time}`);
                const end = new Date(`1970-01-01T${reservation.end_time}`);

                if (start > end) {
                  // Heures inversées détectées - afficher corrigées
                  return `${formatTimeFR(reservation.end_time)} - ${formatTimeFR(reservation.start_time)}`;
                }
              }
              // Affichage normal
              return `${formatTimeFR(reservation.start_time)} - ${formatTimeFR(reservation.end_time)}`;
            })()}</p>
            {reservation.purpose && (
              <p><span className="font-medium">Objet:</span> {reservation.purpose}</p>
            )}
            <p><span className="font-medium">Durée:</span> {Math.abs(reservation.duration_minutes)} min</p>
          </div>
        </div>

        <div className="flex flex-col space-y-2 ml-4">
          <Link href={`/reservations/${reservation.id}`}>
            <Button variant="ghost" className="text-xs px-2 py-1">
              Voir
            </Button>
          </Link>
          {reservation.status === 'confirmed' && (
            <Button
              variant="danger"
              className="text-xs px-2 py-1"
              onClick={() => onCancel(reservation.id)}
            >
              Annuler
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

export default function Dashboard({ myReservations = [], stats = {} }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleCancelReservation = (reservationId) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) {
      return;
    }

    setLoading(true);
    router.post(`/reservations/${reservationId}/cancel`, {}, {
      onFinish: () => setLoading(false),
      onSuccess: () => {
        // Recharger la page pour mettre à jour les données
        router.reload({ only: ['myReservations', 'stats'] });
      }
    });
  };

  return (
    <SidebarLayout>
      <Head title="Dashboard - Réservations" />

      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-6 border-b border-gray-200">
              <h1 className="text-3xl font-bold text-gray-900">
                Dashboard
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Bonjour {user?.first_name || user?.name} ! {user?.role === 'admin'
                  ? 'Voici un aperçu du système de réservations.'
                  : 'Voici un aperçu de vos réservations.'}
              </p>
            </div>
            <div className="p-6 space-y-8">

              {/* Statistiques - Visible uniquement pour les admins */}
              {user?.role === 'admin' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Vue d'ensemble</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <StatCard
                      title="Réservations totales"
                      value={stats.total_reservations || 0}
                      icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />}
                      color="blue"
                    />
                    <StatCard
                      title="Salles disponibles"
                      value={stats.rooms_count || 0}
                      icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />}
                      color="green"
                    />
                    <StatCard
                      title="Réservations aujourd'hui"
                      value={stats.today_reservations || 0}
                      icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />}
                      color="purple"
                    />
                  </div>
                </div>
              )}

              {/* Actions rapides */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Actions rapides</h2>
                <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${user?.role === 'admin' ? 'lg:grid-cols-3' : 'lg:grid-cols-4'}`}>
                  {/* Nouvelle réservation - Uniquement pour les utilisateurs */}
                  {user?.role !== 'admin' && (
                    <Link href="/reservations/create" className="group">
                      <div className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all">
                        <div className="flex items-center">
                          <div className="p-3 rounded-full bg-blue-100 text-blue-600 group-hover:bg-blue-200 transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </div>
                          <div className="ml-4">
                            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                              Nouvelle réservation
                            </h3>
                            <p className="text-sm text-gray-500">Réserver une salle</p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  )}

                  <Link href="/rooms" className="group">
                    <div className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md hover:border-green-300 transition-all">
                      <div className="flex items-center">
                        <div className="p-3 rounded-full bg-green-100 text-green-600 group-hover:bg-green-200 transition-colors">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <h3 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                            Voir les salles
                          </h3>
                          <p className="text-sm text-gray-500">Explorer les salles</p>
                        </div>
                      </div>
                    </div>
                  </Link>

                  <Link href="/calendar" className="group">
                    <div className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md hover:border-purple-300 transition-all">
                      <div className="flex items-center">
                        <div className="p-3 rounded-full bg-purple-100 text-purple-600 group-hover:bg-purple-200 transition-colors">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                            Calendrier
                          </h3>
                          <p className="text-sm text-gray-500">Vue planning</p>
                        </div>
                      </div>
                    </div>
                  </Link>

                  <Link href="/reservations" className="group">
                    <div className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md hover:border-gray-400 transition-all">
                      <div className="flex items-center">
                        <div className="p-3 rounded-full bg-gray-100 text-gray-600 group-hover:bg-gray-200 transition-colors">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <h3 className="font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">
                            {user?.role === 'admin' ? 'Gestion des réservations' : 'Mes réservations'}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {user?.role === 'admin' ? 'Administration et suivi complet' : 'Gérer mes réservations'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              </div>

              {/* Mes prochaines réservations - Visible uniquement pour les utilisateurs */}
              {user?.role !== 'admin' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <h2 className="text-xl font-semibold text-gray-900">
                        Mes prochaines réservations
                      </h2>
                      <span className="ml-3 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {myReservations.length}
                      </span>
                    </div>
                    <Link href="/reservations">
                      <Button variant="ghost" className="text-blue-600 hover:text-blue-700">
                        Voir toutes
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Button>
                    </Link>
                  </div>

                  {myReservations.length > 0 ? (
                    <div className="space-y-4">
                      {myReservations.map((reservation) => (
                        <ReservationCard
                          key={reservation.id}
                          reservation={reservation}
                          onCancel={handleCancelReservation}
                        />
                      ))}
                    </div>
                  ) : (
                    <Card className="p-8 text-center">
                      <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Aucune réservation à venir
                      </h3>
                      <p className="text-gray-500 mb-4">
                        Vous n'avez pas encore de réservations programmées.
                      </p>
                      <Link href="/reservations/create">
                        <Button>Créer ma première réservation</Button>
                      </Link>
                    </Card>
                  )}
                </div>
              )}

              {/* Conseils */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-blue-900 mb-3">Conseils d'utilisation</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-start space-x-2">
                        <svg className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm text-blue-700">Réservez à l'avance pour garantir la disponibilité</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <svg className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm text-blue-700">Vérifiez la capacité selon le nombre de participants</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <svg className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm text-blue-700">Annulez les réservations inutilisées</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <svg className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm text-blue-700">Consultez le calendrier pour les disponibilités</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
