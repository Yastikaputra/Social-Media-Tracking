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
        Schema::create('tracking_tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('brand_id')->constrained()->onDelete('cascade');
            $table->foreignId('platform_id')->constrained()->onDelete('cascade');
            $table->date('task_date');
            $table->string('title');
            $table->string('content_type')->default('Post/Content'); // 'Reels', 'Story', 'Feed', 'Broadcast', 'Ads', 'Direct Message'
            $table->text('link_url')->nullable();
            $table->string('screenshot_path')->nullable();
            $table->integer('leads_count')->default(0);
            $table->integer('reach_count')->default(0);
            $table->integer('engagement_count')->default(0);
            $table->text('notes')->nullable();
            $table->string('status')->default('completed'); // 'completed', 'in_progress', 'reviewed'
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tracking_tasks');
    }
};
