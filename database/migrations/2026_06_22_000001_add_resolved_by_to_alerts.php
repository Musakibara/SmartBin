<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('alerts', function (Blueprint $table) {
            $table->uuid('resolved_by')->nullable()->after('status');
            $table->timestamp('resolved_at')->nullable()->after('resolved_by');

            $table->index('resolved_by');

            $table->foreign('resolved_by')
                  ->references('id')->on('users')
                  ->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('alerts', function (Blueprint $table) {
            $table->dropForeign(['resolved_by']);
            $table->dropIndex(['resolved_by']);
            $table->dropColumn(['resolved_by', 'resolved_at']);
        });
    }
};
