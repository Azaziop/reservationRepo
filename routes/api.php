<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Models\User;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/employees', function (Request $request) {
        return response()->json(
            User::select('id', 'name', 'first_name', 'employee_number', 'department')
                ->whereNotNull('employee_number')
                ->orderBy('name')
                ->get()
        );
    });
});

// ServiceNow metadata endpoint. Protection via `auth:sanctum` is configurable
use App\Http\Controllers\ServiceNowController;

$protect = env('SERVICENOW_PROTECT_API', true);
if ($protect) {
    Route::middleware('auth:sanctum')->get('/servicenow/metadata/{table?}', [ServiceNowController::class, 'metadata']);
} else {
    Route::get('/servicenow/metadata/{table?}', [ServiceNowController::class, 'metadata']);
}

// Audit endpoint: GET /api/servicenow/audit/{table}/{sys_id}
if ($protect) {
    Route::middleware('auth:sanctum')->get('/servicenow/audit/{table}/{sys_id}', [ServiceNowController::class, 'audit']);
} else {
    Route::get('/servicenow/audit/{table}/{sys_id}', [ServiceNowController::class, 'audit']);
}
