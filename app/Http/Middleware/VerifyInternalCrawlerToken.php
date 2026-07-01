<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VerifyInternalCrawlerToken
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = config('crawler.internal_token');

        if (blank($token)) {
            abort(503, 'Crawler internal token is not configured.');
        }

        $provided = $request->bearerToken() ?? $request->header('X-Crawler-Token');

        if (! hash_equals($token, (string) $provided)) {
            abort(401, 'Invalid crawler token.');
        }

        return $next($request);
    }
}
