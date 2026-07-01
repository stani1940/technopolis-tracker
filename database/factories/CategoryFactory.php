<?php

namespace Database\Factories;

use App\Models\Category;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Category>
 */
class CategoryFactory extends Factory
{
    protected $model = Category::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->words(2, true);

        return [
            'technopolis_category_id' => (string) fake()->unique()->numerify('cat-#####'),
            'name' => ucfirst($name),
            'slug' => Str::slug($name),
            'parent_id' => null,
            'url' => 'https://www.technopolis.bg/bg/'.Str::slug($name).'/c/'.fake()->unique()->numerify('####'),
        ];
    }
}
