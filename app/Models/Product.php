<?php

namespace App\Models;

use Database\Factories\ProductFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int|null $site_id
 * @property string $technopolis_sku
 * @property string $name
 * @property string $slug
 * @property string $url
 * @property int|null $category_id
 * @property string|null $brand
 * @property string|null $image_url
 * @property Carbon|null $first_seen_at
 * @property Carbon|null $last_seen_at
 * @property bool $is_active
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'site_id',
    'technopolis_sku',
    'name',
    'slug',
    'url',
    'category_id',
    'brand',
    'image_url',
    'first_seen_at',
    'last_seen_at',
    'is_active',
])]
class Product extends Model
{
    /** @use HasFactory<ProductFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'first_seen_at' => 'datetime',
            'last_seen_at' => 'datetime',
            'is_active' => 'boolean',
        ];
    }

    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function priceSnapshots(): HasMany
    {
        return $this->hasMany(PriceSnapshot::class);
    }

    public function latestPriceSnapshot(): HasOne
    {
        return $this->hasOne(PriceSnapshot::class)->latestOfMany('captured_at');
    }
}
