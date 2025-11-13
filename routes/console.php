<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use App\Services\ServiceNowService;
use App\Models\Reservation;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('servicenow:test {--reservation_id=} {--cancel}', function () {
    /** @var ServiceNowService $sn */
    $sn = app(ServiceNowService::class);

    if (!$sn->isEnabled()) {
        $this->error('ServiceNow integration is disabled or not configured.');
        return self::FAILURE;
    }

    $reservationId = $this->option('reservation_id');
    $cancel = (bool) $this->option('cancel');

    $reservation = null;
    if ($reservationId) {
        $reservation = Reservation::with(['room', 'employee'])->find($reservationId);
        if (!$reservation) {
            $this->error("Reservation not found: ID {$reservationId}");
            return self::FAILURE;
        }
    } else {
        $reservation = Reservation::with(['room', 'employee'])->latest()->first();
        if (!$reservation) {
            $this->error('No reservations found. Create one or pass --reservation_id=.');
            return self::FAILURE;
        }
    }

    $result = $cancel
        ? $sn->createCancellationIncident($reservation)
        : $sn->createReservationIncident($reservation);

    if ($result) {
        $this->info('ServiceNow incident created successfully.');
        $this->line('Incident Number: ' . ($result['number'] ?? 'n/a'));
        $this->line('Sys ID: ' . ($result['sys_id'] ?? 'n/a'));
        return self::SUCCESS;
    }

    $this->error('Failed to create ServiceNow incident. Check logs for details.');
    return self::FAILURE;
})->purpose('Create a test ServiceNow incident from the latest or specified reservation');
