# ServiceNow Audit & Metadata Endpoints

This project exposes a small set of endpoints to proxy ServiceNow metadata and audit data into the Laravel application.

## Environment variables
- `SERVICENOW_BASE_URL` - ServiceNow instance base URL (e.g. `https://devXYZ.service-now.com`).
- `SNOW_USERNAME` - ServiceNow API username.
- `SNOW_PASSWORD` - ServiceNow API password.
- `SERVICENOW_METADATA_CACHE_TTL` - TTL (seconds) for metadata cache (default `1800`).
- `SERVICENOW_PROTECT_API` - if `true` (default), the endpoints are protected by `auth:sanctum`.

## Endpoints

- `GET /api/servicenow/metadata/{table?}`
  - Returns the metadata (fields) for the given table. Uses ServiceNow `sys_dictionary` and caches results.

- `GET /api/servicenow/audit/{table}/{sys_id}`
  - Returns audit history for a specific record using ServiceNow `sys_audit` (documentkey = sys_id).

### Example curl (direct ServiceNow API)
Replace placeholders before calling.

```bash
curl -u 'SNOW_USERNAME:SNOW_PASSWORD' \
  'https://INSTANCE.service-now.com/api/now/table/sys_audit?sysparm_query=documentkey=INCIDENT_SYS_ID^tablename=incident&sysparm_limit=100' \
  -H 'Accept: application/json'
```

### Example curl (via Laravel proxy endpoint)

If `SERVICENOW_PROTECT_API=true` you must authenticate (example uses a Sanctum token):

```bash
curl -H "Authorization: Bearer <SANCTUM_TOKEN>" \
  "http://127.0.0.1:8000/api/servicenow/audit/incident/INCIDENT_SYS_ID"
```

## Notes
- Keep `SNOW_USERNAME`/`SNOW_PASSWORD` secure (use secrets manager in production).
- The audit endpoint does not cache results by default (audits are dynamic).
