<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Supprimer l'ancienne contrainte (MySQL syntax for dropping constraints)
        try {
            DB::statement("ALTER TABLE users DROP CONSTRAINT users_role_check");
        } catch (\Exception $e) {
            // Constraint might not exist, that's okay
        }

        // Créer la nouvelle contrainte avec 'employee'
        DB::statement("
            ALTER TABLE users
            ADD CONSTRAINT users_role_check
            CHECK (role IN ('user','admin','employee'))
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revenir à l'ancienne contrainte
        try {
            DB::statement("ALTER TABLE users DROP CONSTRAINT users_role_check");
        } catch (\Exception $e) {
            // Constraint might not exist, that's okay
        }
        
        DB::statement("
            ALTER TABLE users
            ADD CONSTRAINT users_role_check
            CHECK (role IN ('user','admin'))
        ");
    }
};
