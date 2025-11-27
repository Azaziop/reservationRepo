#!/usr/bin/env bash
set -e
END=$(date +%s)
START=$((END - 300))
QUERY="sum(rate(app_http_requests_total[1m])) * 60"
curl -sG 'http://localhost:9090/api/v1/query_range' \
  --data-urlencode "query=${QUERY}" \
  --data-urlencode "start=${START}" \
  --data-urlencode "end=${END}" \
  --data-urlencode "step=15"
