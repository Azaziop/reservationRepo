# Grafana Monitoring Setup for Laravel Reservation System

## Overview
This setup includes:
- **Prometheus**: Metrics collection and storage
- **Grafana**: Visualization and dashboards
- **Laravel Prometheus Exporter**: Application metrics

## Quick Start

### 1. Install Laravel Prometheus Package
```bash
docker compose exec laravel.test composer require triadev/laravel-prometheus-exporter
```

### 2. Publish Configuration
```bash
docker compose exec laravel.test php artisan vendor:publish --provider="Triadev\LaravelPrometheusExporter\Provider\LaravelPrometheusExporterServiceProvider"
```

### 3. Start Monitoring Stack
```bash
docker compose up -d prometheus grafana
```

### 4. Access Grafana
- URL: http://localhost:3000
- Username: `admin`
- Password: `admin`
- Change password on first login

### 5. Access Prometheus
- URL: http://localhost:9091

## Metrics Endpoint

Add to `routes/web.php`:
```php
use Illuminate\Support\Facades\Route;

Route::get('/metrics', function () {
    return app(\Triadev\LaravelPrometheusExporter\Contract\PrometheusExporter::class)
        ->export();
})->middleware('throttle:60,1');
```

## Custom Business Metrics

### Track Reservations
Add to `app/Http/Controllers/ReservationController.php`:

```php
use Triadev\LaravelPrometheusExporter\Facade\PrometheusExporter;

public function store(Request $request)
{
    // ... existing validation code ...
    
    $reservation = Reservation::create($data);
    
    // Track reservation created
    PrometheusExporter::incCounter(
        'reservations_created_total',
        'Total number of reservations created',
        ['room_id' => $request->room_id, 'status' => 'confirmed']
    );
    
    // Track room utilization
    PrometheusExporter::setGauge(
        'room_utilization_percent',
        'Current room utilization percentage',
        $this->calculateRoomUtilization($request->room_id),
        ['room_id' => $request->room_id]
    );
    
    return redirect()->route('reservations.index');
}
```

### Helper Method for Utilization
```php
private function calculateRoomUtilization($roomId): float
{
    $totalSlots = 10; // Business hours per day
    $bookedSlots = Reservation::where('room_id', $roomId)
        ->whereDate('date', today())
        ->count();
    
    return ($bookedSlots / $totalSlots) * 100;
}
```

## Available Metrics Types

### 1. Counter (always increasing)
```php
PrometheusExporter::incCounter(
    'metric_name',
    'Description',
    ['label1' => 'value1']
);
```

### 2. Gauge (can go up/down)
```php
PrometheusExporter::setGauge(
    'metric_name',
    'Description',
    123.45,
    ['label1' => 'value1']
);
```

### 3. Histogram (request durations)
```php
PrometheusExporter::observeHistogram(
    'http_request_duration_seconds',
    'HTTP request duration',
    0.250,
    ['route' => 'reservations.store']
);
```

## Built-in Laravel Metrics

The package automatically tracks:
- ✅ HTTP request count and duration
- ✅ Database query count and time
- ✅ Cache hit/miss rates
- ✅ Queue job processing
- ✅ Memory usage

## Grafana Dashboards

### Pre-configured Dashboard
Already provisioned: **Laravel Reservation System**
- HTTP Request Rate
- Response Time (95th percentile)
- Database Query Count
- Error Rate
- Active Reservations
- Room Utilization

### Import Additional Dashboards
1. Go to Grafana → Dashboards → Import
2. Use these IDs:
   - **6126**: Laravel Dashboard
   - **12633**: MySQL Overview
   - **3662**: Prometheus Stats

## Alerting (Optional)

### Create Alert in Grafana
1. Go to Alerting → Alert rules
2. Create new rule:
   - **Name**: High Error Rate
   - **Query**: `rate(http_requests_total{status=~"5.."}[5m]) > 10`
   - **Condition**: WHEN avg() OF query() IS ABOVE 10
   - **Send to**: Email/Slack/etc.

### Example: Room Overbooked Alert
```yaml
- alert: RoomOverbooked
  expr: laravel_room_utilization_percent > 90
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "Room {{ $labels.room_id }} is {{ $value }}% utilized"
```

## Troubleshooting

### Metrics endpoint returns 404
```bash
# Clear cache
docker compose exec laravel.test php artisan config:clear
docker compose exec laravel.test php artisan route:clear
```

### Prometheus can't scrape Laravel
Check network connectivity:
```bash
docker compose exec prometheus wget -O- http://laravel.test/metrics
```

### Grafana shows "No data"
1. Check Prometheus is scraping: http://localhost:9091/targets
2. Verify Laravel metrics endpoint: http://localhost/metrics
3. Check Grafana data source settings

## Production Considerations

1. **Secure metrics endpoint**:
```php
Route::get('/metrics', function () {
    if (request()->ip() !== '127.0.0.1') {
        abort(403);
    }
    return app(PrometheusExporter::class)->export();
});
```

2. **Use authentication**:
```php
Route::get('/metrics', MetricsController::class)
    ->middleware(['auth', 'admin']);
```

3. **Store data persistently**:
   - Prometheus data: `prometheus-data` volume
   - Grafana data: `grafana-data` volume
   - Backup regularly!

4. **Set retention policies**:
```yaml
# In prometheus.yml
global:
  scrape_interval: 15s
storage:
  tsdb:
    retention.time: 30d  # Keep 30 days of data
```

## Next Steps

1. ✅ Start containers: `docker compose up -d`
2. ✅ Install Laravel package
3. ✅ Add metrics endpoint
4. ✅ Open Grafana and explore
5. ⚡ Add custom business metrics
6. 📊 Create custom dashboards
7. 🔔 Set up alerting

## Useful Commands

```bash
# View Grafana logs
docker compose logs -f grafana

# View Prometheus logs
docker compose logs -f prometheus

# Restart monitoring stack
docker compose restart prometheus grafana

# Check Prometheus targets
curl http://localhost:9091/api/v1/targets

# Test metrics endpoint
curl http://localhost/metrics
```

## Resources

- Grafana Docs: https://grafana.com/docs/
- Prometheus Docs: https://prometheus.io/docs/
- Laravel Prometheus Exporter: https://github.com/triadev/LaravelPrometheusExporter
- Dashboard Gallery: https://grafana.com/grafana/dashboards/
