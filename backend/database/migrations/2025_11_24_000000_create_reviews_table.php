<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Creates reviews table with HTML-safe fields
     * All HTML content fields are TEXT (large content support)
     */
    public function up(): void
    {
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            
            // Foreign keys
            $table->foreignId('room_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            
            // Content fields - stored as purified HTML
            // Never store raw user HTML - always purify on input!
            $table->string('title', 255)->comment('Review title (purified)');
            $table->text('content')->comment('Review body (purified HTML, <1000 chars)');
            
            // Guest info (purified via Purifiable trait)
            $table->string('guest_name', 255)->comment('Guest name (purified)');
            $table->string('guest_email', 255)->nullable();
            
            // Rating
            $table->unsignedTinyInteger('rating')->comment('1-5 stars');
            
            // Moderation
            $table->boolean('approved')->default(true)->comment('Admin-approved flag');
            
            // Timestamps
            $table->timestamps();
            
            // Indexes for queries
            $table->index('room_id');
            $table->index('user_id');
            $table->index('rating');
            $table->index('approved');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reviews');
    }
};
