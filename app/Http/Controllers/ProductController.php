<?php

namespace App\Http\Controllers;

use App\Models\CrawlRun;
use App\Models\PriceSnapshot;
use App\Models\Product;
use App\Models\Site;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class ProductController extends Controller
{
    public function index(Request $request): InertiaResponse
    {
        $search = $request->string('search')->trim()->toString();
        $categoryId = $request->integer('category_id') ?: null;
        $siteId = $request->integer('site_id') ?: null;
        $sort = $request->string('sort')->toString() ?: 'name';

        $products = Product::query()
            ->with(['category', 'latestPriceSnapshot', 'site'])
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($query) use ($search) {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('technopolis_sku', 'like', "%{$search}%")
                        ->orWhere('brand', 'like', "%{$search}%");
                });
            })
            ->when($categoryId, fn ($query) => $query->where('category_id', $categoryId))
            ->when($siteId, fn ($query) => $query->where('site_id', $siteId))
            ->when($sort === 'price_asc', function ($query) {
                $query->orderBy(
                    PriceSnapshot::select('price_bgn')
                        ->whereColumn('product_id', 'products.id')
                        ->latest('captured_at')
                        ->limit(1),
                );
            })
            ->when($sort === 'price_desc', function ($query) {
                $query->orderByDesc(
                    PriceSnapshot::select('price_bgn')
                        ->whereColumn('product_id', 'products.id')
                        ->latest('captured_at')
                        ->limit(1),
                );
            })
            ->when(! in_array($sort, ['price_asc', 'price_desc'], true), fn ($query) => $query->orderBy('name'))
            ->paginate(24)
            ->withQueryString()
            ->through(fn (Product $product) => $this->transformProduct($product));

        $latestCrawlRun = CrawlRun::query()->latest('started_at')->first();

        return Inertia::render('products/index', [
            'products' => $products,
            'sites' => Site::query()
                ->orderBy('name')
                ->get(['id', 'name', 'slug'])
                ->map(fn (Site $site) => [
                    'id' => $site->id,
                    'name' => $site->name,
                    'slug' => $site->slug,
                ]),
            'filters' => [
                'search' => $search,
                'category_id' => $categoryId,
                'site_id' => $siteId,
                'sort' => $sort,
            ],
            'crawlStatus' => $latestCrawlRun ? [
                'id' => $latestCrawlRun->id,
                'status' => $latestCrawlRun->status,
                'startedAt' => $latestCrawlRun->started_at?->toIso8601String(),
                'finishedAt' => $latestCrawlRun->finished_at?->toIso8601String(),
                'pagesCrawled' => $latestCrawlRun->pages_crawled,
                'productsFound' => $latestCrawlRun->products_found,
                'errorsCount' => $latestCrawlRun->errors_count,
            ] : null,
            'stats' => [
                'totalProducts' => Product::query()->count(),
                'activeProducts' => Product::query()->where('is_active', true)->count(),
            ],
        ]);
    }

    public function show(Product $product): InertiaResponse
    {
        $product->load(['category', 'latestPriceSnapshot']);

        $snapshots = $product->priceSnapshots()
            ->orderBy('captured_at')
            ->get(['captured_at', 'price_bgn', 'price_eur', 'in_stock'])
            ->map(fn (PriceSnapshot $s) => [
                'date' => $s->captured_at->format('Y-m-d H:i'),
                'priceBgn' => $s->price_bgn ? (float) $s->price_bgn : null,
                'priceEur' => $s->price_eur ? (float) $s->price_eur : null,
                'inStock' => $s->in_stock,
            ]);

        $prices = $snapshots->pluck('priceBgn')->filter();

        return Inertia::render('products/show', [
            'product' => $this->transformProduct($product),
            'history' => $snapshots,
            'summary' => [
                'current' => $snapshots->last()['priceBgn'] ?? null,
                'lowest' => $prices->min(),
                'highest' => $prices->max(),
                'dataPoints' => $snapshots->count(),
            ],
        ]);
    }

    public function apiIndex(Request $request): JsonResponse
    {
        $search = $request->string('search')->trim()->toString();

        $products = Product::query()
            ->with(['category', 'latestPriceSnapshot'])
            ->when($search !== '', fn ($query) => $query->where('name', 'like', "%{$search}%"))
            ->orderBy('name')
            ->paginate(24);

        return response()->json([
            'data' => $products->through(fn (Product $product) => $this->transformProduct($product)),
            'meta' => [
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
            ],
        ]);
    }

    public function priceHistory(Product $product): JsonResponse
    {
        $snapshots = $product->priceSnapshots()
            ->orderBy('captured_at')
            ->get(['captured_at', 'price_bgn', 'price_eur', 'in_stock']);

        $prices = $snapshots->pluck('price_bgn')->filter();

        return response()->json([
            'product' => $this->transformProduct($product->load(['category', 'latestPriceSnapshot'])),
            'history' => $snapshots,
            'summary' => [
                'current' => $snapshots->last()?->price_bgn,
                'lowest' => $prices->min(),
                'highest' => $prices->max(),
            ],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function transformProduct(Product $product): array
    {
        $latest = $product->latestPriceSnapshot;

        return [
            'id' => $product->id,
            'technopolisSku' => $product->technopolis_sku,
            'name' => $product->name,
            'slug' => $product->slug,
            'url' => $product->url,
            'brand' => $product->brand,
            'imageUrl' => $product->image_url,
            'imageProxyUrl' => $product->image_url
                ? url('/img-proxy?url='.urlencode($product->image_url))
                : null,
            'category' => $product->category?->only(['id', 'name', 'slug']),
            'site' => $product->relationLoaded('site') && $product->site
                ? $product->site->only(['id', 'name', 'slug'])
                : null,
            'currentPriceBgn' => $latest?->price_bgn,
            'currentPriceEur' => $latest?->price_eur,
            'inStock' => $latest?->in_stock,
            'lastSeenAt' => $product->last_seen_at?->toIso8601String(),
        ];
    }
}
