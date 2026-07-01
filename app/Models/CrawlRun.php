<?php

namespace App\Models;

use Database\Factories\CrawlRunFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property Carbon $started_at
 * @property Carbon|null $finished_at
 * @property string $status
 * @property int $pages_crawled
 * @property int $products_found
 * @property int $errors_count
 * @property array<int, mixed>|null $error_log
 * @property int|null $site_id
 * @property string|null $category_url
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'site_id',
    'started_at',
    'finished_at',
    'status',
    'pages_crawled',
    'products_found',
    'errors_count',
    'error_log',
    'category_url',
])]
class CrawlRun extends Model
{
    /** @use HasFactory<CrawlRunFactory> */
    use HasFactory;

    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class);
    }

    public const STATUS_PENDING = 'pending';

    public const STATUS_RUNNING = 'running';

    public const STATUS_COMPLETED = 'completed';

    public const STATUS_FAILED = 'failed';

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'finished_at' => 'datetime',
            'error_log' => 'array',
        ];
    }
}
