<?php

namespace App\Console\Commands;

use App\Models\CrawlRun;
use App\Services\Crawler\CrawlImportService;
use Illuminate\Console\Command;

class CrawlImportCommand extends Command
{
    protected $signature = 'crawl:import {file : Path to NDJSON crawl output} {--run-id= : Existing crawl run ID to update}';

    protected $description = 'Import scraped NDJSON results into the database';

    public function handle(CrawlImportService $importService): int
    {
        $file = $this->argument('file');

        if (! is_file($file)) {
            $this->error("File not found: {$file}");

            return self::FAILURE;
        }

        $crawlRun = null;

        if ($runId = $this->option('run-id')) {
            $crawlRun = CrawlRun::query()->find($runId);
        } else {
            $crawlRun = CrawlRun::query()->create([
                'started_at' => now(),
                'status' => CrawlRun::STATUS_RUNNING,
            ]);
        }

        $stats = $importService->importFile($file, $crawlRun);

        $this->info("Imported {$stats['products']} products, {$stats['snapshots']} snapshots, {$stats['categories']} new categories.");

        return self::SUCCESS;
    }
}
