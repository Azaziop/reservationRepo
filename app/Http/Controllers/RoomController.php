<?php

namespace App\Http\Controllers;

use App\Models\Room;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RoomController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Room::query();

        // Filtrer par type si spécifié
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        // Filtrer par capacité minimale si spécifiée
        if ($request->filled('min_capacity')) {
            $query->where('capacity', '>=', $request->min_capacity);
        }

        // Recherche par numéro de salle ou description
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('room_number', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $rooms = $query->orderBy('room_number')->paginate(15);

        $data = [
            'rooms' => $rooms,
            'filters' => $request->only(['type', 'min_capacity', 'search']),
            'roomTypes' => Room::TYPES
        ];

        // Si on demande les détails d'une salle spécifique (pour modal)
        if ($request->filled('show')) {
            $room = Room::with(['reservations' => function ($query) {
                $query->with('employee')
                      ->where('date', '>=', now()->toDateString())
                      ->orderBy('date')
                      ->orderBy('start_time');
            }])->find($request->show);
            $data['room'] = $room;
        }

        // Si on demande l'édition d'une salle spécifique (pour modal)
        if ($request->filled('edit')) {
            $room = Room::find($request->edit);
            $data['room'] = $room;
        }

        return Inertia::render('Rooms/Index', $data);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('Rooms/Create', [
            'roomTypes' => Room::TYPES
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'room_number' => 'required|string|unique:rooms,room_number',
            'capacity' => 'required|integer|min:1',
            'type' => 'required|in:' . implode(',', array_keys(Room::TYPES)),
            'description' => 'nullable|string|max:1000'
        ]);

        Room::create($request->all());

        return redirect()->route('rooms.index')->with('success', 'Salle créée avec succès.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Room $room)
    {
        // Charger les réservations à venir pour cette salle
        $room->load(['reservations' => function ($query) {
            $query->with('employee')
                  ->where('date', '>=', now()->toDateString())
                  ->orderBy('date')
                  ->orderBy('start_time');
        }]);

        return Inertia::render('Rooms/Show', [
            'room' => $room
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Room $room)
    {
        return Inertia::render('Rooms/Edit', [
            'room' => $room,
            'roomTypes' => Room::TYPES
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Room $room)
    {
        $request->validate([
            'room_number' => 'required|string|unique:rooms,room_number,' . $room->id,
            'capacity' => 'required|integer|min:1',
            'type' => 'required|in:' . implode(',', array_keys(Room::TYPES)),
            'description' => 'nullable|string|max:1000'
        ]);

        $room->update($request->all());

        return redirect()->route('rooms.index')->with('success', 'Salle mise à jour avec succès.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Room $room)
    {
        // Vérifier s'il y a des réservations à venir
        $upcomingReservations = $room->reservations()
            ->where('date', '>=', now()->toDateString())
            ->count();

        if ($upcomingReservations > 0) {
            return back()->with('error', 'Impossible de supprimer cette salle car elle a des réservations à venir.');
        }

        $room->delete();

        return redirect()->route('rooms.index')->with('success', 'Salle supprimée avec succès.');
    }

    /**
     * Vérifier la disponibilité d'une salle
     */
    public function checkAvailability(Request $request, Room $room)
    {
        $request->validate([
            'date' => 'required|date|after_or_equal:today',
            'start_time' => 'required',
            'end_time' => 'required|after:start_time'
        ]);

        $isAvailable = $room->isAvailable(
            $request->date,
            $request->start_time,
            $request->end_time
        );

        return response()->json([
            'available' => $isAvailable,
            'message' => $isAvailable ? 'Salle disponible' : 'Salle non disponible pour cette période'
        ]);
    }

    /**
     * Récupérer les réservations d'une salle spécifique
     */
    public function reservations(Room $room)
    {
        $reservations = $room->reservations()
            ->with(['employee'])
            ->where('date', '>=', now()->toDateString())
            ->orderBy('date')
            ->orderBy('start_time')
            ->get();

        return response()->json($reservations);
    }
}
