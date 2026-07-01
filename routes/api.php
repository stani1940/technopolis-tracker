<?php

use App\Http\Controllers\CrawlRunController;
use App\Http\Controllers\Internal\CrawlResultsController;
use App\Http\Controllers\ProductController;
use App\Http\Middleware\VerifyInternalCrawlerToken;
use Illuminate\Support\Facades\Route;

Route::get('/products', [ProductController::class, 'apiIndex']);
Route::get('/products/{product}/price-history', [ProductController::class, 'priceHistory']);
Route::get('/crawl-runs', [CrawlRunController::class, 'index']);

Route::post('/internal/crawl-results', [CrawlResultsController::class, 'store'])
    ->middleware(VerifyInternalCrawlerToken::class);
