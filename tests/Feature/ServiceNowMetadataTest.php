<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;

class ServiceNowMetadataTest extends TestCase
{

    public function test_metadata_route_requires_auth()
    {
        // When not authenticated, should return 401 if route is protected
        $resp = $this->getJson('/api/servicenow/metadata/incident');
        $resp->assertStatus(401);
    }

    public function test_metadata_route_returns_data_for_authenticated_user()
    {
        // Mock the ServiceNowService used by the controller
        $mockResult = ['result' => [
            ['element' => 'sys_id', 'internal_type' => 'string'],
        ]];

        $this->mock(\App\Services\ServiceNowService::class, function ($mock) use ($mockResult) {
            $mock->shouldReceive('getTableMetadata')
                 ->once()
                 ->with('incident', 200)
                 ->andReturn($mockResult);
        });

        // Create a user instance (not persisted) and act as them using sanctum guard
        $user = User::factory()->make();

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/servicenow/metadata/incident');

        $response->assertStatus(200)->assertJson($mockResult);
    }
}
