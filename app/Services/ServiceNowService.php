<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Models\Reservation;

class ServiceNowService
{
    protected $baseUrl;
    protected $username;
    protected $password;
    protected $enabled;

    public function __construct()
    {
        $this->enabled = config('servicenow.enabled', false);
        $this->baseUrl = config('servicenow.api.base_url');
        $this->username = config('servicenow.credentials.username');
        $this->password = config('servicenow.credentials.password');
    }

    /**
     * Check if ServiceNow integration is enabled
     */
    public function isEnabled(): bool
    {
        return $this->enabled && !empty($this->baseUrl) && !empty($this->username);
    }

    /**
     * Create an incident in ServiceNow for a new reservation
     */
    public function createReservationIncident(Reservation $reservation): ?array
    {
        if (!$this->isEnabled()) {
            Log::info('ServiceNow integration is disabled');
            return null;
        }

        if (!config('servicenow.events.create_on_reservation')) {
            return null;
        }

        $data = [
            'short_description' => "New Room Reservation: {$reservation->room->name}",
            'description' => $this->buildReservationDescription($reservation),
            'category' => config('servicenow.incident.category'),
            'subcategory' => config('servicenow.incident.subcategory'),
            'urgency' => config('servicenow.incident.urgency'),
            'impact' => config('servicenow.incident.impact'),
            'caller_id' => config('servicenow.incident.caller_id'),
            'assignment_group' => config('servicenow.incident.assignment_group'),
            'u_reservation_id' => (string) $reservation->id,
            'u_room_number' => $reservation->room->room_number ?? '',
            'u_employee_number' => $reservation->employee->employee_number ?? '',
        ];

        $result = $this->createIncident($data);
        
        if ($result) {
            $this->updateReservationMetadata($reservation, $result);
        }
        
        return $result;
    }

    /**
     * Create an incident in ServiceNow for a cancelled reservation
     */
    public function createCancellationIncident(Reservation $reservation): ?array
    {
        if (!$this->isEnabled()) {
            return null;
        }

        if (!config('servicenow.events.create_on_cancellation')) {
            return null;
        }

        $data = [
            'short_description' => "Room Reservation Cancelled: {$reservation->room->name}",
            'description' => $this->buildCancellationDescription($reservation),
            'category' => config('servicenow.incident.category'),
            'subcategory' => config('servicenow.incident.subcategory'),
            'urgency' => config('servicenow.incident.urgency'),
            'impact' => config('servicenow.incident.impact'),
            'caller_id' => config('servicenow.incident.caller_id'),
            'assignment_group' => config('servicenow.incident.assignment_group'),
        ];

        return $this->createIncident($data);
    }

