<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $room_number
 * @property int $capacity
 * @property string $type
 * @property string|null $description
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Reservation> $reservations
 * @property-read string $type_name
 */
class Room extends Model
{
    use HasFactory;

    protected $fillable = [
        'room_number',
        'capacity',
        'type',
        'description'
    ];

    // Types de salles possibles
    const TYPES = [
        'conference' => 'Salle de conférence',
        'office' => 'Bureau',
        'training' => 'Salle de formation'
    ];

    /**
     * Relation avec les réservations
     */
    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class);
    }

    /**
     * Vérifier si la salle est disponible à une date/heure donnée
     */
    public function isAvailable($date, $startTime, $endTime, $excludeReservationId = null)
    {
        $query = $this->reservations()
            ->where('date', $date)
            ->where(function ($q) use ($startTime, $endTime) {
                $q->where(function ($query) use ($startTime, $endTime) {
                    // Nouvelle réservation commence pendant une réservation existante
                    $query->where('start_time', '<=', $startTime)
                          ->where('end_time', '>', $startTime);
                })->orWhere(function ($query) use ($startTime, $endTime) {
                    // Nouvelle réservation finit pendant une réservation existante
                    $query->where('start_time', '<', $endTime)
                          ->where('end_time', '>=', $endTime);
                })->orWhere(function ($query) use ($startTime, $endTime) {
                    // Nouvelle réservation englobe une réservation existante
                    $query->where('start_time', '>=', $startTime)
                          ->where('end_time', '<=', $endTime);
                });
            });

        if ($excludeReservationId) {
            $query->where('id', '!=', $excludeReservationId);
        }

        return $query->count() === 0;
    }

    /**
     * Obtenir le nom du type de salle
     */
    public function getTypeNameAttribute()
    {
        return self::TYPES[$this->type] ?? $this->type;
    }

    /**
     * Scope pour filtrer par type
     */
    public function scopeOfType($query, $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Scope pour filtrer par capacité minimale
     */
    public function scopeWithMinCapacity($query, $minCapacity)
    {
        return $query->where('capacity', '>=', $minCapacity);
    }
}
