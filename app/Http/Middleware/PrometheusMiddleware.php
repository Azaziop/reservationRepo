<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Log;

class PrometheusMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $start = microtime(true);
        $request->attributes->set('metrics_start', $start);

        // Always log that middleware ran (helpful when Redis is down)
        Log::info('[PrometheusMiddleware] handle executed', ['path' => $request->path()]);

        // Attempt to increment a debug key in Redis but don't let failures stop the request
        try {
            \Illuminate\Support\Facades\Redis::incr('metrics:middleware_invocations');
        } catch (\Exception $e) {
            // swallow Redis errors — will be visible in logs if needed
            Log::warning('[PrometheusMiddleware] Redis incr failed in handle', ['err' => $e->getMessage()]);
        }
        return $next($request);
    }

    public function terminate($request, $response)
    {
        $start = $request->attributes->get('metrics_start', microtime(true));
        $dur = microtime(true) - $start;

        // Wrap each Redis operation so a failure in one doesn't prevent others.
        try {
            Redis::incr('metrics:app_http_requests_total');
        } catch (\Exception $e) {
            Log::warning('[PrometheusMiddleware] Redis incr requests failed', ['err' => $e->getMessage()]);
            $this->fallbackIncrement('app_http_requests_total', 1);
        }

        try {
            Redis::incrbyfloat('metrics:app_http_request_duration_sum', $dur);
            Redis::incr('metrics:app_http_request_duration_count');
        } catch (\Exception $e) {
            Log::warning('[PrometheusMiddleware] Redis duration sum/count failed', ['err' => $e->getMessage()]);
            $this->fallbackIncrement('app_http_request_duration_sum', $dur);
            $this->fallbackIncrement('app_http_request_duration_count', 1);
        }

        $buckets = [0.005,0.01,0.025,0.05,0.1,0.25,0.5,1,2.5,5,10];
        foreach ($buckets as $b) {
            if ($dur <= $b) {
                try {
                    Redis::hIncrBy('metrics:app_http_request_duration_bucket', (string)$b, 1);
                } catch (\Exception $e) {
                    Log::warning('[PrometheusMiddleware] Redis histogram hIncrBy failed', ['bucket' => $b, 'err' => $e->getMessage()]);
                    $this->fallbackIncrement('app_http_request_duration_bucket:'.$b, 1);
                }
            }
        }
    }

    private function fallbackIncrement(string $key, $by = 1)
    {
        try {
            $dir = storage_path('metrics');
            if (!is_dir($dir)) {
                @mkdir($dir, 0777, true);
            }
            $file = $dir.'/fallback.json';
            $data = [];
            if (is_file($file)) {
                $content = @file_get_contents($file);
                $data = $content ? json_decode($content, true) ?? [] : [];
            }
            if (!isset($data[$key])) {
                $data[$key] = 0;
            }
            $data[$key] += $by;
            @file_put_contents($file, json_encode($data));
        } catch (\Exception $e) {
            // last resort: log the failure
            Log::error('[PrometheusMiddleware] fallbackIncrement failed', ['err' => $e->getMessage()]);
        }
    }
}
