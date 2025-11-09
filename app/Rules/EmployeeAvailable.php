<?php

namespace App\Rules;

use App\Models\User;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class EmployeeAvailable implements ValidationRule
{
    protected $employeeId;
    protected $date;
    protected $startTime;
    protected $endTime;
    protected $excludeReservationId;

    public function __construct($employeeId, $date, $startTime, $endTime, $excludeReservationId = null)
    {
        $this->employeeId = $employeeId;
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
        $employee = User::find($this->employeeId);

        if (!$employee) {
            $fail('L\'employé sélectionné n\'existe pas.');
            return;
        }

        if (!$employee->canReserve($this->date, $this->startTime, $this->endTime, $this->excludeReservationId)) {
            $fail('L\'employé a déjà une réservation qui se chevauche avec cette période.');
        }
    }
}
