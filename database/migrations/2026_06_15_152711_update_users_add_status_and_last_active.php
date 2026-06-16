<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE users MODIFY role ENUM('ADMIN','SUPERVISEUR','OPERATEUR','TECHNICIEN','AGENT') NOT NULL DEFAULT 'AGENT'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE users MODIFY role VARCHAR(50) NOT NULL DEFAULT 'AGENT'");
    }
};
