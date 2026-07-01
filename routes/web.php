<?php

use App\Http\Controllers\Admin\SiteController as AdminSiteController;
use App\Http\Controllers\CrawlRunController;
use App\Http\Controllers\ImageProxyController;
use App\Http\Controllers\ProductController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::get('/img-proxy', [ImageProxyController::class, 'show'])->name('img.proxy');
Route::get('/products', [ProductController::class, 'index'])->name('products.index');
Route::get('/products/{product}', [ProductController::class, 'show'])->name('products.show');
Route::get('/crawl-runs', [CrawlRunController::class, 'index'])->name('crawl-runs.index');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');

    Route::prefix('admin')->name('admin.')->group(function () {
        Route::resource('sites', AdminSiteController::class);
    });
});

require __DIR__.'/settings.php';
