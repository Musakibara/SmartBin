<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('alerts', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->uuid('bin_id');
            $table->enum('type', ['BIN_FULL', 'BATTERY_LOW', 'SENSOR_ERROR', 'OVERFLOW_RISK']);
            $table->text('message')->nullable();
            $table->enum('severity', ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])->default('MEDIUM');
            $table->enum('status', ['PENDING', 'RESOLVED'])->default('PENDING');

            $table->timestamp('created_at')->nullable();

            $table->index('bin_id');
            $table->index('status');
            $table->index('severity');

            $table->foreign('bin_id')
                  ->references('id')->on('bins')
                  ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('alerts');
    }
};
