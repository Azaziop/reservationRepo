# ServiceNow Metadata Integration

## Overview

This Laravel application now tracks and syncs metadata with ServiceNow incidents. Every reservation can be linked to a ServiceNow incident, and metadata is automatically synchronized bidirectionally.

## Features

- ✅ **Automatic Incident Creation**: When a new reservation is created, an incident is automatically created in ServiceNow
- ✅ **Metadata Storage**: ServiceNow incident data (number, sys_id, state, priority, timestamps) is stored in the database
- ✅ **Bidirectional Sync**: Pull latest incident status from ServiceNow back to reservations
- ✅ **Custom Fields**: Reservation ID, room number, and employee number are sent to ServiceNow
- ✅ **Reporting**: Generate reports of all metadata in table, JSON, or CSV format
- ✅ **Bulk Operations**: Sync all reservations or create missing incidents in batch

## Database Schema

New columns added to `reservations` table:

| Column | Type | Description |
|--------|------|-------------|
| `servicenow_incident_number` | `string` | The incident number (e.g., INC0010001) |
| `servicenow_sys_id` | `string` | The ServiceNow sys_id for direct API access |
| `servicenow_metadata` | `json` | Full incident metadata (state, priority, timestamps, etc.) |
| `servicenow_synced_at` | `timestamp` | Last time metadata was synced from ServiceNow |

Indexes are added on `servicenow_incident_number` and `servicenow_sys_id` for fast lookups.

## Configuration

### Environment Variables

```env
# ServiceNow Integration
SERVICENOW_ENABLED=true
SERVICENOW_INSTANCE=dev322015.service-now.com
SERVICENOW_USERNAME=admin
SERVICENOW_PASSWORD=your_password
SERVICENOW_CREATE_ON_RESERVATION=true
SERVICENOW_CREATE_ON_CANCELLATION=true
```

### Custom Fields in ServiceNow

The integration sends these custom fields (you may need to add them to your incident table):

- `u_reservation_id`: Laravel reservation ID
- `u_room_number`: Room number
- `u_employee_number`: Employee number

To add custom fields in ServiceNow:
1. Navigate to **System Definition > Tables**
2. Find and open **Incident [incident]**
3. Go to **Columns** tab
4. Create new columns with types: `String` for all three fields

## Usage

### Artisan Commands

#### 1. Test ServiceNow Connection

```bash
# Test with latest reservation
docker compose exec laravel.test php artisan servicenow:test

# Test with specific reservation
docker compose exec laravel.test php artisan servicenow:test --reservation_id=5

# Test cancellation incident
docker compose exec laravel.test php artisan servicenow:test --cancel
```

#### 2. Sync Metadata

```bash
# Sync specific reservation (pull latest data from ServiceNow)
docker compose exec laravel.test php artisan servicenow:sync --reservation_id=1

# Sync all reservations with ServiceNow incidents
docker compose exec laravel.test php artisan servicenow:sync --all

# Create incidents for reservations that don't have them
docker compose exec laravel.test php artisan servicenow:sync --missing
```

#### 3. Generate Reports

```bash
# Table format (default)
docker compose exec laravel.test php artisan servicenow:report

# JSON format
docker compose exec laravel.test php artisan servicenow:report --format=json

# CSV format
docker compose exec laravel.test php artisan servicenow:report --format=csv

# Filter by sync status
docker compose exec laravel.test php artisan servicenow:report --filter=synced
docker compose exec laravel.test php artisan servicenow:report --filter=not_synced
docker compose exec laravel.test php artisan servicenow:report --filter=all
```

### In Code

#### Check if Reservation is Synced

```php
$reservation = Reservation::find(1);

if ($reservation->isSyncedWithServiceNow()) {
    echo "Incident: " . $reservation->servicenow_incident_number;
    echo "URL: " . $reservation->servicenow_url;
}
```

#### Access Metadata

```php
$reservation = Reservation::find(1);

// Get full metadata
$metadata = $reservation->servicenow_metadata;
echo "State: " . $metadata['state'];
echo "Priority: " . $metadata['priority'];
echo "Last updated: " . $metadata['sys_updated_on'];

// Get direct properties
echo "Incident: " . $reservation->servicenow_incident_number;
echo "Sys ID: " . $reservation->servicenow_sys_id;
echo "Last synced: " . $reservation->servicenow_synced_at;
```

#### Query by Sync Status

```php
// Get all reservations with ServiceNow incidents
$synced = Reservation::syncedWithServiceNow()->get();

// Get reservations without incidents
$notSynced = Reservation::notSyncedWithServiceNow()->get();
```

#### Manual Sync

```php
$serviceNow = app(\App\Services\ServiceNowService::class);
$reservation = Reservation::find(1);

// Pull latest data from ServiceNow
$serviceNow->syncMetadata($reservation);

// Or create a new incident
$incident = $serviceNow->createReservationIncident($reservation);
```

