<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rooms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('property_id')->constrained()->cascadeOnDelete();
            $table->string('number');
            $table->string('type')->default('Single');
            $table->unsignedInteger('capacity')->default(1);
            $table->unsignedInteger('price_daily')->default(0);
            $table->unsignedInteger('price_monthly')->default(0);
            $table->json('facilities')->nullable();
            $table->string('status')->default('available');
            $table->timestamps();

            $table->unique(['property_id', 'number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rooms');
    }
};
