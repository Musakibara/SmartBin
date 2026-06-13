<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reports', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->enum('type', ['OPERATIONAL', 'PERFORMANCE', 'STRATEGIC', 'ALERT']);
            $table->date('period_start');
            $table->date('period_end');
            $table->uuid('generated_by')->nullable();
            $table->string('file_path', 255)->nullable();
            $table->text('summary')->nullable();

            $table->timestamp('created_at')->nullable();

            $table->index('type');
            $table->index(['period_start', 'period_end']);

            $table->foreign('generated_by')
                  ->references('id')->on('users')
                  ->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reports');
    }
};
