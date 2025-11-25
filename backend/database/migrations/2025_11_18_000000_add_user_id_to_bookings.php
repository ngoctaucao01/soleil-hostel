<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->after('id')->constrained()->onDelete('cascade');
            // Add indexes for better query performance
            $table->index(['user_id']);
            $table->index(['room_id', 'check_in', 'check_out']);
            $table->index(['status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropForeignIdFor(\App\Models\User::class);
            $table->dropIndex(['user_id']);
            $table->dropIndex(['room_id', 'check_in', 'check_out']);
            $table->dropIndex(['status']);
        });
    }
};
