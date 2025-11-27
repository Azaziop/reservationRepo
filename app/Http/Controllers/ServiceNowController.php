<?php

namespace App\Http\Controllers;

use App\Services\ServiceNowService;
use Illuminate\Http\Request;

class ServiceNowController extends Controller
{
    protected ServiceNowService $serviceNow;

    public function __construct(ServiceNowService $serviceNow)
    {
        $this->serviceNow = $serviceNow;
    }

    /**
     * Return metadata for a table (sys_dictionary)
     */
    public function metadata(Request $request, string $table = 'incident')
    {
        try {
            $limit = (int) $request->query('limit', 200);
            $result = $this->serviceNow->getTableMetadata($table, $limit);
            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Return audit history for a specific record (sys_audit)
     * GET /api/servicenow/audit/{table}/{sys_id}
     */
    public function audit(Request $request, string $table, string $sys_id)
    {
        try {
            $limit = (int) $request->query('limit', 200);
            $result = $this->serviceNow->getTableAudit($table, $sys_id, $limit);
            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
