<?php

namespace Database\Factories;

use App\Models\PriceSnapshot;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PriceSnapshot>
 */
class PriceSnapshotFactory extends Factory
{
    protected $model = PriceSnapshot::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $priceBgn = fake()->randomFloat(2, 49, 4999);

        return [
            'product_id' => Product::factory(),
            'price_bgn' => $priceBgn,
            'price_eur' => round($priceBgn / 1.95583, 2),
            'currency' => 'BGN',
            'in_stock' => fake()->boolean(85),
            'captured_at' => now(),
        ];
    }
}
