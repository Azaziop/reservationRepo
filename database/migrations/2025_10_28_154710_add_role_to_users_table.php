<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role', 20)->default('user')->index()->after('password');
        });

        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            // Postgres CHECK constraint; skipped on sqlite
            DB::statement("
                ALTER TABLE users
                ADD CONSTRAINT users_role_check
                CHECK (role IN ('user','admin'))
            ");
        } elseif ($driver === 'mysql') {
            // MySQL 8+ CHECK constraint
            DB::statement("
                ALTER TABLE users
                ADD CONSTRAINT users_role_check
                CHECK (role IN ('user','admin'))
            ");
        }
    }

    public function down(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            DB::statement("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check");
        } elseif ($driver === 'mysql') {
            DB::statement("ALTER TABLE users DROP CHECK users_role_check");
        }

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('role');
        });
    }
};
