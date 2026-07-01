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
        Schema::table('crawl_runs', function (Blueprint $table) {
            $table->text('category_url')->nullable()->after('error_log');
        });
    }

    public function down(): void
    {
        Schema::table('crawl_runs', function (Blueprint $table) {
            $table->dropColumn('category_url');
        });
    }
};
