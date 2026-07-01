<?php

namespace Database\Factories;

use App\Models\CrawlRun;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CrawlRun>
 */
class CrawlRunFactory extends Factory
{
    protected $model = CrawlRun::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $startedAt = now()->subMinutes(fake()->numberBetween(5, 120));

        return [
            'started_at' => $startedAt,
            'finished_at' => $startedAt->copy()->addMinutes(fake()->numberBetween(2, 30)),
            'status' => CrawlRun::STATUS_COMPLETED,
            'pages_crawled' => fake()->numberBetween(1, 50),
            'products_found' => fake()->numberBetween(10, 500),
            'errors_count' => 0,
            'error_log' => null,
        ];
    }

    public function running(): static
    {
        return $this->state(fn (array $attributes) => [
            'finished_at' => null,
            'status' => CrawlRun::STATUS_RUNNING,
        ]);
    }

    public function failed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => CrawlRun::STATUS_FAILED,
            'errors_count' => fake()->numberBetween(1, 10),
            'error_log' => [
                ['url' => fake()->url(), 'message' => fake()->sentence()],
            ],
        ]);
    }
}
