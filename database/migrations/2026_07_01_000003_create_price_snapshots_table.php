<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('price_snapshots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->decimal('price_bgn', 10, 2)->nullable();
            $table->decimal('price_eur', 10, 2)->nullable();
            $table->string('currency', 3)->default('BGN');
            $table->boolean('in_stock')->default(true);
            $table->timestamp('captured_at');
            $table->timestamps();

            $table->index(['product_id', 'captured_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('price_snapshots');
    }
};
