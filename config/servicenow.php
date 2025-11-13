<?php

return [
    /*
    |--------------------------------------------------------------------------
    | ServiceNow Integration Settings
    |--------------------------------------------------------------------------
    |
    | Configure ServiceNow API integration for automatic incident creation
    | when reservations are created or cancelled.
    |
    */

    'enabled' => env('SERVICENOW_ENABLED', false),

    'instance' => env('SERVICENOW_INSTANCE'),

    'credentials' => [
        'username' => env('SERVICENOW_USERNAME'),
        'password' => env('SERVICENOW_PASSWORD'),
    ],

    'api' => [
        'base_url' => env('SERVICENOW_INSTANCE') ? 'https://' . env('SERVICENOW_INSTANCE') . '/api/now' : null,
        'timeout' => 30,
    ],

    'events' => [
        'create_on_reservation' => env('SERVICENOW_CREATE_ON_RESERVATION', true),
        'create_on_cancellation' => env('SERVICENOW_CREATE_ON_CANCELLATION', true),
    ],

    'incident' => [
        'caller_id' => env('SERVICENOW_CALLER_ID'),
        'assignment_group' => env('SERVICENOW_ASSIGNMENT_GROUP'),
        'category' => 'Reservation',
        'subcategory' => 'Room Booking',
        'urgency' => 3, // 1=High, 2=Medium, 3=Low
        'impact' => 3,  // 1=High, 2=Medium, 3=Low
    ],
];
