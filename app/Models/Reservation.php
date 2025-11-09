<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

/**
 * @property int $id
 * @property int $employee_id
 * @property int $room_id
 * @property \Illuminate\Support\Carbon $date
 * @property string $start_time
 * @property string $end_time
 * @property int $duration_minutes
 * @property string|null $purpose
 * @property string $status
 * @property string|null $notes
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\User $employee
 * @property-read \App\Models\Room $room
 * @property-read string $status_name
 * @property-read string $formatted_duration
 */
class Reservation extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'room_id',
        'date',
        'start_time',
        'end_time',
        'duration_minutes',
        'purpose',
        'status',
        'notes'
    ];

    protected $casts = [
        'date' => 'date',
    ];

    protected $appends = [
        'formatted_start_time',
        'formatted_end_time',
        'formatted_duration'
    ];

    /**
     * Accesseur pour l'heure de début formatée
     */
    public function getFormattedStartTimeAttribute()
    {
        if (!$this->start_time) return null;

        // Si c'est déjà une chaîne au format HH:MM, la retourner
        if (is_string($this->start_time) && strlen($this->start_time) <= 8) {
            return substr($this->start_time, 0, 5);
        }

        // Sinon, parser comme datetime et formater
        return \Carbon\Carbon::parse($this->start_time)->format('H:i');
    }

    /**
     * Accesseur pour l'heure de fin formatée
     */
    public function getFormattedEndTimeAttribute()
    {
        if (!$this->end_time) return null;

        // Si c'est déjà une chaîne au format HH:MM, la retourner
        if (is_string($this->end_time) && strlen($this->end_time) <= 8) {
            return substr($this->end_time, 0, 5);
        }

        // Sinon, parser comme datetime et formater
        return \Carbon\Carbon::parse($this->end_time)->format('H:i');
    }

    // Status possibles pour une réservation
    const STATUSES = [
        'pending' => 'En attente',
        'confirmed' => 'Confirmée',
        'cancelled' => 'Annulée',
        'completed' => 'Terminée'
    ];

    /**
     * Relation avec l'employé qui a fait la réservation
     */
    public function employee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'employee_id');
    }

    /**
     * Relation avec la salle réservée
     */
    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    /**
     * Calculer automatiquement la durée en minutes
     */
    public function calculateDuration()
    {
        if ($this->start_time && $this->end_time) {
            $start = Carbon::parse($this->start_time);
            $end = Carbon::parse($this->end_time);
            $this->duration_minutes = $end->diffInMinutes($start);
        }
    }

    /**
     * Mutateur pour calculer automatiquement l'heure de fin
     * ⚠️ DÉSACTIVÉ: Ce mutateur interfère avec les updates et cause des transformations
     * Les heures (start_time et end_time) sont maintenant gérées explicitement
     * en Backend dans ReservationController
     */
    public function setDurationMinutesAttribute($value)
    {
        // MODIFICATION: Ne pas auto-calculer end_time, laisser le controller gérer
        $this->attributes['duration_minutes'] = $value;

        // ❌ Pas d'auto-calcul d'end_time ici pour éviter les transformations involontaires
        // Le controller calcule la durée à partir de start_time et end_time valides
    }

    /**
     * Vérifier si la réservation est en conflit avec d'autres réservations
     */
    public function hasConflict($excludeId = null)
    {
        // Vérifier conflit avec la salle
        $roomConflict = !$this->room->isAvailable(
            $this->date,
            $this->start_time,
            $this->end_time,
            $excludeId
        );

        // Vérifier conflit avec l'employé
        $employeeConflict = !$this->employee->canReserve(
            $this->date,
            $this->start_time,
            $this->end_time,
            $excludeId
        );

        return $roomConflict || $employeeConflict;
    }

    /**
     * Scope pour les réservations du jour
     */
    public function scopeToday($query)
    {
        return $query->where('date', now()->toDateString());
    }

    /**
     * Scope pour les réservations à venir
     */
    public function scopeUpcoming($query)
    {
        return $query->where('date', '>=', now()->toDateString())
                    ->orderBy('date')
                    ->orderBy('start_time');
    }

    /**
     * Scope pour les réservations passées
     */
    public function scopePast($query)
    {
        return $query->where('date', '<', now()->toDateString())
                    ->orderBy('date', 'desc')
                    ->orderBy('start_time', 'desc');
    }

    /**
     * Scope pour filtrer par statut
     */
    public function scopeWithStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Obtenir le nom du statut
     */
    public function getStatusNameAttribute()
    {
        return self::STATUSES[$this->status] ?? $this->status;
    }

    /**
     * Vérifier si la réservation peut être modifiée
     */
    public function canBeModified()
    {
        return $this->status !== 'cancelled' &&
               $this->status !== 'completed' &&
               $this->date >= now()->toDateString();
    }

    /**
     * Vérifier si la réservation peut être annulée
     */
    public function canBeCancelled()
    {
        return $this->status !== 'cancelled' &&
               $this->status !== 'completed' &&
               $this->date >= now()->toDateString();
    }

    /**
     * Obtenir la durée formatée
     */
    public function getFormattedDurationAttribute()
    {
        if (!$this->duration_minutes) {
            return '';
        }

        $hours = floor($this->duration_minutes / 60);
        $minutes = $this->duration_minutes % 60;

        if ($hours > 0 && $minutes > 0) {
            return "{$hours}h {$minutes}min";
        } elseif ($hours > 0) {
            return "{$hours}h";
        } else {
            return "{$minutes}min";
        }
    }
}
