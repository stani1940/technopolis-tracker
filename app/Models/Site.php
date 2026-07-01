<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $name
 * @property string $slug
 * @property string $base_url
 * @property string|null $logo_url
 * @property bool $is_active
 * @property array<string, mixed>|null $scraper_config
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
#[Fillable([
    'name',
    'slug',
    'base_url',
    'logo_url',
    'is_active',
    'scraper_config',
])]
class Site extends Model
{
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'scraper_config' => 'array',
        ];
    }

    public function categories(): HasMany
    {
        return $this->hasMany(Category::class);
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    public function crawlRuns(): HasMany
    {
        return $this->hasMany(CrawlRun::class);
    }

    /** Convenience: returns category_urls from scraper_config */
    public function getCategoryUrls(): array
    {
        return $this->scraper_config['category_urls'] ?? [];
    }
}
