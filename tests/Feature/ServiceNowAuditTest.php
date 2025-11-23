<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;

class ServiceNowAuditTest extends TestCase
{
    public function test_audit_route_requires_auth()
    {
        $resp = $this->getJson('/api/servicenow/audit/incident/00000000000000000000000000000000');
        $resp->assertStatus(401);
    }

    public function test_audit_route_returns_data_for_authenticated_user()
    {
        $mockResult = [
            ['field' => 'short_description', 'old_value' => 'old', 'new_value' => 'new', 'sys_created_by' => 'admin']
        ];

        $this->mock(\App\Services\ServiceNowService::class, function ($mock) use ($mockResult) {
            $mock->shouldReceive('getTableAudit')
                 ->once()
                 ->with('incident', '00000000000000000000000000000000', 200)
                 ->andReturn($mockResult);
        });

        $user = User::factory()->make();

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/servicenow/audit/incident/00000000000000000000000000000000');

        $response->assertStatus(200)->assertJson($mockResult);
    }
}
