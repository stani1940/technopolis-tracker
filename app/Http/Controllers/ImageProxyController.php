<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ImageProxyController extends Controller
{
    private const ALLOWED_HOST = 'api.technopolis.bg';

    private const CACHE_DISK = 'local';

    private const CACHE_TTL_HOURS = 48;

    public function show(Request $request): BinaryFileResponse|StreamedResponse
    {
        $url = (string) $request->query('url', '');

        if (! $this->isAllowedUrl($url)) {
            abort(400, 'Invalid image URL.');
        }

        $cacheKey = 'img_cache/'.md5($url);
        $metaKey = $cacheKey.'.meta';

        // Serve from cache if fresh
        if (Storage::disk(self::CACHE_DISK)->exists($cacheKey)) {
            $meta = json_decode(Storage::disk(self::CACHE_DISK)->get($metaKey) ?? '{}', true);
            $cachedAt = $meta['cached_at'] ?? 0;

            if ((time() - $cachedAt) < self::CACHE_TTL_HOURS * 3600) {
                $contentType = $meta['content_type'] ?? 'image/jpeg';
                $path = Storage::disk(self::CACHE_DISK)->path($cacheKey);

                return response()->file($path, [
                    'Content-Type' => $contentType,
                    'Cache-Control' => 'public, max-age=86400',
                ]);
            }
        }

        // Fetch from origin
        $response = Http::withHeaders([
            'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer' => 'https://www.technopolis.bg/',
            'Accept' => 'image/webp,image/apng,image/*,*/*;q=0.8',
        ])->timeout(10)->get($url);

        if (! $response->successful()) {
            abort(404);
        }

        $contentType = $response->header('Content-Type') ?: 'image/jpeg';
        $body = $response->body();

        // Persist to cache
        Storage::disk(self::CACHE_DISK)->put($cacheKey, $body);
        Storage::disk(self::CACHE_DISK)->put($metaKey, json_encode([
            'content_type' => $contentType,
            'cached_at' => time(),
        ]));

        return response()->stream(function () use ($body) {
            echo $body;
        }, 200, [
            'Content-Type' => $contentType,
            'Cache-Control' => 'public, max-age=86400',
            'Content-Length' => strlen($body),
        ]);
    }

    private function isAllowedUrl(string $url): bool
    {
        if ($url === '') {
            return false;
        }

        $parsed = parse_url($url);

        return isset($parsed['host']) && $parsed['host'] === self::ALLOWED_HOST;
    }
}
