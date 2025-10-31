import { useEffect, useMemo, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import SidebarLayout from '@/Layouts/Sidebar';

function useAuth() {
  const page = usePage();
  return { user: page?.props?.auth?.user ?? null };
}

function useEventsFromProps(props) {
  const paginator = props?.events ?? [];
  const events = Array.isArray(paginator) ? paginator : (paginator?.data ?? []);
  return { events, paginator };
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

function formatDateFR(value) {
  const d = new Date(value);
  return isNaN(d.getTime())
    ? value
    : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function toDateInputValue(raw) {
  if (!raw) return '';
  const s = String(raw);
  const datePart = s.includes('T') ? s.slice(0, 10) : s.split(' ')[0];
  return /^\d{4}-\d{2}-\d{2}$/.test(datePart) ? datePart : '';
}

function DetailsModal({ event, onClose }) {
  if (!event) return null;
  // participants doit être bien chargé côté backend (EventController@dashboard, déjà fait si tu as suivi la correction précédente)
  const participants = event.participants || [];

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded shadow w-full max-w-lg">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="text-lg font-semibold">{event.title}</div>
          <button onClick={onClose} className="px-2 py-1 rounded hover:bg-gray-100">✕</button>
        </div>
        <div className="p-4 space-y-2">
          {(event.image_url || event.image_path) && (
            <div className="h-48 overflow-hidden rounded">
              <img src={event.image_url || event.image_path} alt={event.title} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="text-sm text-gray-600"><strong>Lieu :</strong> {event.location}</div>
          <div className="text-sm text-gray-600"><strong>Date :</strong> {formatDateFR(event.date)}</div>
          <p className="text-gray-800 whitespace-pre-line">{event.description}</p>

          <div className="mt-4">
            <div className="font-semibold mb-2">Liste des participants :</div>
            {participants.length === 0 ? (
              <div className="text-sm text-gray-500">Aucun participant</div>
            ) : (
              <ul className="space-y-1">
                {participants.map((p) => (
                  <li key={p.id} className="text-sm flex items-center gap-2">
                    <span>{p.name}</span>
                    {p.email && (
                      <a
                        href={`mailto:${p.email}`}
                        className="inline-flex items-center text-blue-500 hover:underline ml-1"
                        title={`Contacter ${p.name}`}
                        target="_blank" rel="noopener noreferrer"
                      >
                        <svg className="inline mr-1" width="16" height="16" fill="none" viewBox="0 0 24 24">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4h16v16H4V4zm16 0v3.76L12 14 4 7.76V4"></path>
                        </svg>
                        Email
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="p-4 border-t flex justify-end">
          <Button variant="outline" onClick={onClose}>Fermer</Button>
        </div>
      </div>
    </div>
  );
}


function EditModal({ initialEvent, onClose, onSubmit }) {
  const [form, setForm] = useState(() => ({
    title: initialEvent?.title || '',
    date: toDateInputValue(initialEvent?.date),
    location: initialEvent?.location || '',
    description: initialEvent?.description || '',
    image: null,
  }));
  const [imagePreview, setImagePreview] = useState(initialEvent?.image_path || null);

  useEffect(() => {
    if (initialEvent) {
      setForm({
        title: initialEvent.title || '',
        date: toDateInputValue(initialEvent.date),
        location: initialEvent.location || '',
        description: initialEvent.description || '',
        image: null,
      });
      setImagePreview(initialEvent.image_url || initialEvent.image_path || null);
    }
  }, [initialEvent]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm({ ...form, image: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const submit = (e) => {
    e.preventDefault();
    onSubmit(initialEvent.id, form);
  };

  if (!initialEvent) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded shadow w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white">
          <div className="text-lg font-semibold">Modifier l'événement</div>
          <button onClick={onClose} className="px-2 py-1 rounded hover:bg-gray-100">✕</button>
        </div>
        <form onSubmit={submit} className="p-4 space-y-3">
          <div>
            <label className="text-sm text-gray-700">Nom</label>
            <Input className="w-full mt-1"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="text-sm text-gray-700">Date</label>
            <Input className="w-full mt-1" type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="text-sm text-gray-700">Lieu</label>
            <Input className="w-full mt-1"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
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
              required
            />
          </div>
          <div>
            <label className="text-sm text-gray-700 block mb-2">Image de l'événement</label>
            {imagePreview && (
              <div className="mb-2 relative h-40 rounded overflow-hidden">
                <img src={imagePreview} alt="Aperçu" className="w-full h-full object-cover" />
              </div>
            )}
            <Input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">Formats acceptés: JPG, PNG, GIF</p>
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

function ConfirmDeleteModal({ event, onCancel, onConfirm }) {
  if (!event) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded shadow w-full max-w-sm">
        <div className="p-4 border-b text-lg font-semibold">Supprimer l’événement</div>
        <div className="p-4 text-sm text-gray-700">
          Confirmer la suppression de “{event.title}” ?
        </div>
        <div className="p-4 border-t flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>Annuler</Button>
          <Button variant="danger" onClick={() => onConfirm(event)}>Supprimer</Button>
        </div>
      </div>
    </div>
  );
}

function EventCard({ event, user, onOpenDetails, onOpenEdit, onOpenDelete, onJoin }) {
  const isAdmin = user?.role === 'admin';
  const isOwner = user && event.creator_id === user.id;
  const alreadyJoined = user && event.participantsIds.includes(user.id);

  const showJoin =
    user && !isAdmin && !isOwner && !alreadyJoined;

  return (
    <div className="bg-white rounded shadow overflow-hidden hover:shadow-lg transition-shadow">
      {(event.image_url || event.image_path) && (
        <div className="h-40 overflow-hidden">
          <img src={event.image_url || event.image_path} alt={event.title} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-4 space-y-2">
        <div className="text-lg font-semibold">{event.title}</div>
        <div className="text-sm text-gray-600">{formatDateFR(event.date)}</div>
        <div className="text-sm text-gray-600">{event.location}</div>
        <div className="text-sm text-gray-700 line-clamp-2">{event.description}</div>
        <div className="pt-3 flex gap-2">
          <Button variant="ghost" className="flex-1 border" onClick={() => onOpenDetails(event.id)}>
            Détails
          </Button>
          {showJoin && (
            <Button variant="default" onClick={() => onJoin(event.id)}>
              Rejoindre
            </Button>
          )}
          {isAdmin && (
            <>
              <Button variant="outline" onClick={() => onOpenEdit(event.id)}>Modifier</Button>
              <Button variant="danger" onClick={() => onOpenDelete(event)}>Supprimer</Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function CreateEventModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({
    title: '',
    date: '',
    location: '',
    description: '',
    image: null,
  });
  const [imagePreview, setImagePreview] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm({ ...form, image: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const submit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded shadow w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b sticky top-0 bg-white">
          <div className="text-lg font-semibold">Créer un événement</div>
          <div className="text-sm text-gray-600">Remplissez les informations</div>
        </div>
        <form onSubmit={submit} className="p-4 space-y-3">
          <div>
            <label className="text-sm text-gray-700">Nom</label>
            <Input className="w-full mt-1" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div>
            <label className="text-sm text-gray-700">Date</label>
            <Input className="w-full mt-1" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
          </div>
          <div>
            <label className="text-sm text-gray-700">Lieu</label>
            <Input className="w-full mt-1" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required />
          </div>
          <div>
            <label className="text-sm text-gray-700">Description</label>
            <textarea rows={4} className="w-full mt-1 border rounded px-3 py-2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
          </div>
          <div>
            <label className="text-sm text-gray-700 block mb-2">Image de l'événement</label>
            {imagePreview && (
              <div className="mb-2 relative h-40 rounded overflow-hidden">
                <img src={imagePreview} alt="Aperçu" className="w-full h-full object-cover" />
              </div>
            )}
            <Input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">Formats acceptés: JPG, PNG, GIF</p>
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

export default function Dashboard(props) {
  const { user } = useAuth();
  const { events, paginator } = useEventsFromProps(props);

  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [detailsEvent, setDetailsEvent] = useState(null);
  const [editEvent, setEditEvent] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const normalized = useMemo(
    () =>
      events.map((e) => ({
        ...e,
        participantsIds: (e.participants || []).map((p) => (typeof p === 'object' ? p.id : p)),
      })),
    [events]
  );

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const matches = (ev) => {
      const name = (ev.title || ev.name || '').toLowerCase();
      const desc = (ev.description || '').toLowerCase();
      return !q || name.includes(q) || desc.includes(q);
    };
    if (!user) return normalized.filter(matches);
    if (filter === 'my-events') return normalized.filter((ev) => ev.creator_id === user.id && matches(ev));
    if (filter === 'joined') {
      return normalized.filter((ev) =>
        ev.creator_id !== user.id &&
        ev.participantsIds.includes(user.id) &&
        matches(ev)
      );
    }
    return normalized.filter(matches);
  }, [normalized, user, filter, searchTerm]);

  // ---- Ajoute la fonction participation ----
  const handleJoin = (eventId) => {
    router.post(route('events.join', eventId), {}, {
      preserveScroll: true,
      onSuccess: () => router.reload({ only: ['events'] }),
    });
  };
  // ----------------------------------------

  // ...autres handlers : openDetails, openEdit, closeAll, createEvent, submitEdit, confirmDeleteNow ( inchangés )...

  const openDetails = (id) => {
    router.visit(route('dashboard'), {
      data: { show: id },
      only: ['event', 'events'],
      preserveState: true,
      preserveScroll: true,
      onSuccess: (page) => setDetailsEvent(page.props?.event || null),
    });
  };

  const openEdit = (id) => {
    router.visit(route('dashboard'), {
      data: { edit: id },
      only: ['event', 'events'],
      preserveState: true,
      preserveScroll: true,
      onSuccess: (page) => setEditEvent(page.props?.event || null),
    });
  };

  const closeAll = () => {
    setShowCreate(false);
    setDetailsEvent(null);
    setEditEvent(null);
    setConfirmDelete(null);
    router.visit(route('dashboard'), {
      replace: true,
      only: ['events'],
      preserveState: true,
      preserveScroll: true,
    });
  };

  const createEvent = (form) => {
    const formData = new FormData();
    formData.append('title', form.title);
    formData.append('date', form.date);
    formData.append('location', form.location);
    formData.append('description', form.description);
    if (form.image) {
      formData.append('image', form.image);
    }

    router.post(route('dashboard.events.store'), formData, {
      preserveScroll: true,
      forceFormData: true,
      onSuccess: () => {
        setShowCreate(false);
        router.reload({ only: ['events'] });
      },
    });
  };

  const submitEdit = (id, form) => {
    const formData = new FormData();
    formData.append('title', form.title);
    formData.append('date', form.date);
    formData.append('location', form.location);
    formData.append('description', form.description);
    formData.append('from', 'dashboard');
    formData.append('_method', 'PUT');
    if (form.image) {
      formData.append('image', form.image);
    }

    router.post(route('events.update', id), formData, {
      preserveScroll: true,
      forceFormData: true,
      onSuccess: () => {
        setEditEvent(null);
        router.reload({ only: ['events'] });
      },
    });
  };

  const confirmDeleteNow = (ev) => {
    router.delete(route('events.destroy', ev.id), {
      preserveScroll: true,
      onSuccess: () => {
        setConfirmDelete(null);
        router.reload({ only: ['events'] });
      },
    });
  };

  return (
    <SidebarLayout>
      <Head title="Événements" />
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="font-semibold">Events App</div>
          <div className="flex gap-2">
            <Button onClick={() => setShowCreate(true)}>+ Créer un événement</Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="space-y-4 mb-6">
          <Input
            type="text"
            placeholder="Rechercher des événements..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
          <div className="flex gap-2 flex-wrap">
            <Button variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')} className={filter === 'all' ? 'bg-blue-600' : ''}>
              Tous les événements
            </Button>
            <Button variant={filter === 'my-events' ? 'default' : 'outline'} onClick={() => setFilter('my-events')} className={filter === 'my-events' ? 'bg-blue-600' : ''}>
              Mes événements
            </Button>
            <Button variant={filter === 'joined' ? 'default' : 'outline'} onClick={() => setFilter('joined')} className={filter === 'joined' ? 'bg-blue-600' : ''}>
              Événements rejoints
            </Button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Aucun événement trouvé</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((ev) => (
              <EventCard
                key={ev.id}
                event={ev}
                user={user}
                onOpenDetails={openDetails}
                onOpenEdit={openEdit}
                onOpenDelete={setConfirmDelete}
                onJoin={handleJoin}
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

      {showCreate && <CreateEventModal onClose={closeAll} onSubmit={createEvent} />}
      {detailsEvent && <DetailsModal event={detailsEvent} onClose={closeAll} />}
      {editEvent && <EditModal initialEvent={editEvent} onClose={closeAll} onSubmit={submitEdit} />}
      {confirmDelete && <ConfirmDeleteModal event={confirmDelete} onCancel={() => setConfirmDelete(null)} onConfirm={confirmDeleteNow} />}
    </SidebarLayout>
  );
}