#### Get All Incidents for a Reservation

```php
$serviceNow = app(\App\Services\ServiceNowService::class);

// Get all ServiceNow incidents linked to reservation ID 5
$incidents = $serviceNow->getReservationMetadata('5');

foreach ($incidents as $incident) {
    echo $incident['number'] . ": " . $incident['short_description'];
}
```

## Metadata Structure

The `servicenow_metadata` JSON field stores:

```json
{
  "state": "1",
  "priority": "5",
  "assigned_to": "sys_id_of_user",
  "opened_at": "2025-11-13 22:36:18",
  "sys_created_on": "2025-11-13 22:36:18",
  "sys_updated_on": "2025-11-13 22:37:53"
}
```

### ServiceNow State Values

| Value | Description |
|-------|-------------|
| 1 | New |
| 2 | In Progress |
| 3 | On Hold |
| 6 | Resolved |
| 7 | Closed |
| 8 | Canceled |

### Priority Values

| Value | Description |
|-------|-------------|
| 1 | Critical |
| 2 | High |
| 3 | Moderate |
| 4 | Low |
| 5 | Planning |

## Automation

### Scheduled Sync

Add to `routes/console.php` or scheduler:

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('servicenow:sync --all')->hourly();
```

### Webhook Integration (Future)

For real-time updates from ServiceNow → Laravel, create a webhook endpoint:

```php
// routes/api.php
Route::post('/webhooks/servicenow', [WebhookController::class, 'servicenow']);

// app/Http/Controllers/WebhookController.php
public function servicenow(Request $request)
{
    $incident = $request->json('record');
    $reservationId = $incident['u_reservation_id'] ?? null;
    
    if ($reservationId) {
        $reservation = Reservation::find($reservationId);
        if ($reservation) {
            $reservation->update([
                'servicenow_metadata' => [
                    'state' => $incident['state'],
                    'priority' => $incident['priority'],
                    // ...
                ],
                'servicenow_synced_at' => now(),
            ]);
        }
    }
    
    return response()->json(['status' => 'ok']);
}
```

## Troubleshooting

### Incident Creation Fails

Check logs:
```bash
docker compose exec laravel.test tail -f storage/logs/laravel.log
```

Common issues:
- **Authentication failure**: Check `SERVICENOW_USERNAME` and `SERVICENOW_PASSWORD`
- **Missing fields**: Ensure custom fields (`u_reservation_id`, etc.) exist in ServiceNow
- **Network timeout**: Increase timeout in `config/servicenow.php`

### Metadata Not Syncing

```bash
# Force sync specific reservation
docker compose exec laravel.test php artisan servicenow:sync --reservation_id=1

# Check if incident exists in ServiceNow
docker compose exec laravel.test php artisan tinker
>>> $r = \App\Models\Reservation::find(1);
>>> app(\App\Services\ServiceNowService::class)->getIncident($r->servicenow_sys_id);
```

### Missing Custom Fields Warning

If you see "Field does not exist" errors in ServiceNow logs, the custom fields need to be created:

1. Go to ServiceNow **System Definition > Tables > Incident**
2. Add columns: `u_reservation_id`, `u_room_number`, `u_employee_number`
3. Set type to **String** with max length 255

## API Examples

### Get Incident from ServiceNow

```php
use App\Services\ServiceNowService;

$service = app(ServiceNowService::class);
$incident = $service->getIncident('sys_id_here');

print_r($incident);
```

### Update Incident in ServiceNow

```php
$service->updateIncident('sys_id_here', [
    'state' => 2, // In Progress
    'work_notes' => 'Updated from Laravel',
]);
```

### Search Incidents by Reservation

```php
$incidents = $service->getReservationMetadata('5'); // Reservation ID
foreach ($incidents as $incident) {
    echo "{$incident['number']}: {$incident['state']}\n";
}
```

## Best Practices

1. **Batch Operations**: Use `servicenow:sync --all` during off-peak hours
2. **Error Handling**: ServiceNow failures don't block reservation creation
3. **Rate Limiting**: ServiceNow API has rate limits; avoid excessive sync operations
4. **Monitoring**: Set up alerts for sync failures in production
5. **Data Retention**: Consider archiving old metadata or scheduling cleanup

## Migration

If updating an existing system:

```bash
# Run migration to add columns
docker compose exec laravel.test php artisan migrate

# Create incidents for existing reservations
docker compose exec laravel.test php artisan servicenow:sync --missing

# Verify all reservations are synced
docker compose exec laravel.test php artisan servicenow:report
```

## Related Documentation

- [ServiceNow Integration](SERVICENOW_INTEGRATION.md) - Basic setup and usage
- [Docker Setup](DOCKER_SETUP.md) - Development environment
- [API Documentation](https://developer.servicenow.com/dev.do#!/reference/api/latest/rest/)
