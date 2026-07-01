<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('crawl:run')
    ->cron('0 */'.max(1, (int) config('crawler.interval_hours', 6)).' * * *')
    ->when(fn () => config('crawler.enabled'));
