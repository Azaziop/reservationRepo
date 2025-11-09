<?php

namespace App\Rules;

use App\Models\Room;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class RoomAvailable implements ValidationRule
{
    protected $roomId;
    protected $date;
    protected $startTime;
    protected $endTime;
    protected $excludeReservationId;

    public function __construct($roomId, $date, $startTime, $endTime, $excludeReservationId = null)
    {
        $this->roomId = $roomId;
        $this->date = $date;
        $this->startTime = $startTime;
        $this->endTime = $endTime;
        $this->excludeReservationId = $excludeReservationId;
    }

    /**
     * Run the validation rule.
     *
     * @param  \Closure(string, ?string=): \Illuminate\Translation\PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $room = Room::find($this->roomId);

        if (!$room) {
            $fail('La salle sélectionnée n\'existe pas.');
            return;
        }

        if (!$room->isAvailable($this->date, $this->startTime, $this->endTime, $this->excludeReservationId)) {
            $fail('La salle n\'est pas disponible pour cette période.');
        }
    }
}
