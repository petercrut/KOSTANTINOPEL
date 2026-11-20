<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->foreignId('tenant_id')->nullable()->constrained()->nullOnDelete();
            $table->string('guest_name');
            $table->string('guest_phone')->nullable();
            $table->foreignId('property_id')->constrained()->cascadeOnDelete();
            $table->foreignId('room_id')->constrained()->cascadeOnDelete();
            $table->date('check_in');
            $table->date('check_out');
            $table->string('rent_type')->default('harian');
            $table->unsignedInteger('days')->default(1);
            $table->unsignedInteger('units')->default(1);
            $table->string('unit_label')->default('malam');
            $table->unsignedInteger('total')->default(0);
            $table->string('status')->default('pending');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
