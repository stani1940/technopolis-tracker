<?php

namespace App\Http\Controllers\Internal;

use App\Http\Controllers\Controller;
use App\Models\CrawlRun;
use App\Services\Crawler\CrawlImportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CrawlResultsController extends Controller
{
    public function store(Request $request, CrawlImportService $importService): JsonResponse
    {
        $validated = $request->validate([
            'lines' => ['required', 'array'],
            'run_id' => ['nullable', 'integer', 'exists:crawl_runs,id'],
        ]);

        $crawlRun = isset($validated['run_id'])
            ? CrawlRun::query()->find((int) $validated['run_id'])
            : null;

        $stats = $importService->importPayload($validated['lines'], $crawlRun);

        return response()->json([
            'message' => 'Crawl results imported.',
            'stats' => $stats,
        ]);
    }
}
