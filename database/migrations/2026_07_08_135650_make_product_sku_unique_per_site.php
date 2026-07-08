<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // Different sites may use overlapping SKU ranges, so SKU is only unique per site
            $table->dropUnique(['technopolis_sku']);
            $table->unique(['site_id', 'technopolis_sku']);
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropUnique(['site_id', 'technopolis_sku']);
            $table->unique(['technopolis_sku']);
        });
    }
};
