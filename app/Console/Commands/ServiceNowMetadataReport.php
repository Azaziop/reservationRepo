<?php

namespace App\Console\Commands;

use App\Models\Reservation;
use App\Services\ServiceNowService;
use Illuminate\Console\Command;

class ServiceNowMetadataReport extends Command
{
    protected $signature = 'servicenow:report 
                            {--format=table : Output format (table, json, csv)}
                            {--filter= : Filter by status (synced, not_synced, all)}';

    protected $description = 'Generate a report of ServiceNow metadata for reservations';

    public function handle(): int
    {
        $filter = $this->option('filter') ?? 'all';
        $format = $this->option('format') ?? 'table';

        $query = Reservation::with(['room', 'employee']);

        switch ($filter) {
            case 'synced':
                $query->syncedWithServiceNow();
                break;
            case 'not_synced':
                $query->notSyncedWithServiceNow();
                break;
        }

        $reservations = $query->orderBy('created_at', 'desc')->get();

        if ($reservations->isEmpty()) {
            $this->info('No reservations found.');
            return self::SUCCESS;
        }

        switch ($format) {
            case 'json':
                $this->outputJson($reservations);
                break;
            case 'csv':
                $this->outputCsv($reservations);
                break;
            default:
                $this->outputTable($reservations);
        }

        return self::SUCCESS;
    }

    protected function outputTable($reservations): void
    {
        $headers = [
            'ID',
            'Room',
            'Employee',
            'Date',
            'Time',
            'Status',
            'Incident #',
            'Synced At',
        ];

        $rows = $reservations->map(function ($reservation) {
            return [
                $reservation->id,
                $reservation->room->room_number ?? 'N/A',
                $reservation->employee->name ?? 'N/A',
                $reservation->date->format('Y-m-d'),
                "{$reservation->formatted_start_time} - {$reservation->formatted_end_time}",
                $reservation->status,
                $reservation->servicenow_incident_number ?? '-',
                $reservation->servicenow_synced_at ? $reservation->servicenow_synced_at->format('Y-m-d H:i') : '-',
            ];
        });

        $this->table($headers, $rows);

        $this->newLine();
        $this->info("Total: {$reservations->count()}");
        $synced = $reservations->where('servicenow_sys_id', '!=', null)->count();
        $this->info("Synced with ServiceNow: {$synced}");
        $this->info("Not synced: " . ($reservations->count() - $synced));
    }

    protected function outputJson($reservations): void
    {
        $data = $reservations->map(function ($reservation) {
            return [
                'id' => $reservation->id,
                'room' => [
                    'id' => $reservation->room->id,
                    'number' => $reservation->room->room_number,
                ],
                'employee' => [
                    'id' => $reservation->employee->id,
                    'name' => $reservation->employee->name,
                    'email' => $reservation->employee->email,
                ],
                'date' => $reservation->date->format('Y-m-d'),
                'start_time' => $reservation->start_time,
                'end_time' => $reservation->end_time,
                'status' => $reservation->status,
                'servicenow' => [
                    'incident_number' => $reservation->servicenow_incident_number,
                    'sys_id' => $reservation->servicenow_sys_id,
                    'url' => $reservation->servicenow_url,
                    'metadata' => $reservation->servicenow_metadata,
                    'synced_at' => $reservation->servicenow_synced_at?->toIso8601String(),
                ],
            ];
        });

        $this->line(json_encode($data, JSON_PRETTY_PRINT));
    }

    protected function outputCsv($reservations): void
    {
        $this->line('ID,Room,Employee,Date,Start Time,End Time,Status,Incident Number,Sys ID,Synced At');

        foreach ($reservations as $reservation) {
            $this->line(implode(',', [
                $reservation->id,
                $reservation->room->room_number ?? 'N/A',
                $reservation->employee->name ?? 'N/A',
                $reservation->date->format('Y-m-d'),
                $reservation->start_time,
                $reservation->end_time,
                $reservation->status,
                $reservation->servicenow_incident_number ?? '',
                $reservation->servicenow_sys_id ?? '',
                $reservation->servicenow_synced_at ? $reservation->servicenow_synced_at->format('Y-m-d H:i:s') : '',
            ]));
        }
    }
}
