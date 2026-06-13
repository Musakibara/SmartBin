<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bins', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->string('code', 50)->unique();
            $table->string('name', 150)->nullable();
            $table->string('location', 255);

            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();

            $table->enum('status', ['NORMAL', 'WARNING', 'FULL'])->default('NORMAL');
            $table->float('fill_level')->default(0);
            $table->enum('lid_status', ['OPEN', 'CLOSED'])->default('CLOSED');
            $table->float('battery_level')->default(100);

            $table->timestamp('last_update')->nullable();

            $table->timestamps();

            $table->index('status');
            $table->index('location');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bins');
    }
};
