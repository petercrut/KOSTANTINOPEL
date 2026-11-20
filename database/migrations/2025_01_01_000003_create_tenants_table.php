<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenants', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('phone')->nullable();
            $table->string('id_number')->nullable();
            $table->string('email')->nullable();
            $table->string('address')->nullable();
            $table->date('birth_date')->nullable();
            $table->string('gender')->nullable();
            $table->string('occupation')->nullable();
            $table->string('emergency_name')->nullable();
            $table->string('emergency_phone')->nullable();
            $table->foreignId('property_id')->constrained()->cascadeOnDelete();
            $table->foreignId('room_id')->constrained()->cascadeOnDelete();
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->string('status')->default('active');
            $table->text('note')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenants');
    }
};
