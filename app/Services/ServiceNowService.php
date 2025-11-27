<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;

class ServiceNowService
{
    protected string $baseUrl;
    protected ?string $username;
    protected ?string $password;

    public function __construct()
    {
        $this->baseUrl = Config::get('services.servicenow.base_url', env('SERVICENOW_BASE_URL', 'https://dev303716.service-now.com'));
        $this->username = Config::get('services.servicenow.username', env('SNOW_USERNAME'));
        $this->password = Config::get('services.servicenow.password', env('SNOW_PASSWORD'));
    }

    /**
     * Get table metadata (sys_dictionary) for a given table name
     * Uses cache to avoid calling ServiceNow too often.
     *
     * @param string $tableName
     * @param int $limit
     * @return array
     * @throws \Exception
     */
    public function getTableMetadata(string $tableName = 'incident', int $limit = 100): array
    {
        $cacheKey = "servicenow_metadata_{$tableName}";

        // TTL configurable via config('services.servicenow.metadata_cache_ttl') or env
        $cacheTtl = (int) Config::get('services.servicenow.metadata_cache_ttl', env('SERVICENOW_METADATA_CACHE_TTL', 1800));

        return Cache::remember($cacheKey, $cacheTtl, function () use ($tableName, $limit) {
            $url = rtrim($this->baseUrl, '/').'/api/now/table/sys_dictionary';

            $query = [
                'sysparm_query' => "name={$tableName}",
                'sysparm_limit' => $limit,
            ];

            $response = Http::withBasicAuth($this->username, $this->password)
                ->acceptJson()
                ->get($url, $query);

            if ($response->successful()) {
                // Return only the `result` array from ServiceNow (cache this)
                return $response->json()['result'] ?? [];
            }

            // On error return empty array (do not cache errors)
            return [];
        });
    }

    /**
     * Get audit history (sys_audit) for a given table and record sys_id
     *
     * @param string $tableName
     * @param string $sysId
     * @param int $limit
     * @return array
     */
    public function getTableAudit(string $tableName, string $sysId, int $limit = 200): array
    {
        $url = rtrim($this->baseUrl, '/').'/api/now/table/sys_audit';

        $query = [
            // documentkey stores the record sys_id for audits
            'sysparm_query' => "documentkey={$sysId}^tablename={$tableName}",
            'sysparm_limit' => $limit,
            'sysparm_order_by' => 'sys_created_on',
            'sysparm_order_by_desc' => 'true',
        ];

        $response = Http::withBasicAuth($this->username, $this->password)
            ->acceptJson()
            ->get($url, $query);

        if ($response->successful()) {
            return $response->json()['result'] ?? [];
        }

        return [];
    }
}
