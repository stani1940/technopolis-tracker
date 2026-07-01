<?php

return [
    'enabled' => env('CRAWLER_ENABLED', false),

    'interval_hours' => (int) env('CRAWLER_INTERVAL_HOURS', 6),

    'category_urls' => array_values(array_filter(array_map(
        trim(...),
        explode(',', (string) env('CRAWLER_CATEGORY_URLS', 'https://www.technopolis.bg/bg/c/Promotions')),
    ))),

    'deep_crawl' => env('CRAWLER_DEEP_CRAWL', false),

    'concurrency' => (int) env('CRAWLER_CONCURRENCY', 2),

    'internal_token' => env('CRAWLER_INTERNAL_TOKEN'),

    'scraper_path' => env('CRAWLER_SCRAPER_PATH', base_path('scraper')),

    'output_path' => env('CRAWLER_OUTPUT_PATH', base_path('crawl_output')),

    'node_binary' => env('CRAWLER_NODE_BINARY', 'node'),

    'npm_binary' => env('CRAWLER_NPM_BINARY', 'npm'),
];
