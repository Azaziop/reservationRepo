<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            $table->string('servicenow_incident_number')->nullable()->after('notes');
            $table->string('servicenow_sys_id')->nullable()->after('servicenow_incident_number');
            $table->json('servicenow_metadata')->nullable()->after('servicenow_sys_id');
            $table->timestamp('servicenow_synced_at')->nullable()->after('servicenow_metadata');
            
            $table->index('servicenow_incident_number');
            $table->index('servicenow_sys_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            $table->dropIndex(['servicenow_incident_number']);
            $table->dropIndex(['servicenow_sys_id']);
            $table->dropColumn([
                'servicenow_incident_number',
                'servicenow_sys_id',
                'servicenow_metadata',
                'servicenow_synced_at'
            ]);
        });
    }
};
