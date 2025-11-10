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
