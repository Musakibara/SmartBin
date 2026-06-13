<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('predictions', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->uuid('bin_id');
            $table->dateTime('predicted_fill_time')->nullable();
            $table->float('fill_probability')->default(0);
            $table->enum('risk_level', ['LOW', 'MEDIUM', 'HIGH'])->default('LOW');
            $table->text('recommendation')->nullable();

            $table->timestamp('created_at')->nullable();

            $table->index('bin_id');
            $table->index('risk_level');

            $table->foreign('bin_id')
                  ->references('id')->on('bins')
                  ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('predictions');
    }
};
