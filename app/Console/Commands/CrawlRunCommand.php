<?php

namespace App\Console\Commands;

use App\Models\CrawlRun;
use App\Models\Site;
use App\Services\Crawler\CrawlImportService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Str;

class CrawlRunCommand extends Command
{
    protected $signature = 'crawl:run {--site= : Site slug to crawl (default: first active site)} {--dry-run : Run scraper only, skip database import}';

    protected $description = 'Run the Playwright scraper and import results';

    public function handle(CrawlImportService $importService): int
    {
        if (! config('crawler.enabled')) {
            $this->warn('Crawler is disabled. Set CRAWLER_ENABLED=true in .env');

            return self::SUCCESS;
        }

        // Resolve site: use --site option or fall back to first active site
        $siteSlug = $this->option('site');
        $site = $siteSlug
            ? Site::query()->where('slug', $siteSlug)->firstOrFail()
            : Site::query()->where('is_active', true)->first();

        $categoryUrls = $site
            ? implode(',', $site->getCategoryUrls())
            : implode(',', config('crawler.category_urls'));

        $crawlRun = CrawlRun::query()->create([
            'site_id' => $site?->id,
            'started_at' => now(),
            'status' => CrawlRun::STATUS_RUNNING,
            'category_url' => $categoryUrls,
        ]);

        $this->info("Started crawl run #{$crawlRun->id}".($site ? " for site \"{$site->name}\"" : ''));

        $scraperPath = config('crawler.scraper_path');
        $outputPath = config('crawler.output_path');

        if (! is_dir($outputPath)) {
            mkdir($outputPath, 0755, true);
        }

        $env = [
            'CRAWLER_ENABLED' => 'true',
            'CRAWLER_CATEGORY_URLS' => $categoryUrls,
            'CRAWLER_OUTPUT_DIR' => $outputPath,
            'CRAWLER_DEEP_CRAWL' => config('crawler.deep_crawl') ? 'true' : 'false',
            'CRAWLER_CONCURRENCY' => (string) config('crawler.concurrency'),
        ];

        $npmBinary = config('crawler.npm_binary');

        $result = Process::path($scraperPath)
            ->env($env)
            ->timeout(3600)
            ->run("{$npmBinary} run crawl");

        if ($result->errorOutput()) {
            $this->line($result->errorOutput());
        }

        if (! $result->successful()) {
            $crawlRun->update([
                'finished_at' => now(),
                'status' => CrawlRun::STATUS_FAILED,
                'errors_count' => 1,
                'error_log' => [
                    ['url' => 'scraper', 'message' => $result->errorOutput() ?: 'Scraper process failed'],
                ],
            ]);

            $this->error('Scraper failed.');

            return self::FAILURE;
        }

        $latestFile = collect(glob($outputPath.DIRECTORY_SEPARATOR.'*.ndjson') ?: [])
            ->sortByDesc(fn (string $path) => filemtime($path))
            ->first();

        if (! $latestFile) {
            $crawlRun->update([
                'finished_at' => now(),
                'status' => CrawlRun::STATUS_FAILED,
                'errors_count' => 1,
                'error_log' => [
                    ['url' => 'scraper', 'message' => 'No NDJSON output file found'],
                ],
            ]);

            $this->error('No crawl output file found.');

            return self::FAILURE;
        }

        $this->info('Scraper output: '.Str::after($latestFile, base_path().DIRECTORY_SEPARATOR));

        if ($this->option('dry-run')) {
            $this->warn('Dry run enabled — skipping database import.');

            return self::SUCCESS;
        }

        $stats = $importService->importFile($latestFile, $crawlRun, $site);

        $this->info("Imported {$stats['products']} products into the database.");

        return self::SUCCESS;
    }
}
