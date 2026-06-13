<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->uuid('alert_id');
            $table->enum('channel', ['EMAIL', 'TELEGRAM']);
            $table->string('recipient', 150)->nullable();
            $table->text('message')->nullable();
            $table->enum('status', ['PENDING', 'SENT', 'FAILED'])->default('PENDING');
            $table->timestamp('sent_at')->nullable();

            $table->index('alert_id');
            $table->index('status');
            $table->index('channel');

            $table->foreign('alert_id')
                  ->references('id')->on('alerts')
                  ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
