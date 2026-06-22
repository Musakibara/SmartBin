<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('predictions', function (Blueprint $table) {
            $table->index(['bin_id', 'created_at'], 'predictions_bin_created_index');
        });
    }

    public function down(): void
    {
        Schema::table('predictions', function (Blueprint $table) {
            $table->dropIndex('predictions_bin_created_index');
        });
    }
};
