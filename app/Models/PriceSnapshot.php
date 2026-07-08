<?php

namespace App\Models;

use Database\Factories\PriceSnapshotFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $product_id
 * @property string|null $price_bgn
 * @property string|null $price_eur
 * @property string $currency
 * @property bool $in_stock
 * @property Carbon $captured_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'product_id',
    'price_bgn',
    'price_eur',
    'currency',
    'in_stock',
    'captured_at',
])]
class PriceSnapshot extends Model
{
    /** @use HasFactory<PriceSnapshotFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'price_bgn' => 'decimal:2',
            'price_eur' => 'decimal:2',
            'in_stock' => 'boolean',
            'captured_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Product, $this>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
