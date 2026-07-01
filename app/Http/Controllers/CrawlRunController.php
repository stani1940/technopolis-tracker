<?php

namespace App\Http\Controllers;

use App\Models\CrawlRun;
use Illuminate\Http\JsonResponse;

class CrawlRunController extends Controller
{
    public function index(): JsonResponse
    {
        $runs = CrawlRun::query()
            ->latest('started_at')
            ->limit(10)
            ->get()
            ->map(fn (CrawlRun $run) => [
                'id' => $run->id,
                'status' => $run->status,
                'startedAt' => $run->started_at?->toIso8601String(),
                'finishedAt' => $run->finished_at?->toIso8601String(),
                'pagesCrawled' => $run->pages_crawled,
                'productsFound' => $run->products_found,
                'errorsCount' => $run->errors_count,
            ]);

        return response()->json(['data' => $runs]);
    }
}
