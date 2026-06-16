<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE users MODIFY COLUMN role VARCHAR(50) NOT NULL DEFAULT 'AGENT'");

        Schema::table('users', function (Blueprint $table) {
            $table->string('status', 20)->default('ACTIVE')->after('role');
            $table->timestamp('last_active_at')->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['status', 'last_active_at']);
        });

        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('ADMIN','AGENT') NOT NULL DEFAULT 'AGENT'");
    }
};
