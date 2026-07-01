<?php

namespace App\Services\Crawler;

use App\Models\Category;
use App\Models\CrawlRun;
use App\Models\PriceSnapshot;
use App\Models\Product;
use App\Models\Site;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;

class CrawlImportService
{
    /**
     * @return array{products: int, snapshots: int, categories: int}
     */
    public function importFile(string $path, ?CrawlRun $crawlRun = null, ?Site $site = null): array
    {
        if (! is_readable($path)) {
            throw new RuntimeException("Crawl output file is not readable: {$path}");
        }

        $handle = fopen($path, 'r');

        if ($handle === false) {
            throw new RuntimeException("Unable to open crawl output file: {$path}");
        }

        $stats = [
            'products' => 0,
            'snapshots' => 0,
            'categories' => 0,
        ];

        try {
            while (($line = fgets($handle)) !== false) {
                $line = trim($line);

                if ($line === '') {
                    continue;
                }

                /** @var array<string, mixed> $payload */
                $payload = json_decode($line, true, flags: JSON_THROW_ON_ERROR);

                if (($payload['type'] ?? null) === 'summary') {
                    $this->applySummary($crawlRun, $payload['summary'] ?? []);

                    continue;
                }

                if (($payload['type'] ?? null) !== 'product') {
                    continue;
                }

                $imported = $this->importProduct($payload['product'] ?? [], $site);
                $stats['products'] += $imported['products'];
                $stats['snapshots'] += $imported['snapshots'];
                $stats['categories'] += $imported['categories'];
            }
        } finally {
            fclose($handle);
        }

        return $stats;
    }

    /**
     * @param  array<string, mixed>  $lines
     * @return array{products: int, snapshots: int, categories: int}
     */
    public function importPayload(array $lines, ?CrawlRun $crawlRun = null, ?Site $site = null): array
    {
        $stats = [
            'products' => 0,
            'snapshots' => 0,
            'categories' => 0,
        ];

        foreach ($lines as $payload) {
            if (($payload['type'] ?? null) === 'summary') {
                $this->applySummary($crawlRun, $payload['summary'] ?? []);

                continue;
            }

            if (($payload['type'] ?? null) !== 'product') {
                continue;
            }

            $imported = $this->importProduct($payload['product'] ?? [], $site);
            $stats['products'] += $imported['products'];
            $stats['snapshots'] += $imported['snapshots'];
            $stats['categories'] += $imported['categories'];
        }

        return $stats;
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array{products: int, snapshots: int, categories: int}
     */
    public function importProduct(array $data, ?Site $site = null): array
    {
        return DB::transaction(function () use ($data, $site) {
            $categoryData = is_array($data['category'] ?? null) ? $data['category'] : [];
            $category = $this->upsertCategory($categoryData, $site);
            $capturedAt = $this->parseCapturedAt($data['capturedAt'] ?? null);

            $product = Product::query()->firstOrNew([
                'technopolis_sku' => (string) ($data['technopolisSku'] ?? ''),
            ]);

            $isNew = ! $product->exists;

            $product->fill([
                'site_id' => $site?->id ?? $product->site_id,
                'name' => (string) ($data['name'] ?? 'Unknown product'),
                'slug' => (string) ($data['slug'] ?? Str::slug((string) ($data['name'] ?? 'product'))),
                'url' => (string) ($data['url'] ?? ''),
                'category_id' => $category?->id,
                'brand' => $data['brand'] ?? null,
                'image_url' => $data['imageUrl'] ?? null,
                'last_seen_at' => $capturedAt,
                'is_active' => true,
            ]);

            if ($isNew) {
                $product->first_seen_at = $capturedAt;
            }

            $product->save();

            [$priceBgn, $priceEur] = $this->normalizePrices(
                isset($data['priceBgn']) ? (float) $data['priceBgn'] : null,
                isset($data['priceEur']) ? (float) $data['priceEur'] : null,
            );

            PriceSnapshot::query()->create([
                'product_id' => $product->id,
                'price_bgn' => $priceBgn,
                'price_eur' => $priceEur,
                'currency' => (string) ($data['currency'] ?? 'BGN'),
                'in_stock' => (bool) ($data['inStock'] ?? true),
                'captured_at' => $capturedAt,
            ]);

            return [
                'products' => 1,
                'snapshots' => 1,
                'categories' => $category && $category->wasRecentlyCreated ? 1 : 0,
            ];
        });
    }

    /**
     * @param  array<string, mixed>  $summary
     */
    public function applySummary(?CrawlRun $crawlRun, array $summary): void
    {
        if (! $crawlRun) {
            return;
        }

        $crawlRun->update([
            'finished_at' => isset($summary['finishedAt']) ? Carbon::parse($summary['finishedAt']) : now(),
            'status' => ($summary['errorsCount'] ?? 0) > 0
                ? CrawlRun::STATUS_FAILED
                : CrawlRun::STATUS_COMPLETED,
            'pages_crawled' => (int) ($summary['pagesCrawled'] ?? 0),
            'products_found' => (int) ($summary['productsFound'] ?? 0),
            'errors_count' => (int) ($summary['errorsCount'] ?? 0),
            'error_log' => $summary['errors'] ?? null,
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function upsertCategory(array $data, ?Site $site = null): ?Category
    {
        $url = (string) ($data['url'] ?? '');

        if ($url === '') {
            return null;
        }

        return Category::query()->updateOrCreate(
            ['url' => $url],
            [
                'site_id' => $site?->id,
                'technopolis_category_id' => $data['technopolisCategoryId'] ?? null,
                'name' => (string) ($data['name'] ?? 'Unknown category'),
                'slug' => (string) ($data['slug'] ?? Str::slug((string) ($data['name'] ?? 'category'))),
            ],
        );
    }

    private function parseCapturedAt(mixed $value): Carbon
    {
        if (is_string($value) && $value !== '') {
            return Carbon::parse($value);
        }

        return now();
    }

    /**
     * @return array{0: ?float, 1: ?float}
     */
    private function normalizePrices(?float $priceBgn, ?float $priceEur): array
    {
        $rate = 1.95583;

        if ($priceEur !== null && $priceBgn === null) {
            $priceBgn = round($priceEur * $rate, 2);
        }

        if ($priceBgn !== null && $priceEur === null) {
            $priceEur = round($priceBgn / $rate, 2);
        }

        return [$priceBgn, $priceEur];
    }
}
