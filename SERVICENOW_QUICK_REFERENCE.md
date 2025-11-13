# ServiceNow Metadata - Quick Reference

## 🚀 Quick Commands

```bash
# View all metadata
php artisan servicenow:report

# Sync specific reservation
php artisan servicenow:sync --reservation_id=1

# Sync all reservations
php artisan servicenow:sync --all

# Create missing incidents
php artisan servicenow:sync --missing

# Export to JSON
php artisan servicenow:report --format=json > metadata.json

# Export to CSV
php artisan servicenow:report --format=csv > metadata.csv
```

## 📊 What's Stored in Metadata

Every reservation now tracks:
- **Incident Number** (e.g., INC0010001)
- **Sys ID** (for API calls)
- **State** (New, In Progress, Resolved, etc.)
- **Priority** (1-5)
- **Assigned To** (ServiceNow user)
- **Timestamps** (created, updated, synced)

## 🔗 Direct Links

View incident in ServiceNow:
```
https://dev322015.service-now.com/nav_to.do?uri=incident.do?sys_id={sys_id}
```

Or use the model accessor:
```php
echo $reservation->servicenow_url;
```

## 📝 Code Examples

### Check if synced
```php
if ($reservation->isSyncedWithServiceNow()) {
    echo $reservation->servicenow_incident_number;
}
```

### Access metadata
```php
$metadata = $reservation->servicenow_metadata;
echo "State: " . $metadata['state'];
echo "Priority: " . $metadata['priority'];
```

### Query scopes
```php
// With incidents
Reservation::syncedWithServiceNow()->get();

// Without incidents
Reservation::notSyncedWithServiceNow()->get();
```

### Manual operations
```php
$serviceNow = app(\App\Services\ServiceNowService::class);

// Sync from ServiceNow
$serviceNow->syncMetadata($reservation);

// Create incident
$serviceNow->createReservationIncident($reservation);

// Get all incidents for a reservation
$incidents = $serviceNow->getReservationMetadata('5');
```

## 🎯 Use Cases

1. **Audit Trail**: Track incident lifecycle alongside reservations
2. **Status Sync**: Keep Laravel and ServiceNow in sync
3. **Reporting**: Generate compliance or activity reports
4. **Automation**: Trigger workflows based on incident state
5. **Integration**: Connect with other ServiceNow modules

## 🔧 Custom Fields in ServiceNow

Add these to your incident table:

| Field Name | Type | Purpose |
|------------|------|---------|
| `u_reservation_id` | String | Link to Laravel reservation |
| `u_room_number` | String | Quick room reference |
| `u_employee_number` | String | Quick employee reference |

## 📈 Monitoring

```bash
# Check sync status
php artisan servicenow:report --filter=not_synced

# View logs
docker compose exec laravel.test tail -f storage/logs/laravel.log | grep ServiceNow

# Database check
docker compose exec laravel.test php artisan tinker
>>> Reservation::whereNotNull('servicenow_sys_id')->count()
```

## ⚠️ Troubleshooting

**Problem**: Incidents not creating
- Check `.env` credentials
- Verify `SERVICENOW_ENABLED=true`
- Check logs for API errors

**Problem**: Metadata not updating
- Run `php artisan servicenow:sync --reservation_id=X`
- Verify incident still exists in ServiceNow
- Check network connectivity

**Problem**: Missing fields error
- Create custom fields in ServiceNow
- Or remove them from service class

## 🔄 Automation Ideas

```php
// Scheduled hourly sync
Schedule::command('servicenow:sync --all')->hourly();

// Daily report
Schedule::command('servicenow:report --format=json')
    ->daily()
    ->sendOutputTo('reports/servicenow-' . date('Y-m-d') . '.json');

// Alert on unsync'd reservations
Schedule::call(function () {
    $count = Reservation::notSyncedWithServiceNow()->count();
    if ($count > 10) {
        // Send notification
    }
})->everyFiveMinutes();
```
