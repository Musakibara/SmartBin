<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sensor_readings', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->uuid('bin_id');
            $table->float('distance')->nullable();
            $table->float('fill_level');
            $table->boolean('detected_presence')->default(false);

            $table->timestamp('created_at')->nullable();

            $table->index('bin_id');
            $table->index('created_at');

            $table->foreign('bin_id')
                  ->references('id')->on('bins')
                  ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sensor_readings');
    }
};
