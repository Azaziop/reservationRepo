#!/usr/bin/env bash
set -e
for i in 1 2 3; do
  curl -sS http://localhost/ >/dev/null && echo "[test] sent request $i"
  if [ $i -lt 3 ]; then sleep 60; fi
done
sleep 2
echo '--- /metrics (filtered) ---'
curl -s http://localhost/metrics | egrep '^(app_up|app_http_requests_total|app_http_request_duration_seconds_bucket|app_http_request_duration_seconds_count|app_http_request_duration_seconds_sum|app_http_request_duration_seconds_avg|reservations_created_total|reservations_cancelled_total)' || true
echo

echo '--- Prometheus API (req/min) ---'
curl -sG --data-urlencode 'query=sum(rate(app_http_requests_total[1m])) * 60' 'http://localhost:9090/api/v1/query'
