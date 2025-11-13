# ServiceNow Integration Guide

## Overview

This Laravel reservation system integrates with ServiceNow to automatically create incidents when:
- New reservations are created
- Reservations are cancelled or deleted

## Setup

### 1. ServiceNow Credentials

Add these variables to your `.env` file:

```env
# ServiceNow Integration
SERVICENOW_ENABLED=true
SERVICENOW_INSTANCE=your-instance.service-now.com
SERVICENOW_USERNAME=api_user
SERVICENOW_PASSWORD=your_password
SERVICENOW_CREATE_ON_RESERVATION=true
SERVICENOW_CREATE_ON_CANCELLATION=true
```

### 2. ServiceNow User Setup

Create an integration user in ServiceNow with:
- Role: `rest_service`  
- Role: `itil` (for incident table access)
- Active: Yes

### 3. Optional Configuration

Edit `config/servicenow.php` to customize:
- Incident urgency/impact levels
- Assignment group
- Category/subcategory
- API timeout

```php
'incident' => [
    'urgency' => 3, // 1=High, 2=Medium, 3=Low
    'impact' => 3,  // 1=High, 2=Medium, 3=Low
    'assignment_group' => 'facilities_team',
    'category' => 'Reservation',
],
```

## Usage

### Automatic Integration

Once enabled, the system automatically:

**On reservation creation:**
- Creates a ServiceNow incident
- Includes: room, employee, date, time, purpose
- Sets category: "Reservation"
- Logs incident number in Laravel logs

**On reservation cancellation:**
- Creates a cancellation incident
- Includes reason and original reservation details
- Logs to Laravel for audit trail

### Manual ServiceNow API Calls

You can use the service directly in your code:

```php
use App\Services\ServiceNowService;

$serviceNow = app(ServiceNowService::class);

// Check if enabled
if ($serviceNow->isEnabled()) {
    // Create incident
    $incident = $serviceNow->createReservationIncident($reservation);
    
    // Get incident
    $incident = $serviceNow->getIncident($sysId);
    
    // Update incident
    $serviceNow->updateIncident($sysId, [
        'state' => 6, // Resolved
        'close_notes' => 'Reservation completed successfully'
    ]);
}
```

## Testing

### Test Connection

```bash
# In tinker
php artisan tinker

$serviceNow = app(App\Services\ServiceNowService::class);
dd($serviceNow->isEnabled());
```

### Test Incident Creation

Create a test reservation through the UI with ServiceNow enabled. Check:
1. Laravel logs: `storage/logs/laravel.log`
2. ServiceNow instance: look for new incidents

### Disable for Development

Set in `.env`:
```env
SERVICENOW_ENABLED=false
```

## API Endpoints Used

- **Create Incident:** `POST /api/now/table/incident`
- **Get Incident:** `GET /api/now/table/incident/{sys_id}`
- **Update Incident:** `PATCH /api/now/table/incident/{sys_id}`

## Incident Fields Created

| Field | Value |
|-------|-------|
| short_description | "New Room Reservation: [Room Name]" |
| description | Full reservation details |
| category | "Reservation" |
| subcategory | "Room Booking" |
| urgency | 3 (Low) |
| impact | 3 (Low) |
| caller_id | Configured in .env |
| assignment_group | Configured in .env |

## Error Handling

- ServiceNow errors do NOT prevent reservations from being created
- All errors are logged to `storage/logs/laravel.log`
- Failed API calls return `null` instead of throwing exceptions

## Logs

Check ServiceNow integration logs:

```bash
docker compose exec laravel.test tail -f storage/logs/laravel.log | grep -i servicenow
```

## Troubleshooting

### "ServiceNow integration is disabled"
- Check `SERVICENOW_ENABLED=true` in `.env`
- Restart containers: `docker compose restart`

### "Access denied" or 401 errors
- Verify username/password in `.env`
- Check user has `rest_service` role in ServiceNow
- Verify instance URL is correct (no https://)

### Incidents not appearing
- Check ServiceNow user has `itil` role
- Verify assignment group exists
- Check incident filters in ServiceNow UI

### Connection timeout
- Increase timeout in `config/servicenow.php`:
```php
'api' => [
    'timeout' => 60, // seconds
],
```

## Security Best Practices

1. **Use dedicated integration user** - don't use admin credentials
2. **Restrict permissions** - only grant necessary roles
3. **Rotate credentials** - change password periodically
4. **Use HTTPS** - ServiceNow API automatically uses HTTPS
5. **Log monitoring** - review logs for failed auth attempts

## Next Steps

To add ServiceNow integration to cancellation:

1. Open `app/Http/Controllers/ReservationController.php`
2. Find the `destroy()` method
3. Add before `$reservation->delete()`:

```php
// ServiceNow integration - create incident for cancellation
try {
    $serviceNow = app(ServiceNowService::class);
    if ($serviceNow->isEnabled()) {
        $incident = $serviceNow->createCancellationIncident($reservation);
        if ($incident) {
            Log::info('ServiceNow cancellation incident created', [
                'incident_number' => $incident['number'] ?? null
            ]);
        }
    }
} catch (\Exception $e) {
    Log::error('ServiceNow integration failed on delete', [
        'error' => $e->getMessage()
    ]);
}
```

4. Do the same in the `cancel()` method

## Support

For issues:
1. Check Laravel logs: `storage/logs/laravel.log`
2. Test connection with tinker
3. Verify ServiceNow user permissions
4. Review API documentation: https://developer.servicenow.com/

---

**Integration Status:** ✅ Configured  
**Last Updated:** November 2025