    /**
     * Create an incident in ServiceNow
     */
    protected function createIncident(array $data): ?array
    {
        try {
            $response = Http::withBasicAuth($this->username, $this->password)
                ->timeout(config('servicenow.api.timeout'))
                ->acceptJson()
                ->post("{$this->baseUrl}/table/incident", $data);

            if ($response->successful()) {
                Log::info('ServiceNow incident created successfully', [
                    'incident_number' => $response->json('result.number'),
                    'sys_id' => $response->json('result.sys_id'),
                ]);

                return $response->json('result');
            }

            Log::error('Failed to create ServiceNow incident', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return null;
        } catch (\Exception $e) {
            Log::error('ServiceNow API error', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return null;
        }
    }

    /**
     * Build description for reservation incident
     */
    protected function buildReservationDescription(Reservation $reservation): string
    {
        return sprintf(
            "A new room reservation has been created:\n\n" .
            "Room: %s\n" .
            "Employee: %s (%s)\n" .
            "Start: %s\n" .
            "End: %s\n" .
            "Status: %s\n" .
            "Created: %s",
            $reservation->room->name,
            $reservation->employee->name,
            $reservation->employee->email,
            $reservation->start_time,
            $reservation->end_time,
            $reservation->status,
            $reservation->created_at
        );
    }

    /**
     * Build description for cancellation incident
     */
    protected function buildCancellationDescription(Reservation $reservation): string
    {
        return sprintf(
            "A room reservation has been cancelled:\n\n" .
            "Room: %s\n" .
            "Employee: %s (%s)\n" .
            "Start: %s\n" .
            "End: %s\n" .
            "Cancelled: %s",
            $reservation->room->name,
            $reservation->employee->name,
            $reservation->employee->email,
            $reservation->start_time,
            $reservation->end_time,
            now()
        );
    }

    /**
     * Get incident by sys_id
     */
    public function getIncident(string $sysId): ?array
    {
        if (!$this->isEnabled()) {
            return null;
        }

        try {
            $response = Http::withBasicAuth($this->username, $this->password)
                ->timeout(config('servicenow.api.timeout'))
                ->acceptJson()
                ->get("{$this->baseUrl}/table/incident/{$sysId}");

            if ($response->successful()) {
                return $response->json('result');
            }

            return null;
        } catch (\Exception $e) {
            Log::error('Failed to get ServiceNow incident', [
                'sys_id' => $sysId,
                'message' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * Update an incident in ServiceNow
     */
    public function updateIncident(string $sysId, array $data): ?array
    {
        if (!$this->isEnabled()) {
            return null;
        }

        try {
            $response = Http::withBasicAuth($this->username, $this->password)
                ->timeout(config('servicenow.api.timeout'))
                ->acceptJson()
                ->patch("{$this->baseUrl}/table/incident/{$sysId}", $data);

            if ($response->successful()) {
                return $response->json('result');
            }

            return null;
        } catch (\Exception $e) {
            Log::error('Failed to update ServiceNow incident', [
                'sys_id' => $sysId,
                'message' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * Update reservation metadata after ServiceNow incident creation
     */
    protected function updateReservationMetadata(Reservation $reservation, array $incidentData): void
    {
        try {
            $reservation->update([
                'servicenow_incident_number' => $incidentData['number'] ?? null,
                'servicenow_sys_id' => $incidentData['sys_id'] ?? null,
                'servicenow_metadata' => [
                    'state' => $incidentData['state'] ?? null,
                    'priority' => $incidentData['priority'] ?? null,
                    'assigned_to' => $incidentData['assigned_to']['value'] ?? null,
                    'opened_at' => $incidentData['opened_at'] ?? null,
                    'sys_created_on' => $incidentData['sys_created_on'] ?? null,
                    'sys_updated_on' => $incidentData['sys_updated_on'] ?? null,
                ],
                'servicenow_synced_at' => now(),
            ]);

            Log::info('Updated reservation with ServiceNow metadata', [
                'reservation_id' => $reservation->id,
                'incident_number' => $incidentData['number'] ?? null,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to update reservation metadata', [
                'reservation_id' => $reservation->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Sync metadata from ServiceNow back to reservation
     */
    public function syncMetadata(Reservation $reservation): bool
    {
        if (!$reservation->servicenow_sys_id) {
            Log::warning('Cannot sync metadata: no sys_id', [
                'reservation_id' => $reservation->id,
            ]);
            return false;
        }

        $incident = $this->getIncident($reservation->servicenow_sys_id);

        if (!$incident) {
            return false;
        }

        $this->updateReservationMetadata($reservation, $incident);
        return true;
    }

    /**
     * Get all reservations metadata from ServiceNow
     */
    public function getReservationMetadata(string $reservationId): ?array
    {
        if (!$this->isEnabled()) {
            return null;
        }

        try {
            $response = Http::withBasicAuth($this->username, $this->password)
                ->timeout(config('servicenow.api.timeout'))
                ->acceptJson()
                ->get("{$this->baseUrl}/table/incident", [
                    'sysparm_query' => "u_reservation_id={$reservationId}",
                    'sysparm_limit' => 10,
                ]);

            if ($response->successful()) {
                return $response->json('result');
            }

            return null;
        } catch (\Exception $e) {
            Log::error('Failed to get reservation metadata from ServiceNow', [
                'reservation_id' => $reservationId,
                'message' => $e->getMessage(),
            ]);

            return null;
        }
    }
}
