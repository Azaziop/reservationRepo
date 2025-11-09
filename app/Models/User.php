<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Notifications\ResetPasswordNotification;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $name
 * @property string $first_name
 * @property string $employee_number
 * @property string $department
 * @property string $email
 * @property string $role
 * @property \Illuminate\Support\Carbon|null $email_verified_at
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Reservation> $reservations
 * @property-read string $full_name
 */
class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'first_name',
        'department',
        'employee_number',
        'email',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    /**
     * Send the password reset notification.
     *
     * @param  string  $token
     * @return void
     */
    public function sendPasswordResetNotification($token)
    {
        $this->notify(new ResetPasswordNotification($token));
    }

    /**
     * Relation avec les réservations créées par cet employé
     */
    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class, 'employee_id');
    }

    /**
     * Obtenir le nom complet de l'employé
     */
    public function getFullNameAttribute()
    {
        return trim($this->first_name . ' ' . $this->name);
    }

    /**
     * Vérifier si l'employé peut réserver une salle à une heure donnée
     * (pas de chevauchement avec ses autres réservations)
     */
    public function canReserve($date, $startTime, $endTime, $excludeReservationId = null)
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
}
