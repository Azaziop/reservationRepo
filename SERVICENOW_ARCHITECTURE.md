# ServiceNow Metadata Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    LARAVEL APPLICATION                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Reservation Model                            │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │ • servicenow_incident_number  (INC0010001)               │  │
│  │ • servicenow_sys_id           (sys_id for API)           │  │
│  │ • servicenow_metadata         (JSON: state, priority...) │  │
│  │ • servicenow_synced_at        (Last sync timestamp)      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                          ↕                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         ServiceNowService (API Client)                    │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │ createReservationIncident()  → Create + store metadata   │  │
│  │ syncMetadata()               → Pull latest from SN       │  │
│  │ getReservationMetadata()     → Query by reservation_id   │  │
│  │ updateIncident()             → Push changes to SN        │  │
│  │ getIncident()                → Get single incident       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                          ↕                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Artisan Commands                             │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │ servicenow:test     → Test connection & create incident  │  │
│  │ servicenow:sync     → Sync metadata (pull from SN)       │  │
│  │ servicenow:report   → Generate metadata reports          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                             ↕ HTTPS API
┌─────────────────────────────────────────────────────────────────┐
│                      SERVICENOW INSTANCE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Incident Table                               │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │ Standard Fields:                                          │  │
│  │ • number           (INC0010001)                           │  │
│  │ • sys_id           (unique identifier)                    │  │
│  │ • state            (1=New, 2=In Progress...)              │  │
│  │ • priority         (1-5)                                  │  │
│  │ • short_description                                       │  │
│  │ • description                                             │  │
│  │                                                           │  │
│  │ Custom Fields:                                            │  │
│  │ • u_reservation_id   (Laravel reservation ID)            │  │
│  │ • u_room_number      (Room reference)                    │  │
│  │ • u_employee_number  (Employee reference)                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        DATA FLOW                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. User creates reservation in Laravel                         │
│     ↓                                                           │
│  2. ReservationController::store()                              │
│     ↓                                                           │
│  3. ServiceNowService::createReservationIncident()              │
│     ↓ (HTTP POST to ServiceNow)                                │
│  4. ServiceNow creates incident                                 │
│     ↓ (Returns incident data)                                  │
│  5. updateReservationMetadata()                                 │
│     ↓                                                           │
│  6. Save to database:                                           │
│     • servicenow_incident_number = INC0010001                   │
│     • servicenow_sys_id = abc123...                             │
│     • servicenow_metadata = { state: 1, priority: 5... }        │
│     • servicenow_synced_at = 2025-11-13 22:36:18                │
│                                                                 │
│  ───────────────────────────────────────────────────────────   │
│                                                                 │
│  SYNC BACK (Pull latest from ServiceNow):                      │
│                                                                 │
│  1. php artisan servicenow:sync --reservation_id=1              │
│     ↓                                                           │
│  2. ServiceNowService::syncMetadata($reservation)               │
│     ↓ (HTTP GET from ServiceNow using sys_id)                  │
│  3. ServiceNow returns current incident data                    │
│     ↓                                                           │
│  4. Update reservation metadata with latest values              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     METADATA STRUCTURE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  servicenow_metadata (JSON):                                    │
│  {                                                              │
│    "state": "1",              // 1=New, 2=In Progress, etc.    │
│    "priority": "5",           // 1=Critical, 5=Planning        │
│    "assigned_to": "sys_id",   // Assigned user (if any)        │
│    "opened_at": "2025-11-13 22:36:18",                         │
│    "sys_created_on": "2025-11-13 22:36:18",                    │
│    "sys_updated_on": "2025-11-13 22:37:53"                     │
│  }                                                              │
│                                                                 │
│  State Values:                                                  │
│  • 1 = New                                                      │
│  • 2 = In Progress                                              │
│  • 3 = On Hold                                                  │
│  • 6 = Resolved                                                 │
│  • 7 = Closed                                                   │
│  • 8 = Canceled                                                 │
│                                                                 │
│  Priority Values:                                               │
│  • 1 = Critical                                                 │
│  • 2 = High                                                     │
│  • 3 = Moderate                                                 │
│  • 4 = Low                                                      │
│  • 5 = Planning                                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    COMMAND USAGE                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  TEST CONNECTION:                                               │
│  $ php artisan servicenow:test                                  │
│  $ php artisan servicenow:test --reservation_id=5               │
│  $ php artisan servicenow:test --cancel                         │
│                                                                 │
│  SYNC METADATA:                                                 │
│  $ php artisan servicenow:sync --reservation_id=1               │
│  $ php artisan servicenow:sync --all                            │
│  $ php artisan servicenow:sync --missing                        │
│                                                                 │
│  GENERATE REPORTS:                                              │
│  $ php artisan servicenow:report                                │
│  $ php artisan servicenow:report --format=json                  │
│  $ php artisan servicenow:report --format=csv                   │
│  $ php artisan servicenow:report --filter=synced                │
│  $ php artisan servicenow:report --filter=not_synced            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                  QUERY EXAMPLES                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  // Get all synced reservations                                 │
│  $synced = Reservation::syncedWithServiceNow()->get();          │
│                                                                 │
│  // Get reservations without incidents                          │
│  $notSynced = Reservation::notSyncedWithServiceNow()->get();    │
│                                                                 │
│  // Check if reservation is synced                              │
│  if ($reservation->isSyncedWithServiceNow()) {                  │
│      echo $reservation->servicenow_url;                         │
│  }                                                              │
│                                                                 │
│  // Access metadata                                             │
│  $metadata = $reservation->servicenow_metadata;                 │
│  $state = $metadata['state'];                                   │
│  $priority = $metadata['priority'];                             │
│                                                                 │
│  // Manual sync                                                 │
│  $sn = app(\App\Services\ServiceNowService::class);             │
│  $sn->syncMetadata($reservation);                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```
