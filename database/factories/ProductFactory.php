<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    protected $model = Product::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $sku = fake()->unique()->numerify('######');
        $name = fake()->word().' '.fake()->word().' '.fake()->word().' '.fake()->word();

        return [
            'technopolis_sku' => $sku,
            'name' => ucfirst($name),
            'slug' => Str::slug($name).'-'.$sku,
            'url' => 'https://www.technopolis.bg/bg/p/'.$sku,
            'category_id' => Category::factory(),
            'brand' => fake()->randomElement(['Samsung', 'Apple', 'Sony', 'LG', 'Lenovo']),
            'image_url' => fake()->imageUrl(640, 480, 'technics'),
            'first_seen_at' => now()->subDays(fake()->numberBetween(1, 30)),
            'last_seen_at' => now(),
            'is_active' => true,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }
}
