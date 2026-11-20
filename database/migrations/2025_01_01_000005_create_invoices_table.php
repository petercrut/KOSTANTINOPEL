<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->foreignId('booking_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('tenant_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('property_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('room_id')->nullable()->constrained()->nullOnDelete();
            $table->string('description');
            $table->unsignedInteger('amount')->default(0);
            $table->date('due_date');
            $table->string('status')->default('unpaid');
            $table->date('paid_at')->nullable();
            $table->string('method')->nullable();
            $table->string('paid_via')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
