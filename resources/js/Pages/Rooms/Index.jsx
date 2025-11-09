import { useEffect, useMemo, useState, useRef } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import SidebarLayout from '@/Layouts/Sidebar';
import AppLogoSmall from '@/Components/AppLogoSmall';

function useAuth() {
  const page = usePage();
  return { user: page?.props?.auth?.user ?? null };
}

function useRoomsFromProps(props) {
  const paginator = props?.rooms ?? [];
  const rooms = Array.isArray(paginator) ? paginator : (paginator?.data ?? []);
  return { rooms, paginator };
}

function Button({ variant = 'default', className = '', ...props }) {
  const base = 'inline-flex items-center justify-center rounded px-3 py-2 text-sm';
  const variants = {
    default: 'bg-blue-600 text-white hover:bg-blue-700',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'text-gray-700 hover:bg-gray-100',
  };
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

function Input(props) {
  return <input {...props} className={`border rounded px-3 py-2 ${props.className || ''}`} />;
}

function DetailsModal({ room, onClose }) {
  if (!room) return null;

  const getTypeIcon = (type) => {
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

  const getTypeLabel = (type) => {
    const labels = {
      'conference': 'Salle de conférence',
      'office': 'Bureau',
      'training': 'Salle de formation'
    };
    return labels[type] || type;
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded shadow w-full max-w-lg">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="text-lg font-semibold flex items-center gap-2">
            <span className="text-2xl">{getTypeIcon(room.type)}</span>
            {room.room_number}
          </div>
          <button onClick={onClose} className="px-2 py-1 rounded hover:bg-gray-100">✕</button>
        </div>
        <div className="p-4 space-y-3">
          <div className="text-sm text-gray-600"><strong>Type :</strong> {getTypeLabel(room.type)}</div>
          <div className="text-sm text-gray-600"><strong>Capacité :</strong> {room.capacity} personnes</div>
          {room.description && (
            <div>
              <div className="text-sm text-gray-600 font-medium mb-1">Description :</div>
              <p className="text-gray-800 whitespace-pre-line text-sm">{room.description}</p>
            </div>
          )}
        </div>
        <div className="p-4 border-t flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Fermer</Button>
          <Button onClick={() => router.visit(`/reservations/create?room_id=${room.id}`)}>
            Réserver
          </Button>
        </div>
      </div>
    </div>
  );
}

function EditModal({ initialRoom, onClose, onSubmit }) {
  const [form, setForm] = useState(() => ({
    room_number: initialRoom?.room_number || '',
    type: initialRoom?.type || 'conference',
    capacity: initialRoom?.capacity || '',
    description: initialRoom?.description || '',
  }));

  useEffect(() => {
    if (initialRoom) {
      setForm({
        room_number: initialRoom.room_number || '',
        type: initialRoom.type || 'conference',
        capacity: initialRoom.capacity || '',
        description: initialRoom.description || '',
      });
    }
  }, [initialRoom]);

  const submit = (e) => {
    e.preventDefault();
    onSubmit(initialRoom.id, form);
  };

  if (!initialRoom) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded shadow w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white">
          <div className="text-lg font-semibold">Modifier la salle</div>
          <button onClick={onClose} className="px-2 py-1 rounded hover:bg-gray-100">✕</button>
        </div>
        <form onSubmit={submit} className="p-4 space-y-3">
          <div>
            <label className="text-sm text-gray-700">Numéro de salle</label>
            <Input className="w-full mt-1"
              value={form.room_number}
              onChange={(e) => setForm({ ...form, room_number: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="text-sm text-gray-700">Type</label>
            <select
              className="w-full mt-1 border rounded px-3 py-2"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              required
            >
              <option value="conference">Salle de conférence</option>
              <option value="office">Bureau</option>
              <option value="training">Salle de formation</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-700">Capacité</label>
            <Input
              className="w-full mt-1"
              type="number"
              min="1"
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="text-sm text-gray-700">Description</label>
            <textarea
              rows={4}
              className="w-full mt-1 border rounded px-3 py-2"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={onClose}>Annuler</Button>
            <Button type="submit">Enregistrer</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ConfirmDeleteModal({ room, onCancel, onConfirm }) {
  if (!room) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded shadow w-full max-w-sm">
        <div className="p-4 border-b text-lg font-semibold">Supprimer la salle</div>
        <div className="p-4 text-sm text-gray-700">
          Confirmer la suppression de la salle "{room.room_number}" ?
        </div>
        <div className="p-4 border-t flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>Annuler</Button>
          <Button variant="danger" onClick={() => onConfirm(room)}>Supprimer</Button>
        </div>
      </div>
    </div>
  );
}

function RoomCard({ room, user, onOpenDetails, onOpenEdit, onOpenDelete, onReserve }) {
  const isAdmin = user?.role === 'admin';

  const getTypeIcon = (type) => {
    switch(type) {
      case 'conference':
        return (
          <svg className="w-full h-full text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm3 1h6v4H7V5zm8 8v2a1 1 0 01-1 1H6a1 1 0 01-1-1v-2h10zm-6-4a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
          </svg>
        );
      case 'office':
        return (
          <svg className="w-full h-full text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 2a1 1 0 00-1 1v14a1 1 0 001 1h12a1 1 0 001-1V3a1 1 0 00-1-1H4zm3 3a1 1 0 000 2h6a1 1 0 100-2H7zm0 4a1 1 0 100 2h6a1 1 0 100-2H7zm0 4a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
          </svg>
        );
      case 'training':
        return (
          <svg className="w-full h-full text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.75 2.524z"/>
          </svg>
        );
      default:
        return (
          <svg className="w-full h-full text-white" fill="currentColor" viewBox="0 0 20 20">
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

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 overflow-hidden group">
      <div className="relative">
        {/* Image Container */}
        <div className="h-48 overflow-hidden">
          <div className={`w-full h-full bg-gradient-to-r ${getTypeColor(room.type)} flex items-center justify-center`}>
            <div className="rounded-full bg-white/10 p-8">
              <div className="text-white opacity-90 w-20 h-20">{getTypeIcon(room.type)}</div>
            </div>
          </div>
        </div>

        {/* Type Badge */}
        <div className="absolute top-4 right-4">
          <span className="bg-white/90 text-gray-800 px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm">
            {getTypeLabel(room.type)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="space-y-3">
          <h3 className="text-xl font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">
            Salle {room.room_number}
          </h3>

          {/* Room Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-sm">{room.capacity} personnes</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span className="text-sm">{getTypeLabel(room.type)}</span>
            </div>
          </div>

          {/* Description */}
          {room.description && (
            <p className="text-sm text-gray-600 line-clamp-2">{room.description}</p>
          )}
        </div>

        {/* Actions */}
        <div className="mt-5 flex gap-2 justify-end">
          <Button
            variant="ghost"
            onClick={() => onOpenDetails(room.id)}
            className="text-gray-700 hover:text-gray-900"
          >
            Détails
          </Button>

          {!isAdmin && (
            <Button
              variant="default"
              onClick={() => onReserve(room.id)}
              className="text-white bg-gray-900 hover:bg-black"
            >
              Réserver
            </Button>
          )}

          {isAdmin && (
            <>
              <Button
                variant="outline"
                onClick={() => onOpenEdit(room.id)}
                className="text-gray-600 hover:text-gray-900"
              >
                Modifier
              </Button>
              <Button
                variant="danger"
                onClick={() => onOpenDelete(room)}
                className="text-red-600 hover:text-red-700"
              >
                Supprimer
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function CreateRoomModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({
    room_number: '',
    type: 'conference',
    capacity: '',
    description: '',
  });

  const submit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded shadow w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b sticky top-0 bg-white">
          <div className="text-lg font-semibold">Créer une salle</div>
          <div className="text-sm text-gray-600">Remplissez les informations</div>
        </div>
        <form onSubmit={submit} className="p-4 space-y-3">
          <div>
            <label className="text-sm text-gray-700">Numéro de salle</label>
            <Input className="w-full mt-1" value={form.room_number} onChange={(e) => setForm({ ...form, room_number: e.target.value })} required />
          </div>
          <div>
            <label className="text-sm text-gray-700">Type</label>
            <select
              className="w-full mt-1 border rounded px-3 py-2"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              required
            >
              <option value="conference">Salle de conférence</option>
              <option value="office">Bureau</option>
              <option value="training">Salle de formation</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-700">Capacité</label>
            <Input className="w-full mt-1" type="number" min="1" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} required />
          </div>
          <div>
            <label className="text-sm text-gray-700">Description</label>
            <textarea rows={4} className="w-full mt-1 border rounded px-3 py-2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={onClose}>Annuler</Button>
            <Button type="submit">Créer</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CreateReservationModal({ room, employees, onClose, onSubmit }) {
  const { user } = useAuth(); // ✅ Récupérer l'utilisateur connecté

  const [form, setForm] = useState({
    employee_id: user?.id?.toString() || '', // ✅ Auto-initialiser avec l'ID de l'utilisateur connecté
    date: '',
    start_time: '',
    end_time: '',
    purpose: '',
  });

  const [availability, setAvailability] = useState(null);

  const getTypeIcon = (type) => {
    switch(type) {
      case 'conference':
        return (
          <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm3 1h6v4H7V5zm8 8v2a1 1 0 01-1 1H6a1 1 0 01-1-1v-2h10zm-6-4a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
          </svg>
        );
      case 'office':
        return (
          <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 2a1 1 0 00-1 1v14a1 1 0 001 1h12a1 1 0 001-1V3a1 1 0 00-1-1H4zm3 3a1 1 0 000 2h6a1 1 0 100-2H7zm0 4a1 1 0 100 2h6a1 1 0 100-2H7zm0 4a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
          </svg>
        );
      case 'training':
        return (
          <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.75 2.524z"/>
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
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

  const checkAvailability = async () => {
    if (!room || !form.date || !form.start_time || !form.end_time) {
      setAvailability(null);
      return;
    }

    try {
      // Utilisation d'Axios avec les configurations Laravel par défaut
      const response = await window.axios.post(`/rooms/${room.id}/check-availability`, {
        date: form.date,
        start_time: form.start_time,
        end_time: form.end_time
      });

      setAvailability(response.data);
    } catch (error) {
      console.error('Erreur lors de la vérification de disponibilité:', error);

      // Vérification basique côté client en cas d'erreur serveur
      if (form.start_time && form.end_time) {
        const startTime = new Date(`1970-01-01T${form.start_time}`);
        const endTime = new Date(`1970-01-01T${form.end_time}`);

        if (startTime >= endTime) {
          setAvailability({
            available: false,
            message: 'L\'heure de fin doit être après l\'heure de début'
          });
        } else {
          setAvailability({
            available: true,
            message: 'Vérification indisponible - Salle probablement libre'
          });
        }
      } else {
        setAvailability({ available: false, message: 'Veuillez remplir tous les champs' });
      }
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      checkAvailability();
    }, 500);

    return () => clearTimeout(timer);
  }, [room, form.date, form.start_time, form.end_time]);

  const submit = (e) => {
    e.preventDefault();
    if (room) {
      // ✅ NE PAS CORRIGER - Le backend gère la correction!
      // Le frontend envoie les heures EXACTEMENT comme l'utilisateur les a entrées

      console.log('🚀 Données de réservation envoyées (SANS correction frontend):', form);
      console.log('📝 Heures exactes:', {
        start: form.start_time,
        end: form.end_time
      });

      const reservationData = { ...form, room_id: room.id };

      onSubmit(reservationData);
    }
  };

  if (!room) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded shadow w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b sticky top-0 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold flex items-center gap-2">
                <div className="flex-shrink-0">{getTypeIcon(room.type)}</div>
                <span>Réserver la salle {room.room_number}</span>
              </div>
              <div className="text-sm text-gray-600">
                {getTypeLabel(room.type)} - Capacité: {room.capacity} personnes
              </div>
            </div>
            <button onClick={onClose} className="px-2 py-1 rounded hover:bg-gray-100">✕</button>
          </div>
        </div>

        <form onSubmit={submit} className="p-4 space-y-4">
          {/* Employé - Affichage en lecture seule (utilisateur connecté) */}
          <div>
            <label className="text-sm text-gray-700 font-medium">Employé</label>
            <div className="w-full mt-1 border rounded px-3 py-2 bg-gray-50 text-gray-700">
              {user ? `${user.first_name} ${user.name}` : 'Non disponible'}
            </div>
            <input type="hidden" name="employee_id" value={form.employee_id} />
          </div>

          {/* Date */}
          <div>
            <label className="text-sm text-gray-700 font-medium">Date *</label>
            <Input
              type="date"
              className="w-full mt-1"
              value={form.date}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
            />
          </div>

          {/* Heures */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-700 font-medium flex items-center gap-1">
                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414-1.414L9 5.586 7.707 4.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4a1 1 0 00-1.414-1.414L9 5.586z" clipRule="evenodd" />
                </svg>
                Heure de DÉBUT *
              </label>
              <Input
                type="time"
                className="w-full mt-1 border-2 border-green-200 focus:border-green-500"
                value={form.start_time}
                onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                required
                placeholder="Ex: 09:00"
              />
              {form.start_time && (
                <p className="text-xs text-green-600 mt-1">Début: {form.start_time}</p>
              )}
            </div>
            <div>
              <label className="text-sm text-gray-700 font-medium flex items-center gap-1">
                <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                Heure de FIN *
              </label>
              <Input
                type="time"
                className="w-full mt-1 border-2 border-red-200 focus:border-red-500"
                value={form.end_time}
                onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                required
                placeholder="Ex: 10:00"
              />
              {form.end_time && (
                <p className="text-xs text-red-600 mt-1">Fin: {form.end_time}</p>
              )}
            </div>
          </div>

          {/* Durée calculée */}
          {form.start_time && form.end_time && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <div className="flex items-center gap-2 text-sm">
                <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span className="text-blue-800 font-medium">
                  Créneaux: {form.start_time} → {form.end_time}
                  {(() => {
                    if (form.start_time && form.end_time) {
                      const start = new Date(`1970-01-01T${form.start_time}`);
                      const end = new Date(`1970-01-01T${form.end_time}`);
                      const diff = (end - start) / (1000 * 60); // différence en minutes
                      return diff > 0 ? ` (${Math.floor(diff / 60)}h${diff % 60 ? Math.floor(diff % 60).toString().padStart(2, '0') : '00'})` : ' (ERREUR)';
                    }
                    return '';
                  })()}
                </span>
              </div>
            </div>
          )}

          {/* Objet */}
          <div>
            <label className="text-sm text-gray-700 font-medium">Objet de la réunion</label>
            <textarea
              rows={3}
              className="w-full mt-1 border rounded px-3 py-2"
              value={form.purpose}
              onChange={(e) => setForm({ ...form, purpose: e.target.value })}
              placeholder="Décrivez brièvement l'objet de votre réunion..."
            />
          </div>

          {/* Vérification de disponibilité */}
          {availability && (
            <div className={`p-3 rounded-md ${availability.available ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-center">
                <div className="mr-2">
                  {availability.available ? (
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <p className={`text-sm font-medium ${availability.available ? 'text-green-800' : 'text-red-800'}`}>
                  {availability.message}
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose}>Annuler</Button>
            <Button
              type="submit"
              disabled={availability && !availability.available}
            >
              Créer la réservation
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function RoomsIndex(props) {
  const { user } = useAuth();
  const { rooms, paginator } = useRoomsFromProps(props);

  const getRoomTypeIcon = (type) => {
    switch (type) {
      case 'conference':
        return (
          <svg className="w-full h-full" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm3 1h6v4H7V5zm8 8v2a1 1 0 01-1 1H6a1 1 0 01-1-1v-2h10zm-6-4a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
          </svg>
        );
      case 'office':
        return (
          <svg className="w-full h-full" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 2a1 1 0 00-1 1v14a1 1 0 001 1h12a1 1 0 001-1V3a1 1 0 00-1-1H4zm3 3a1 1 0 000 2h6a1 1 0 100-2H7zm0 4a1 1 0 100 2h6a1 1 0 100-2H7zm0 4a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
          </svg>
        );
      case 'training':
        return (
          <svg className="w-full h-full" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.75 2.524z"/>
          </svg>
        );
      default:
        return (
          <svg className="w-full h-full" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const [showCreate, setShowCreate] = useState(false);
  const [detailsRoom, setDetailsRoom] = useState(null);
  const [editRoom, setEditRoom] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [reservationRoom, setReservationRoom] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    const matches = (room) => {
      // Text search
      const number = (room.room_number || '').toLowerCase();
      const desc = (room.description || '').toLowerCase();
      const matchesSearch = !q || number.includes(q) || desc.includes(q);

      // Type filtering
      const matchesType = typeFilter === 'all' || room.type === typeFilter;

      return matchesSearch && matchesType;
    };

    return rooms.filter(matches);
  }, [rooms, searchTerm, typeFilter]);

  const openDetails = (id) => {
    router.visit(route('rooms.index'), {
      data: { show: id },
      only: ['room', 'rooms'],
      preserveState: true,
      preserveScroll: true,
      onSuccess: (page) => setDetailsRoom(page.props?.room || null),
    });
  };

  const openEdit = (id) => {
    router.visit(route('rooms.index'), {
      data: { edit: id },
      only: ['room', 'rooms'],
      preserveState: true,
      preserveScroll: true,
      onSuccess: (page) => setEditRoom(page.props?.room || null),
    });
  };

  const closeAll = () => {
    setShowCreate(false);
    setDetailsRoom(null);
    setEditRoom(null);
    setConfirmDelete(null);
    setReservationRoom(null);
    router.visit(route('rooms.index'), {
      replace: true,
      only: ['rooms'],
      preserveState: true,
      preserveScroll: true,
    });
  };

  const handleReserve = async (roomId) => {
    // Charger la salle et les employés pour la modale
    try {
      const room = filtered.find(r => r.id === roomId);
      if (room) {
        setReservationRoom(room);

        // Utiliser l'utilisateur courant par défaut (pas besoin d'API)
        if (employees.length === 0) {
          setEmployees([
            {
              id: user.id,
              name: user.name,
              first_name: user.first_name,
              employee_number: user.employee_number || '001',
              department: user.department || 'IT'
            }
          ]);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      // Fallback: utiliser les données utilisateur actuelles
      const room = filtered.find(r => r.id === roomId);
      if (room) {
        setReservationRoom(room);
        setEmployees([
          { id: user.id, name: user.name, first_name: user.first_name, employee_number: user.employee_number || '001', department: user.department || 'IT' }
        ]);
      }
    }
  };

  const createReservation = (form) => {
    router.post(route('reservations.store'), form, {
      preserveScroll: true,
      onSuccess: () => {
        setReservationRoom(null);
        router.reload({ only: ['rooms'] });
      },
    });
  };

  const createRoom = (form) => {
    router.post(route('rooms.store'), form, {
      preserveScroll: true,
      onSuccess: () => {
        setShowCreate(false);
        router.reload({ only: ['rooms'] });
      },
    });
  };

  const submitEdit = (id, form) => {
    router.put(route('rooms.update', id), form, {
      preserveScroll: true,
      onSuccess: () => {
        setEditRoom(null);
        router.reload({ only: ['rooms'] });
      },
    });
  };

  const confirmDeleteNow = (room) => {
    router.delete(route('rooms.destroy', room.id), {
      preserveScroll: true,
      onSuccess: () => {
        setConfirmDelete(null);
        router.reload({ only: ['rooms'] });
      },
    });
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const Layout = ({ children }) => {
    if (user?.role === 'admin') {
      return <SidebarLayout>{children}</SidebarLayout>;
    }

    return (
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    );
  };

  return (
    <Layout>
      <Head title="Salles" />
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          {user?.role === 'admin' ? (
            <Link href={route('dashboard')}>
              <AppLogoSmall />
            </Link>
          ) : (
            <AppLogoSmall />
          )}
          <div className="flex items-center gap-4">
            {/* Profile Dropdown */}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
              >
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeWidth="2" d="M6 9l6 6 6-6"/>
                </svg>
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                  <Link
                    href={route('profile.edit')}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Profil
                  </Link>
                  <Link
                    href={route('logout')}
                    method="post"
                    as="button"
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Déconnexion
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="space-y-4 mb-6">
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <Input
                type="text"
                placeholder="Rechercher des salles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:flex-1"
              />
              <select
                className="border rounded px-3 py-2 md:w-auto"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">Tous les types</option>
                <option value="conference">Salle de conférence</option>
                <option value="office">Bureau</option>
                <option value="training">Salle de formation</option>
              </select>
            </div>
          </div>

          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Salles disponibles</h2>
          </div>

          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="text-sm text-gray-600">
              {filtered.length} salle{filtered.length > 1 ? 's' : ''} trouvée{filtered.length > 1 ? 's' : ''}
            </div>
            {user?.role === 'admin' && (
              <Button onClick={() => setShowCreate(true)} className="bg-gray-900 hover:bg-black">
                + Créer une salle
              </Button>
            )}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Aucune salle trouvée</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {filtered.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                user={user}
                onOpenDetails={openDetails}
                onOpenEdit={openEdit}
                onOpenDelete={setConfirmDelete}
                onReserve={handleReserve}
              />
            ))}
          </div>
        )}

        {paginator?.links && (
          <div className="flex gap-2 mt-8">
            {paginator.links.map((link, i) => (
              <Link
                key={i}
                href={link.url || '#'}
                className={`px-2 py-1 rounded border ${link.active ? 'bg-gray-200' : ''}`}
                dangerouslySetInnerHTML={{ __html: link.label }}
                preserveState
                preserveScroll
              />
            ))}
          </div>
        )}
      </main>

      {showCreate && <CreateRoomModal onClose={closeAll} onSubmit={createRoom} />}
      {detailsRoom && <DetailsModal room={detailsRoom} onClose={closeAll} />}
      {editRoom && <EditModal initialRoom={editRoom} onClose={closeAll} onSubmit={submitEdit} />}
      {confirmDelete && <ConfirmDeleteModal room={confirmDelete} onCancel={() => setConfirmDelete(null)} onConfirm={confirmDeleteNow} />}
      {reservationRoom && <CreateReservationModal room={reservationRoom} employees={employees} onClose={closeAll} onSubmit={createReservation} />}
    </Layout>
  );
}
