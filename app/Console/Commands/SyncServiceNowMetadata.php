<?php

namespace App\Console\Commands;

use App\Models\Reservation;
use App\Services\ServiceNowService;
use Illuminate\Console\Command;

class SyncServiceNowMetadata extends Command
{
    protected $signature = 'servicenow:sync 
                            {--reservation_id= : Sync specific reservation}
                            {--all : Sync all reservations with ServiceNow incidents}
                            {--missing : Create incidents for reservations without them}';

    protected $description = 'Sync metadata between reservations and ServiceNow incidents';

    public function handle(): int
    {
        /** @var ServiceNowService $serviceNow */
        $serviceNow = app(ServiceNowService::class);

        if (!$serviceNow->isEnabled()) {
            $this->error('ServiceNow integration is disabled.');
            return self::FAILURE;
        }

        // Sync specific reservation
        if ($this->option('reservation_id')) {
            return $this->syncSpecificReservation($this->option('reservation_id'), $serviceNow);
        }

        // Create incidents for reservations without them
        if ($this->option('missing')) {
            return $this->createMissingIncidents($serviceNow);
        }

        // Sync all reservations
        if ($this->option('all')) {
            return $this->syncAllReservations($serviceNow);
        }

        $this->info('Please specify an option: --reservation_id, --all, or --missing');
        return self::FAILURE;
    }

    protected function syncSpecificReservation(int $reservationId, ServiceNowService $serviceNow): int
    {
        $reservation = Reservation::with(['room', 'employee'])->find($reservationId);

        if (!$reservation) {
            $this->error("Reservation not found: ID {$reservationId}");
            return self::FAILURE;
        }

        if (!$reservation->servicenow_sys_id) {
            $this->warn("Reservation {$reservationId} has no ServiceNow incident. Creating one...");
            $incident = $serviceNow->createReservationIncident($reservation);
            
            if ($incident) {
                $this->info("Created incident: {$incident['number']}");
                return self::SUCCESS;
            } else {
                $this->error('Failed to create incident.');
                return self::FAILURE;
            }
        }

        $this->info("Syncing reservation {$reservationId} with ServiceNow...");
        
        if ($serviceNow->syncMetadata($reservation)) {
            $this->info("✓ Synced successfully");
            $this->line("  Incident: {$reservation->servicenow_incident_number}");
            $this->line("  Last synced: {$reservation->servicenow_synced_at}");
            return self::SUCCESS;
        }

        $this->error('Sync failed.');
        return self::FAILURE;
    }

    protected function syncAllReservations(ServiceNowService $serviceNow): int
    {
        $reservations = Reservation::syncedWithServiceNow()
            ->with(['room', 'employee'])
            ->get();

        if ($reservations->isEmpty()) {
            $this->info('No reservations with ServiceNow incidents found.');
            return self::SUCCESS;
        }

        $this->info("Found {$reservations->count()} reservations to sync...");
        $bar = $this->output->createProgressBar($reservations->count());

        $synced = 0;
        $failed = 0;

        foreach ($reservations as $reservation) {
            if ($serviceNow->syncMetadata($reservation)) {
                $synced++;
            } else {
                $failed++;
            }
            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);

        $this->info("✓ Synced: {$synced}");
        if ($failed > 0) {
            $this->warn("✗ Failed: {$failed}");
        }

        return self::SUCCESS;
    }

    protected function createMissingIncidents(ServiceNowService $serviceNow): int
    {
        $reservations = Reservation::notSyncedWithServiceNow()
            ->where('status', '!=', 'cancelled')
            ->with(['room', 'employee'])
            ->get();

        if ($reservations->isEmpty()) {
            $this->info('All reservations have ServiceNow incidents.');
            return self::SUCCESS;
        }

        $this->info("Found {$reservations->count()} reservations without incidents...");
        
        if (!$this->confirm('Create incidents for these reservations?')) {
            return self::SUCCESS;
        }

        $bar = $this->output->createProgressBar($reservations->count());

        $created = 0;
        $failed = 0;

        foreach ($reservations as $reservation) {
            $incident = $serviceNow->createReservationIncident($reservation);
            
            if ($incident) {
                $created++;
            } else {
                $failed++;
            }
            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);

        $this->info("✓ Created: {$created}");
        if ($failed > 0) {
            $this->warn("✗ Failed: {$failed}");
        }

        return self::SUCCESS;
    }
}
