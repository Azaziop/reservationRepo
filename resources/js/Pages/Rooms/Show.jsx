import { useState, useEffect } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import SidebarLayout from '@/Layouts/Sidebar';

function Button({ variant = 'default', className = '', ...props }) {
  const base = 'inline-flex items-center justify-center rounded px-3 py-2 text-sm transition-colors';
  const variants = {
    default: 'bg-gray-900 text-white hover:bg-black',
    outline: 'border border-gray-300 text-gray-600 hover:text-gray-900',
    danger: 'text-red-600 hover:text-red-700',
    ghost: 'text-gray-700 hover:text-gray-900',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700',
  };
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
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

// Modal de gestion des réservations pour les admins
function ReservationManagementModal({ room, isOpen, onClose }) {
  const { user } = usePage().props.auth;
  const isAdmin = user?.role === 'admin';
  const [reservations, setReservations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: '',
    date: '',
    start_time: '',
    end_time: '',
    purpose: '',
    notes: ''
  });

  useEffect(() => {
    if (isOpen && isAdmin) {
      fetchReservations();
      fetchEmployees();
    }
  }, [isOpen, isAdmin]);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/rooms/${room.id}/reservations`);
      if (response.ok) {
        const data = await response.json();
        setReservations(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des réservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des employés:', error);
    }
  };

  const handleCreateReservation = (e) => {
    e.preventDefault();
    router.post('/reservations', {
      ...formData,
      room_id: room.id
    }, {
      onSuccess: () => {
        setShowCreateForm(false);
        setFormData({
          employee_id: '',
          date: '',
          start_time: '',
          end_time: '',
          purpose: '',
          notes: ''
        });
        fetchReservations();
      },
      onError: (errors) => {
        console.error('Erreurs de validation:', errors);
      }
    });
  };

  const handleCancelReservation = (reservationId) => {
    if (confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) {
      router.post(`/reservations/${reservationId}/cancel`, {}, {
        onSuccess: () => {
          fetchReservations();
        }
      });
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'confirmed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
      'completed': 'bg-blue-100 text-blue-800',
    };

    const statusLabels = {
      'pending': 'En attente',
      'confirmed': 'Confirmée',
      'cancelled': 'Annulée',
      'completed': 'Terminée',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[status] || 'bg-gray-100 text-gray-800'}`}>
        {statusLabels[status] || status}
      </span>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* En-tête */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Gestion des réservations - {room.room_number}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Contenu */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="p-6">
            {/* Bouton créer nouvelle réservation */}
            <div className="mb-6">
              <Button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nouvelle réservation
              </Button>
            </div>

            {/* Formulaire de création */}
            {showCreateForm && (
              <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Créer une nouvelle réservation</h3>
                <form onSubmit={handleCreateReservation} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Employé</label>
                      <select
                        value={formData.employee_id}
                        onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                        required
                      >
                        <option value="">Sélectionner un employé</option>
                        {employees.map(employee => (
                          <option key={employee.id} value={employee.id}>
                            {employee.name} {employee.first_name} - {employee.employee_number}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                      <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Heure de début</label>
                      <input
                        type="time"
                        value={formData.start_time}
                        onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Heure de fin</label>
                      <input
                        type="time"
                        value={formData.end_time}
                        onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Objet</label>
                    <input
                      type="text"
                      value={formData.purpose}
                      onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      placeholder="Réunion, formation, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      rows={3}
                      placeholder="Informations supplémentaires..."
                    />
                  </div>

                  <div className="flex items-center justify-end space-x-3">
                    <Button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      variant="outline"
                    >
                      Annuler
                    </Button>
                    <Button
                      type="submit"
                      className="bg-green-600 text-white hover:bg-green-700"
                    >
                      Créer la réservation
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Liste des réservations */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Réservations existantes</h3>

              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">Chargement...</p>
                </div>
              ) : reservations.length > 0 ? (
                <div className="space-y-4">
                  {reservations.map(reservation => (
                    <div key={reservation.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="font-medium text-gray-900">
                              {reservation.employee?.name} {reservation.employee?.first_name}
                            </div>
                            {getStatusBadge(reservation.status)}
                          </div>

                          <div className="text-sm text-gray-600 space-y-1">
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {formatDateFR(reservation.date)}
                            </div>
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {formatTimeFR(reservation.start_time)} - {formatTimeFR(reservation.end_time)}
                            </div>
                            {reservation.purpose && (
                              <div className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                {reservation.purpose}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Link
                            href={`/reservations/${reservation.id}`}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Voir
                          </Link>

                          {reservation.status !== 'cancelled' && (
                            <Button
                              onClick={() => handleCancelReservation(reservation.id)}
                              variant="danger"
                              className="text-xs px-2 py-1"
                            >
                              Annuler
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p>Aucune réservation pour cette salle</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RoomShow({ room }) {
  const { user } = usePage().props.auth;
  const isAdmin = user?.role === 'admin';
  const [showReservationModal, setShowReservationModal] = useState(false);

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

  const getTypeColor = (type) => {
    switch(type) {
      case 'conference': return 'from-purple-500 to-purple-600';
      case 'office': return 'from-green-500 to-green-600';
      case 'training': return 'from-orange-500 to-orange-600';
      default: return 'from-blue-500 to-blue-600';
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      'conference': 'Salle de conférence',
      'office': 'Bureau',
      'training': 'Salle de formation'
    };
    return labels[type] || type;
  };

  const handleReserve = () => {
    router.visit(`/reservations/create?room_id=${room.id}`);
  };

  const handleEdit = () => {
    router.visit(`/rooms/${room.id}/edit`);
  };

  const handleDelete = () => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la salle ${room.room_number} ?`)) {
      router.delete(`/rooms/${room.id}`, {
        onSuccess: () => router.visit('/rooms')
      });
    }
  };

  return (
    <SidebarLayout>
      <Head title={`Salle ${room.room_number}`} />

      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3">
              <div className="text-gray-700 w-8 h-8">{getRoomTypeIcon(room.type)}</div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{room.room_number}</h1>
                <p className="text-gray-600">{getTypeLabel(room.type)}</p>
              </div>
            </div>
          </div>

          <Link href="/rooms">
            <Button variant="outline" className="flex items-center space-x-2">
              <span>←</span>
              <span>Retour à la liste</span>
            </Button>
          </Link>
        </div>

        {/* Informations de la salle */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image/Icône */}
          <div className="relative">
            <div className="h-64 lg:h-80 overflow-hidden rounded-lg">
              <div className={`w-full h-full bg-gradient-to-r ${getTypeColor(room.type)} flex items-center justify-center`}>
                <div className="rounded-full bg-white/10 p-8">
                  <div className="text-white opacity-90 w-20 h-20">{getRoomTypeIcon(room.type)}</div>
                </div>
              </div>
            </div>

            {/* Badge type */}
            <div className="absolute top-4 right-4">
              <span className="bg-white/90 text-gray-800 px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm">
                {getTypeLabel(room.type)}
              </span>
            </div>
          </div>

          {/* Détails */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations</h2>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <div>
                    <p className="text-sm text-gray-600">Capacité maximale</p>
                    <p className="font-medium">{room.capacity} personnes</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <div>
                    <p className="text-sm text-gray-600">Type de salle</p>
                    <p className="font-medium">{getTypeLabel(room.type)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <div>
                    <p className="text-sm text-gray-600">Numéro</p>
                    <p className="font-medium">{room.room_number}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {room.description && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Description</h2>
                <p className="text-gray-600 leading-relaxed">{room.description}</p>
              </div>
            )}

            {/* Actions */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>

              <div className="flex flex-wrap gap-3">
                {isAdmin && (
                  <Button
                    onClick={() => setShowReservationModal(true)}
                    className="bg-green-600 text-white hover:bg-green-700 flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>Gérer réservations</span>
                  </Button>
                )}

                <Button onClick={handleReserve} className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  <span>Réserver cette salle</span>
                </Button>

                <Button onClick={handleEdit} variant="outline" className="flex items-center space-x-2">
                  <span>✏️</span>
                  <span>Modifier</span>
                </Button>

                <Button onClick={handleDelete} variant="danger" className="flex items-center space-x-2">
                  <span>🗑️</span>
                  <span>Supprimer</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Réservations à venir */}
        {room.reservations && room.reservations.length > 0 && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Réservations à venir</h2>
            </div>

            <div className="divide-y divide-gray-200">
              {room.reservations.map((reservation) => (
                <div key={reservation.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {reservation.employee?.first_name} {reservation.employee?.name}
                      </p>
                      {reservation.purpose && (
                        <p className="text-sm text-gray-600">{reservation.purpose}</p>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {formatDateFR(reservation.date)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatTimeFR(reservation.start_time)} - {formatTimeFR(reservation.end_time)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal de gestion des réservations */}
      <ReservationManagementModal
        room={room}
        isOpen={showReservationModal}
        onClose={() => setShowReservationModal(false)}
      />
    </SidebarLayout>
  );
}
