import { useState, useEffect } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import SidebarLayout from '@/Layouts/Sidebar';

function useAuth() {
  const page = usePage();
  return { user: page?.props?.auth?.user ?? null };
}

// Modal pour voir les détails d'une réservation (admin)
function ViewReservationModal({ reservation, isOpen, onClose }) {
  if (!isOpen || !reservation) return null;

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
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${badges[status] || 'bg-gray-100 text-gray-800'}`}>
        {statusLabels[status] || status}
      </span>
    );
  };

  const getRoomTypeIcon = (type) => {
    switch(type) {
      case 'conference':
        return (
          <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      case 'office':
        return (
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      case 'training':
        return (
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    if (timeString.includes('T') || timeString.length > 8) {
      const date = new Date(timeString);
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }
    return timeString.substring(0, 5);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* En-tête */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Détails de la réservation #{reservation.id}
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
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-6">
            {/* Statut */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Statut</h3>
              {getStatusBadge(reservation.status)}
            </div>

            {/* Informations employé */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Employé</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium mr-3">
                    {reservation.employee?.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {reservation.employee?.name} {reservation.employee?.first_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      N° {reservation.employee?.employee_number} • {reservation.employee?.department}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Informations salle */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Salle</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <div className="mr-3">{getRoomTypeIcon(reservation.room?.type)}</div>
                  <div>
                    <div className="font-medium text-gray-900">{reservation.room?.room_number}</div>
                    <div className="text-sm text-gray-500">Capacité: {reservation.room?.capacity} personnes</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Date et horaires */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Date et horaires</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-gray-900">
                    {new Date(reservation.date).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-gray-900">
                    {(() => {
                      // Correction automatique des heures inversées à l'affichage
                      if (reservation.start_time && reservation.end_time) {
                        const start = new Date(`1970-01-01T${reservation.start_time}`);
                        const end = new Date(`1970-01-01T${reservation.end_time}`);

                        if (start > end) {
                          // Heures inversées détectées - afficher corrigées
                          return `${formatTime(reservation.end_time)} - ${formatTime(reservation.start_time)}`;
                        }
                      }
                      // Affichage normal
                      return `${formatTime(reservation.start_time)} - ${formatTime(reservation.end_time)}`;
                    })()}
                    <span className="ml-2 text-gray-500">({Math.abs(reservation.duration_minutes)} min)</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Objet et notes */}
            {(reservation.purpose || reservation.notes) && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Informations supplémentaires</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  {reservation.purpose && (
                    <div>
                      <div className="text-sm font-medium text-gray-500">Objet</div>
                      <div className="text-gray-900">{reservation.purpose}</div>
                    </div>
                  )}
                  {reservation.notes && (
                    <div>
                      <div className="text-sm font-medium text-gray-500">Notes</div>
                      <div className="text-gray-900">{reservation.notes}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal pour éditer une réservation (admin)
function EditReservationModal({ reservation, isOpen, onClose }) {
  // ✅ Fonction pour normaliser les heures en format HH:MM (sans secondes)
  const normalizeTime = (timeString) => {
    if (!timeString) return '';
    // Si format est HH:MM:SS, prendre seulement HH:MM
    // Si format est HH:MM, retourner tel quel
    if (typeof timeString === 'string') {
      return timeString.substring(0, 5); // Prendre les 5 premiers caractères (HH:MM)
    }
    return '';
  };

  // Fonction pour formater la date pour l'input HTML
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  const [formData, setFormData] = useState({
    employee_id: '',
    room_id: '',
    date: '',
    start_time: '',
    end_time: '',
    purpose: '',
    notes: '',
    status: 'pending'
  });

  const [errors, setErrors] = useState({});
  const [processing, setProcessing] = useState(false);

  // Initialize form data when reservation changes
  useEffect(() => {
    if (reservation) {
      setFormData({
        employee_id: reservation.employee?.id || reservation.employee_id || '',
        room_id: reservation.room?.id || reservation.room_id || '',
        date: formatDateForInput(reservation.date),
        start_time: normalizeTime(reservation.start_time),  // ✅ NORMALISER
        end_time: normalizeTime(reservation.end_time),      // ✅ NORMALISER
        purpose: reservation.purpose || '',
        notes: reservation.notes || '',
        status: reservation.status || 'pending'
      });
    }
  }, [reservation]);

  if (!isOpen || !reservation) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    // ✅ NE PAS CORRIGER - Le backend gère la correction!
    // Le frontend envoie les heures EXACTEMENT comme l'utilisateur les a modifiées

    console.log('🚀 Soumission du formulaire d\'édition (SANS correction frontend):', formData);

    setProcessing(true);
    setErrors({});

    router.put(`/reservations/${reservation.id}`, formData, {
      onSuccess: () => {
        console.log('✅ Réservation mise à jour avec succès');
        onClose();
        router.reload();
      },
      onError: (errors) => {
        console.error('❌ Erreurs lors de la mise à jour:', errors);
        setErrors(errors);
      },
      onFinish: () => {
        setProcessing(false);
      }
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Modifier la Réservation #{reservation.id}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Champs cachés pour conserver employee_id et room_id sans permettre modification */}
            <input type="hidden" name="employee_id" value={formData.employee_id} />
            <input type="hidden" name="room_id" value={formData.room_id} />

            {/* Affichage en lecture seule des informations employé et salle */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Informations de la réservation</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Employé:</span>
                  <span className="ml-2 font-medium">{reservation?.employee?.name} {reservation?.employee?.first_name}</span>
                </div>
                <div>
                  <span className="text-gray-500">Salle:</span>
                  <span className="ml-2 font-medium">{reservation?.room?.room_number}</span>
                  <span className="ml-1 text-gray-400">({reservation?.room?.capacity} pers.)</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date *
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className={`w-full border border-gray-300 rounded-md px-3 py-2 text-sm ${
                  errors.date ? 'border-red-500' : ''
                }`}
              />
              {errors.date && (
                <p className="mt-1 text-sm text-red-600">{errors.date}</p>
              )}
            </div>

            {/* Champ caché pour conserver le statut sans permettre modification */}
            <input type="hidden" name="status" value={formData.status} />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  Heure de DÉBUT
                </label>
                <input
                  type="time"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border-2 border-green-200 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
                {formData.start_time && (
                  <p className="mt-1 text-sm text-green-600">✓ Début: {formData.start_time}</p>
                )}
                {errors.start_time && <p className="mt-1 text-sm text-red-600">{errors.start_time}</p>}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  Heure de FIN
                </label>
                <input
                  type="time"
                  name="end_time"
                  value={formData.end_time}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border-2 border-red-200 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                />
                {formData.end_time && (
                  <p className="mt-1 text-sm text-red-600">✓ Fin: {formData.end_time}</p>
                )}
                {errors.end_time && <p className="mt-1 text-sm text-red-600">{errors.end_time}</p>}
              </div>
            </div>

            {/* Validation visuelle en temps réel des heures */}
            {formData.start_time && formData.end_time && (
              <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                <div className="flex items-center gap-2 text-sm">
                  {(() => {
                    const start = new Date(`1970-01-01T${formData.start_time}`);
                    const end = new Date(`1970-01-01T${formData.end_time}`);

                    if (start >= end) {
                      return (
                        <>
                          <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <span className="text-red-800 font-medium">
                            ❌ ERREUR: Heure de fin ({formData.end_time}) avant heure de début ({formData.start_time})
                          </span>
                        </>
                      );
                    } else {
                      const diff = (end - start) / (1000 * 60);
                      const hours = Math.floor(diff / 60);
                      const minutes = diff % 60;
                      return (
                        <>
                          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-green-800 font-medium">
                            ✓ Créneau: {formData.start_time} → {formData.end_time} ({hours}h{minutes.toString().padStart(2, '0')})
                          </span>
                        </>
                      );
                    }
                  })()}
                </div>
              </div>
            )}

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Objet
              </label>
              <input
                type="text"
                name="purpose"
                value={formData.purpose}
                onChange={handleChange}
                placeholder="Objet de la réservation"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Notes additionnelles"
                rows="3"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={processing}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {processing ? 'Modification...' : 'Modifier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Button({ variant = 'default', className = '', ...props }) {
  const base = 'inline-flex items-center justify-center rounded px-3 py-2 text-sm font-medium transition-colors';
  const variants = {
    default: 'bg-blue-600 text-white hover:bg-blue-700',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'text-gray-700 hover:bg-gray-100',
  };
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

function Select({ children, className = '', ...props }) {
  return (
    <select
      className={`border border-gray-300 rounded px-3 py-2 text-sm ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

function Input({ className = '', ...props }) {
  return (
    <input
      className={`border border-gray-300 rounded px-3 py-2 text-sm ${className}`}
      {...props}
    />
  );
}

function ReservationRow({ reservation, isAdmin, onViewReservation, onEditReservation }) {
  const { user } = useAuth();
  // Vérifier si l'utilisateur est propriétaire de la réservation (plusieurs façons possibles)
  const isOwner = user?.id === reservation.employee?.id || user?.id === reservation.employee_id;

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

  const getRoomTypeIcon = (type) => {
    switch(type) {
      case 'conference':
        return (
          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      case 'office':
        return (
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      case 'training':
        return (
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    // Si c'est un datetime complet, extraire juste l'heure
    if (timeString.includes('T') || timeString.length > 8) {
      const date = new Date(timeString);
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }
    // Si c'est déjà au format HH:mm
    return timeString.substring(0, 5);
  };

  const handleCancel = () => {
    if (confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) {
      router.post(route('reservations.cancel', reservation.id));
    }
  };

  return (
    <tr className="hover:bg-gray-50">
      {isAdmin && (
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            <div>
              <div className="text-sm font-medium text-gray-900">
                {reservation.employee.name} {reservation.employee.first_name}
              </div>
              <div className="text-sm text-gray-500">
                {reservation.employee.employee_number}
              </div>
            </div>
          </div>
        </td>
      )}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="mr-2">{getRoomTypeIcon(reservation.room.type)}</div>
          <div>
            <div className="text-sm font-medium text-gray-900">
              {reservation.room.room_number}
            </div>
            <div className="text-sm text-gray-500">
              Capacité: {reservation.room.capacity} pers.
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {new Date(reservation.date).toLocaleDateString('fr-FR')}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {(() => {
          // Correction automatique des heures inversées à l'affichage
          if (reservation.start_time && reservation.end_time) {
            const start = new Date(`1970-01-01T${reservation.start_time}`);
            const end = new Date(`1970-01-01T${reservation.end_time}`);

            if (start > end) {
              // Heures inversées détectées - afficher corrigées
              return `${formatTime(reservation.end_time)} - ${formatTime(reservation.start_time)}`;
            }
          }
          // Affichage normal
          return `${formatTime(reservation.start_time)} - ${formatTime(reservation.end_time)}`;
        })()}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {getStatusBadge(reservation.status)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {reservation.purpose || '-'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex items-center justify-end space-x-2">
          {/* Tous les utilisateurs peuvent voir les détails */}
          <button
            onClick={() => onViewReservation(reservation)}
            className="text-blue-600 hover:text-blue-900"
          >
            Voir
          </button>

          {/* Tous les utilisateurs peuvent modifier les réservations non annulées */}
          {reservation.status !== 'cancelled' && (
            <button
              onClick={() => onEditReservation(reservation)}
              className="text-green-600 hover:text-green-900"
            >
              Modifier
            </button>
          )}

          {/* Seuls les admins et propriétaires peuvent annuler */}
          {(isAdmin || isOwner) && reservation.status !== 'cancelled' && (
            <button
              onClick={handleCancel}
              className="text-red-600 hover:text-red-900"
            >
              Annuler
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function ReservationsIndex({ reservations, filters, employees, rooms, statuses, isAdmin }) {
  // États pour les modals
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [activeFilters, setActiveFilters] = useState({
    employee_id: filters?.employee_id || '',
    room_id: filters?.room_id || '',
    date: filters?.date || '',
    period: filters?.period || 'upcoming',
    status: filters?.status || '',
  });

  const handleFilterChange = (key, value) => {
    const newFilters = { ...activeFilters, [key]: value };

    // Si on sélectionne une période, vider la date spécifique
    if (key === 'period' && value) {
      newFilters.date = '';
    }
    // Si on sélectionne une date, vider la période
    if (key === 'date' && value) {
      newFilters.period = '';
    }

    setActiveFilters(newFilters);

    // Filtrer les paramètres vides
    const cleanFilters = Object.entries(newFilters)
      .filter(([, v]) => v !== '')
      .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});

    router.get(route('reservations.index'), cleanFilters, {
      preserveState: true,
      replace: true
    });
  };

  const clearFilters = () => {
    setActiveFilters({
      employee_id: '',
      room_id: '',
      date: '',
      period: 'upcoming',
      status: '',
    });
    router.get(route('reservations.index'), { period: 'upcoming' }, {
      preserveState: true,
      replace: true
    });
  };

  // Fonctions pour gérer les modals
  const handleViewReservation = (reservation) => {
    setSelectedReservation(reservation);
    setShowViewModal(true);
  };

  const handleEditReservation = (reservation) => {
    setSelectedReservation(reservation);
    setShowEditModal(true);
  };

  const closeModals = () => {
    setSelectedReservation(null);
    setShowViewModal(false);
    setShowEditModal(false);
  };

  return (
    <SidebarLayout>
      <Head title="Réservations" />

      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {isAdmin ? 'Gestion des Réservations' : 'Mes Réservations'}
                  </h1>
                  <p className="mt-1 text-sm text-gray-600">
                    {isAdmin
                      ? 'Administration et suivi de l\'ensemble des réservations'
                      : 'Consultez et gérez vos réservations personnelles'
                    }</p>

                </div>
                {!isAdmin && (
                  <Link
                    href={route('reservations.create')}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Nouvelle Réservation
                  </Link>
                )}
              </div>

              {/* Filtres */}
              <div className={`grid grid-cols-1 md:grid-cols-2 ${isAdmin ? 'lg:grid-cols-6' : 'lg:grid-cols-5'} gap-4 mb-6`}>
                {isAdmin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Employé
                    </label>
                    <Select
                      value={activeFilters.employee_id}
                      onChange={(e) => handleFilterChange('employee_id', e.target.value)}
                    >
                      <option value="">Tous les employés</option>
                      {employees?.map(employee => (
                        <option key={employee.id} value={employee.id}>
                          {employee.name} {employee.first_name}
                        </option>
                      ))}
                    </Select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Salle
                  </label>
                  <Select
                    value={activeFilters.room_id}
                    onChange={(e) => handleFilterChange('room_id', e.target.value)}
                  >
                    <option value="">Toutes les salles</option>
                    {rooms?.map(room => (
                      <option key={room.id} value={room.id}>
                        {room.room_number}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Période
                  </label>
                  <Select
                    value={activeFilters.period}
                    onChange={(e) => handleFilterChange('period', e.target.value)}
                  >
                    <option value="">Sélectionner...</option>
                    <option value="today">Aujourd'hui</option>
                    <option value="week">Cette semaine</option>
                    <option value="month">Ce mois</option>
                    <option value="upcoming">À venir</option>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date spécifique
                  </label>
                  <Input
                    type="date"
                    value={activeFilters.date}
                    onChange={(e) => handleFilterChange('date', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Statut
                  </label>
                  <Select
                    value={activeFilters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <option value="">Tous les statuts</option>
                    {Object.entries(statuses).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="w-full"
                  >
                    Réinitialiser
                  </Button>
                </div>
              </div>
            </div>

            {/* Tableau des réservations */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {isAdmin && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employé
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Salle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Horaires
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Objet
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reservations?.data?.length > 0 ? (
                    reservations.data.map((reservation) => (
                      <ReservationRow
                        key={reservation.id}
                        reservation={reservation}
                        isAdmin={isAdmin}
                        onViewReservation={handleViewReservation}
                        onEditReservation={handleEditReservation}
                      />
                    ))
                  ) : (
                    <tr>
                      <td colSpan={isAdmin ? "7" : "6"} className="px-6 py-8 text-center text-gray-500">
                        <div className="flex flex-col items-center">
                          <svg className="w-12 h-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-lg font-medium">Aucune réservation trouvée</p>
                          <p className="text-sm">Modifiez les filtres ou créez une nouvelle réservation.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {reservations?.data?.length > 0 && reservations.links && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Affichage de {reservations.from} à {reservations.to} sur {reservations.total} résultats
                  </div>
                  <div className="flex space-x-1">
                    {reservations.links.map((link, index) => {
                      if (link.url === null) {
                        return (
                          <span
                            key={index}
                            className="px-3 py-2 text-sm text-gray-400 cursor-not-allowed"
                            dangerouslySetInnerHTML={{ __html: link.label }}
                          />
                        );
                      }

                      return (
                        <Link
                          key={index}
                          href={link.url}
                          className={`px-3 py-2 text-sm rounded ${
                            link.active
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                          dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals pour tous les utilisateurs */}
      <ViewReservationModal
        reservation={selectedReservation}
        isOpen={showViewModal}
        onClose={closeModals}
      />
      <EditReservationModal
        reservation={selectedReservation}
        isOpen={showEditModal}
        onClose={closeModals}
        rooms={rooms}
        employees={employees}
      />
    </SidebarLayout>
  );
}
