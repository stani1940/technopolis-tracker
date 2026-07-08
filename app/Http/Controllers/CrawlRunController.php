<?php

namespace App\Http\Controllers;

use App\Models\CrawlRun;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

class CrawlRunController extends Controller
{
    public function index(): Response
    {
        $runs = CrawlRun::query()
            ->latest('started_at')
            ->paginate(20)
            ->through(fn (CrawlRun $run) => [
                'id' => $run->id,
                'status' => $run->status,
                'startedAt' => $run->started_at->toIso8601String(),
                'finishedAt' => $run->finished_at?->toIso8601String(),
                'pagesCrawled' => $run->pages_crawled,
                'productsFound' => $run->products_found,
                'errorsCount' => $run->errors_count,
                'categoryUrl' => $run->category_url,
                'durationSeconds' => $run->finished_at
                    ? $run->started_at->diffInSeconds($run->finished_at)
                    : null,
            ]);

        return Inertia::render('crawl-runs/index', [
            'runs' => $runs,
        ]);
    }

    public function apiIndex(): JsonResponse
    {
        $runs = CrawlRun::query()
            ->latest('started_at')
            ->limit(10)
            ->get()
            ->map(fn (CrawlRun $run) => [
                'id' => $run->id,
                'status' => $run->status,
                'startedAt' => $run->started_at->toIso8601String(),
                'finishedAt' => $run->finished_at?->toIso8601String(),
                'pagesCrawled' => $run->pages_crawled,
                'productsFound' => $run->products_found,
                'errorsCount' => $run->errors_count,
            ]);

        return response()->json(['data' => $runs]);
    }
}
