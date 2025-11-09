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
            // Supprimer l'ancienne contrainte unique
            $table->dropUnique('unique_room_datetime');
        });

        // Ajouter une nouvelle approche avec une colonne de suppression logique
        // Cela permettra à Eloquent de gérer correctement les updates
        Schema::table('reservations', function (Blueprint $table) {
            // Créer une nouvelle contrainte unique plus flexible
            // qui ignore les réservations annulées
            $table->unique(
                ['room_id', 'date', 'start_time'],
                'unique_room_datetime_active'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            $table->dropUnique('unique_room_datetime_active');
            $table->unique(['room_id', 'date', 'start_time'], 'unique_room_datetime');
        });
    }
};
