<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sensors', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->uuid('bin_id');
            $table->string('type', 100)->default('ULTRASONIC');
            $table->string('model', 100)->default('HC-SR04');
            $table->enum('status', ['ACTIVE', 'INACTIVE'])->default('ACTIVE');

            $table->timestamps();

            $table->index('bin_id');

            $table->foreign('bin_id')
                  ->references('id')->on('bins')
                  ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sensors');
    }
};
