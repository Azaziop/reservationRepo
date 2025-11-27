<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Log;

class MetricsController extends Controller
{
    public function index(Request $request)
    {
        // Basic metrics exposition for Prometheus
        $lines = [];

        // app_up gauge
        $lines[] = "# HELP app_up Application up (1 = up)";
        $lines[] = "# TYPE app_up gauge";
        $lines[] = "app_up 1";

        // Request counters — try Redis, fall back to file-based metrics when Redis is unavailable
        $requests = 0;
        $sum = 0;
        $histogram = [];
        $count = 0;
        try {
            $requests = Redis::get('metrics:app_http_requests_total') ?: 0;
            $sum = Redis::get('metrics:app_http_request_duration_sum') ?: 0;
            $count = Redis::get('metrics:app_http_request_duration_count') ?: 0;
            $raw = Redis::hgetall('metrics:app_http_request_duration_bucket') ?: [];
            foreach ($raw as $k => $v) {
                $histogram[$k] = $v;
            }
        } catch (\Exception $e) {
            Log::warning('[MetricsController] Redis unavailable, reading fallback metrics', ['err' => $e->getMessage()]);
            $file = storage_path('metrics/fallback.json');
            if (is_file($file)) {
                $content = @file_get_contents($file);
                $data = $content ? json_decode($content, true) ?? [] : [];
                // map fallback keys
                $requests = ($data['app_http_requests_total'] ?? 0) + ($data['metrics:app_http_requests_total'] ?? 0);
                $sum = ($data['app_http_request_duration_sum'] ?? 0) + ($data['metrics:app_http_request_duration_sum'] ?? 0);
                $count = ($data['app_http_request_duration_count'] ?? 0) + ($data['metrics:app_http_request_duration_count'] ?? 0);
                foreach ($data as $k => $v) {
                    if (str_starts_with($k, 'app_http_request_duration_bucket:') || str_starts_with($k, 'metrics:app_http_request_duration_bucket:')) {
                        $bucket = preg_replace('/^(?:metrics:)?app_http_request_duration_bucket:/', '', $k);
                        $histogram[$bucket] = ($histogram[$bucket] ?? 0) + $v;
                    }
                }
            }
        }

        $lines[] = "# HELP app_http_requests_total Total HTTP requests";
        $lines[] = "# TYPE app_http_requests_total counter";
        $lines[] = "app_http_requests_total {$requests}";

        // Histogram buckets
        $lines[] = "# HELP app_http_request_duration_seconds Histogram of request durations";
        $lines[] = "# TYPE app_http_request_duration_seconds histogram";

        $buckets = ['0.005','0.01','0.025','0.05','0.1','0.25','0.5','1','2.5','5','10','+Inf'];
        foreach ($buckets as $b) {
            if ($b === '+Inf') {
                $c = $count ?: 0;
                $lines[] = "app_http_request_duration_seconds_bucket{le=\"+Inf\"} {$c}";
            } else {
                $c = $histogram[$b] ?? 0;
                $lines[] = "app_http_request_duration_seconds_bucket{le=\"{$b}\"} {$c}";
            }
        }
        $lines[] = "app_http_request_duration_seconds_count {$count}";
        $lines[] = "app_http_request_duration_seconds_sum {$sum}";

        // Average request duration (seconds)
        $avg = 0;
        if ((float)$count > 0) {
            $avg = (float)$sum / (float)$count;
        }
        $lines[] = "# HELP app_http_request_duration_seconds_avg Average HTTP request duration in seconds";
        $lines[] = "# TYPE app_http_request_duration_seconds_avg gauge";
        $lines[] = "app_http_request_duration_seconds_avg {$avg}";

        // Business metrics
        // Business metrics (use Redis when available, otherwise fallback)
        try {
            $created = Redis::get('metrics:reservations_created_total') ?: 0;
            $cancelled = Redis::get('metrics:reservations_cancelled_total') ?: 0;
        } catch (\Exception $e) {
            $file = storage_path('metrics/fallback.json');
            $created = 0;
            $cancelled = 0;
            if (is_file($file)) {
                $content = @file_get_contents($file);
                $data = $content ? json_decode($content, true) ?? [] : [];
                $created = ($data['reservations_created_total'] ?? 0) + ($data['metrics:reservations_created_total'] ?? 0);
                $cancelled = ($data['reservations_cancelled_total'] ?? 0) + ($data['metrics:reservations_cancelled_total'] ?? 0);
            }
        }

        $lines[] = "# HELP reservations_created_total Total reservations created";
        $lines[] = "# TYPE reservations_created_total counter";
        $lines[] = "reservations_created_total {$created}";

        $lines[] = "# HELP reservations_cancelled_total Total reservations cancelled";
        $lines[] = "# TYPE reservations_cancelled_total counter";
        $lines[] = "reservations_cancelled_total {$cancelled}";

        return response(implode("\n", $lines), 200)
                ->header('Content-Type', 'text/plain; version=0.0.4');
    }
}
