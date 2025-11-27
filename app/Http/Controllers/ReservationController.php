<?php

namespace App\Http\Controllers;

use App\Models\Reservation;
use App\Models\Room;
use App\Models\User;
use App\Rules\EmployeeAvailable;
use App\Rules\RoomAvailable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Carbon\Carbon;

class ReservationController extends Controller
{
    // Constants for duplicated literals
    private const TIME_FORMAT_REGEX = '/^\d{2}:\d{2}$/';
    private const DATETIME_FORMAT = 'Y-m-d H:i';
    
    /**
     * Afficher la page d'accueil publique
     */
    public function home()
    {
        // Afficher les salles disponibles et informations générales
        $rooms = Room::select('id', 'room_number', 'type', 'capacity')
                    ->orderBy('room_number')
                    ->get();

        return Inertia::render('Home', [
            'rooms' => $rooms,
            'roomTypes' => Room::TYPES
        ]);
    }

    /**
     * Afficher le dashboard pour utilisateurs connectés
     */
    public function dashboard(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        // Réservations de l'utilisateur connecté
        $myReservations = $user->reservations()
            ->with('room')
            ->where('date', '>=', now()->toDateString())
            ->orderBy('date')
            ->orderBy('start_time')
            ->limit(5)
            ->get();

        // Statistiques rapides
        $stats = [
            'my_reservations_count' => $user->reservations()->where('date', '>=', now()->toDateString())->count(),
            'rooms_count' => Room::count(),
            'today_reservations' => Reservation::where('date', now()->toDateString())->count()
        ];

        return Inertia::render('Dashboard', [
            'myReservations' => $myReservations,
            'stats' => $stats
        ]);
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        $isAdmin = $user->role === 'admin';

        $query = Reservation::with(['employee', 'room']);

        // Si l'utilisateur n'est pas admin, limiter aux ses propres réservations
        if (!$isAdmin) {
            $query->where('employee_id', $user->id);
        }

        // Filtres pour les admins seulement
        if ($isAdmin) {
            // Filtrer par employé si spécifié
            if ($request->filled('employee_id')) {
                $query->where('employee_id', $request->employee_id);
            }
        }

        // Filtrer par salle si spécifiée
        if ($request->filled('room_id')) {
            $query->where('room_id', $request->room_id);
        }

        // Filtrer par date
        if ($request->filled('date')) {
            $query->where('date', $request->date);
        } elseif ($request->filled('period')) {
            switch ($request->period) {
                case 'today':
                    $query->where('date', now()->toDateString());
                    break;
                case 'week':
                    $query->whereBetween('date', [now()->startOfWeek(), now()->endOfWeek()]);
                    break;
                case 'month':
                    $query->whereMonth('date', now()->month)
                          ->whereYear('date', now()->year);
                    break;
                case 'upcoming':
                    $query->where('date', '>=', now()->toDateString());
                    break;
                default:
                    // No filter applied for unknown period
                    break;
            }
        } else {
            // Par défaut, afficher les réservations à partir d'aujourd'hui
            $query->where('date', '>=', now()->toDateString());
        }

        // Filtrer par statut
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $reservations = $query->orderBy('date')
                             ->orderBy('start_time')
                             ->paginate(15);

        // Préparer les données selon le rôle
        $data = [
            'reservations' => $reservations,
            'filters' => $request->only(['employee_id', 'room_id', 'date', 'period', 'status']),
            'rooms' => Room::select('id', 'room_number', 'type')->get(),
            'statuses' => Reservation::STATUSES,
            'isAdmin' => $isAdmin
        ];

        // Ajouter la liste des employés seulement pour les admins
        if ($isAdmin) {
            $data['employees'] = User::select('id', 'name', 'first_name', 'employee_number')
                                    ->whereNotNull('employee_number')
                                    ->orderBy('name')
                                    ->get();
        }

        return Inertia::render('Reservations/Index', $data);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(Request $request)
    {
        // Rediriger vers la page des salles avec le paramètre de salle si spécifié
        $roomId = $request->input('room_id');
        if ($roomId) {
            return redirect()->route('rooms.index', ['reserve' => $roomId]);
        }

        return redirect()->route('rooms.index');
    }

    /**
     * Normalize time format from HH:MM:SS to HH:MM
     */
    private function normalizeTimeFormat(string $time): string
    {
        return strlen($time) > 5 ? substr($time, 0, 5) : $time;
    }

    /**
     * Validate time format with regex
     */
    private function validateTimeFormat(string $time, string $label): ?object
    {
        if (!preg_match(self::TIME_FORMAT_REGEX, $time)) {
            Log::error("❌ Format invalide $label: " . $time);
            return back()->with('error', "Format d'heure $label invalide (HH:MM).");
        }
        return null;
    }

    /**
     * Get comparison result for logging
     */
    private function getComparisonResult($start, $end): string
    {
        if ($start < $end) {
            return 'start < end (OK)';
        }
        if ($start > $end) {
            return 'start > end (INVERSÉ)';
        }
        return 'start == end (ÉGAL)';
    }

    /**
     * Parse and correct times, swap if inverted
     */
    private function parseAndCorrectTimes(string $rawStartTime, string $rawEndTime, string $context): ?array
    {
        $startTime = trim($rawStartTime);
        $endTime = trim($rawEndTime);

        Log::info("📥 $context - ÉTAPE 2a: Avant parsing DateTime", [
            'startTime_to_parse' => $startTime,
            'endTime_to_parse' => $endTime,
        ]);

        $start = \DateTime::createFromFormat('H:i', $startTime);
        $end = \DateTime::createFromFormat('H:i', $endTime);

        if (!$start || !$end) {
            Log::error('❌ Impossible de parser les heures', [
                'start_time' => $startTime,
                'end_time' => $endTime,
                'start_parse_result' => $start ? 'OK' : 'FAIL',
                'end_parse_result' => $end ? 'OK' : 'FAIL'
            ]);
            return null;
        }

        Log::info("🔍 $context - Heures parsées correctement", [
            'start_time' => $startTime,
            'end_time' => $endTime,
            'comparison_result' => $this->getComparisonResult($start, $end)
        ]);

        // Corriger les heures inversées
        if ($start > $end) {
            $temp = $startTime;
            $startTime = $endTime;
            $endTime = $temp;

            Log::warning("⚠️ CORRECTION BACKEND ($context): Heures inversées corrigées", [
                'after_start' => $startTime,
                'after_end' => $endTime
            ]);
        }

        return [$startTime, $endTime];
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        Log::info('📥 STORE - ÉTAPE 0: Données reçues brutes', [
            'all_request_data' => $request->all(),
            'raw_start_time' => $request->start_time,
            'raw_end_time' => $request->end_time,
            'raw_date' => $request->date,
        ]);

        // ✅ ÉTAPE 0: Normaliser les heures (accepter HH:MM et HH:MM:SS)
        $rawStartTime = $this->normalizeTimeFormat($request->start_time);
        $rawEndTime = $this->normalizeTimeFormat($request->end_time);

        Log::info('📥 STORE - ÉTAPE 0: Après normalisation', [
            'normalizedStartTime' => $rawStartTime,
            'normalizedEndTime' => $rawEndTime,
        ]);

        // ✅ ÉTAPE 1: Validation de FORMAT avec regex strict
        $validationError = $this->validateTimeFormat($rawStartTime, 'de début');
        if ($validationError) {
            return $validationError;
        }
        $validationError = $this->validateTimeFormat($rawEndTime, 'de fin');
        if ($validationError) {
            return $validationError;
        }

        Log::info('📥 STORE - ÉTAPE 1: Validation format OK', [
            'startTime_format' => 'OK',
            'endTime_format' => 'OK',
        ]);

        $request->validate([
            'employee_id' => 'required|exists:users,id',
            'room_id' => 'required|exists:rooms,id',
            'date' => 'required|date|after_or_equal:today',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i',
            'purpose' => 'nullable|string|max:255',
            'notes' => 'nullable|string|max:1000',
        ]);

        Log::info('📥 STORE - ÉTAPE 1b: Validation Laravel OK');

        // ✅ ÉTAPE 2: Parser les heures avec vérification stricte
        $timesParsed = $this->parseAndCorrectTimes($rawStartTime, $rawEndTime, 'STORE');
        if (!$timesParsed) {
            return back()->with('error', 'Erreur lors du traitement des heures.');
        }
        [$startTime, $endTime] = $timesParsed;

        // ✅ ÉTAPE 4: Vérification finale (ne devrait jamais arriver ici si correction marche)
        if ($startTime >= $endTime) {
            Log::error('❌ ERREUR: Les heures sont toujours égales ou inversées après correction!', [
                'start_time' => $startTime,
                'end_time' => $endTime
            ]);
            return back()->with('error', 'Erreur de durée: l\'heure de fin doit être après l\'heure de début.');
        }

        Log::info('✅ STORE - Heures validées', [
            'final_start_time' => $startTime,
            'final_end_time' => $endTime
        ]);

        // ✅ ÉTAPE 4: Validation personnalisée pour vérifier les conflits avec heures CORRIGÉES
        $request->validate([
            'room_id' => [
                new RoomAvailable(
                    $request->room_id,
                    $request->date,
                    $startTime,
                    $endTime
                )
            ],
            'employee_id' => [
                new EmployeeAvailable(
                    $request->employee_id,
                    $request->date,
                    $startTime,
                    $endTime
                )
            ]
        ]);

        // ✅ ÉTAPE 5: Calculer la durée avec heures CORRIGÉES
        // ⚠️ IMPORTANT: Utiliser createFromFormat avec une date commune pour éviter les décalages
        $today = $request->date ?? now()->toDateString();
        $start = \DateTime::createFromFormat(self::DATETIME_FORMAT, "$today $startTime");
        $end = \DateTime::createFromFormat(self::DATETIME_FORMAT, "$today $endTime");
        $durationMinutes = ($end->getTimestamp() - $start->getTimestamp()) / 60;

        Log::info('💾 STORE - ÉTAPE 5a: Avant sauvegarde en BD', [
            'employee_id' => $request->employee_id,
            'room_id' => $request->room_id,
            'date' => $request->date,
            'start_time' => $startTime,
            'end_time' => $endTime,
            'duration_minutes' => $durationMinutes,
            'purpose' => $request->purpose,
            'status' => 'confirmed',
            'notes' => $request->notes,
        ]);

        $reservation = Reservation::create([
            'employee_id' => $request->employee_id,
            'room_id' => $request->room_id,
            'date' => $request->date,
            'start_time' => $startTime,         // ✅ HEURES CORRIGÉES
            'end_time' => $endTime,             // ✅ HEURES CORRIGÉES
            'duration_minutes' => $durationMinutes,
            'purpose' => $request->purpose,
            'status' => 'confirmed',
            'notes' => $request->notes,
        ]);

        Log::info('✅ STORE - ÉTAPE 5b: Réservation créée avec succès', [
            'id' => $reservation->id,
            'employee_id' => $reservation->employee_id,
            'room_id' => $reservation->room_id,
            'date' => $reservation->date,
            'start_time' => $reservation->start_time,
            'end_time' => $reservation->end_time,
            'duration_minutes' => $reservation->duration_minutes,
            'purpose' => $reservation->purpose,
            'status' => $reservation->status,
            'created_at' => $reservation->created_at,
        ]);

        Log::info('✅ STORE - ÉTAPE 5c: Vérification post-sauvegarde', [
            'bd_start_time_matches' => $reservation->start_time === $startTime ? 'YES' : 'NO',
            'bd_end_time_matches' => $reservation->end_time === $endTime ? 'YES' : 'NO',
            'expected_start' => $startTime,
            'expected_end' => $endTime,
            'actual_start' => $reservation->start_time,
            'actual_end' => $reservation->end_time,
        ]);

        return redirect()->route('reservations.index')
                        ->with('success', 'Réservation créée avec succès.');
    }

    /**
     * Display the specified resource.
     * Redirige vers l'index car la visualisation se fait via modal.
     */
    public function show(Reservation $reservation)
    {
        // Redirection vers la liste des réservations
        // La visualisation se fait maintenant via modal dans l'index
        return redirect()->route('reservations.index')
                        ->with('info', 'Utilisez le bouton "Voir" dans la liste pour consulter une réservation.');
    }

    /**
     * Show the form for editing the specified resource.
     * Redirige vers l'index car l'édition se fait via modal.
     */
    public function edit(Reservation $reservation)
    {
        // Redirection vers la liste des réservations
        // L'édition se fait maintenant via modal dans l'index
        return redirect()->route('reservations.index')
                        ->with('info', 'Utilisez le bouton "Modifier" dans la liste pour éditer une réservation.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Reservation $reservation)
    {
        if (!$reservation->canBeModified()) {
            return back()->with('error', 'Cette réservation ne peut plus être modifiée.');
        }

        Log::info('📥 UPDATE - Données reçues', [
            'raw_start_time' => $request->start_time,
            'raw_end_time' => $request->end_time,
            'raw_date' => $request->date,
            'reservation_id' => $reservation->id
        ]);

        // ✅ ÉTAPE 0: Normaliser les heures (accepter HH:MM et HH:MM:SS)
        $rawStartTime = $this->normalizeTimeFormat($request->start_time);
        $rawEndTime = $this->normalizeTimeFormat($request->end_time);

        // ✅ ÉTAPE 1: Validation de FORMAT avec regex strict
        $validationError = $this->validateTimeFormat($rawStartTime, 'de début');
        if ($validationError) {
            return $validationError;
        }
        $validationError = $this->validateTimeFormat($rawEndTime, 'de fin');
        if ($validationError) {
            return $validationError;
        }

        $request->validate([
            'employee_id' => 'required|exists:users,id',
            'room_id' => 'required|exists:rooms,id',
            'date' => 'required|date|after_or_equal:today',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i',
            'purpose' => 'nullable|string|max:255',
            'status' => 'required|in:' . implode(',', array_keys(Reservation::STATUSES)),
            'notes' => 'nullable|string|max:1000',
        ]);

        // ✅ ÉTAPE 2: Parser les heures avec vérification stricte
        $timesParsed = $this->parseAndCorrectTimes($rawStartTime, $rawEndTime, 'UPDATE');
        if (!$timesParsed) {
            return back()->with('error', 'Erreur lors du traitement des heures.');
        }
        [$startTime, $endTime] = $timesParsed;

        // ✅ ÉTAPE 4: Vérification finale (ne devrait jamais arriver ici si correction marche)
        if ($startTime >= $endTime) {
            Log::error('❌ ERREUR: Les heures sont toujours égales ou inversées après correction!', [
                'start_time' => $startTime,
                'end_time' => $endTime
            ]);
            return back()->with('error', 'Erreur de durée: l\'heure de fin doit être après l\'heure de début.');
        }

        Log::info('✅ UPDATE - Heures validées', [
            'final_start_time' => $startTime,
            'final_end_time' => $endTime
        ]);

        // ✅ ÉTAPE 5: Validation personnalisée pour vérifier les conflits avec heures CORRIGÉES
        $request->validate([
            'room_id' => [
                new RoomAvailable(
                    $request->room_id,
                    $request->date,
                    $startTime,
                    $endTime,
                    $reservation->id
                )
            ],
            'employee_id' => [
                new EmployeeAvailable(
                    $request->employee_id,
                    $request->date,
                    $startTime,
                    $endTime,
                    $reservation->id
                )
            ]
        ]);

        // ✅ ÉTAPE 6: Calculer la durée avec heures CORRIGÉES
        // ⚠️ IMPORTANT: Utiliser createFromFormat avec une date commune pour éviter les décalages
        $today = $request->date ?? now()->toDateString();
        $start = \DateTime::createFromFormat(self::DATETIME_FORMAT, "$today $startTime");
        $end = \DateTime::createFromFormat(self::DATETIME_FORMAT, "$today $endTime");
        $durationMinutes = ($end->getTimestamp() - $start->getTimestamp()) / 60;

        Log::info('💾 UPDATE - Avant sauvegarde en BD', [
            'start_time' => $startTime,
            'end_time' => $endTime,
            'duration_minutes' => $durationMinutes,
            'date' => $request->date,
            'reservation_id' => $reservation->id
        ]);

        $reservation->update([
            'employee_id' => $request->employee_id,
            'room_id' => $request->room_id,
            'date' => $request->date,
            'start_time' => $startTime,         // ✅ HEURES CORRIGÉES
            'end_time' => $endTime,             // ✅ HEURES CORRIGÉES
            'duration_minutes' => $durationMinutes,
            'purpose' => $request->purpose,
            'status' => $request->status,
            'notes' => $request->notes,
        ]);

        Log::info('✅ UPDATE - Réservation mise à jour avec succès', [
            'id' => $reservation->id,
            'start_time' => $reservation->start_time,
            'end_time' => $reservation->end_time,
            'duration_minutes' => $reservation->duration_minutes
        ]);

        return redirect()->route('reservations.index')
                        ->with('success', 'Réservation mise à jour avec succès.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Reservation $reservation)
    {
        if (!$reservation->canBeCancelled()) {
            return back()->with('error', 'Cette réservation ne peut plus être annulée.');
        }

        $reservation->delete();

        return redirect()->route('reservations.index')
                        ->with('success', 'Réservation supprimée avec succès.');
    }

    /**
     * Annuler une réservation
     */
    public function cancel(Reservation $reservation)
    {
        if (!$reservation->canBeCancelled()) {
            return back()->with('error', 'Cette réservation ne peut plus être annulée.');
        }

        $reservation->update(['status' => 'cancelled']);

        return back()->with('success', 'Réservation annulée avec succès.');
    }

    /**
     * Afficher le calendrier des réservations
     */
    public function calendar(Request $request)
    {
        $month = $request->get('month', now()->month);
        $year = $request->get('year', now()->year);

        $reservations = Reservation::with(['employee', 'room'])
            ->whereMonth('date', $month)
            ->whereYear('date', $year)
            ->get();

        return Inertia::render('Reservations/Calendar', [
            'reservations' => $reservations,
            'currentMonth' => $month,
            'currentYear' => $year
        ]);
    }
}
