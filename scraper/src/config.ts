import 'dotenv/config';

function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
    if (value === undefined) {
        return defaultValue;
    }

    return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

function parseInteger(value: string | undefined, defaultValue: number): number {
    if (value === undefined) {
        return defaultValue;
    }

    const parsed = Number.parseInt(value, 10);

    return Number.isFinite(parsed) ? parsed : defaultValue;
}

export const config = {
    enabled: parseBoolean(process.env.CRAWLER_ENABLED, true),
    headless: parseBoolean(process.env.CRAWLER_HEADLESS, true),
    userAgent:
        process.env.CRAWLER_USER_AGENT ??
        'TechnopolisPriceTracker/1.0 (+https://localhost; personal research)',
    minDelayMs: parseInteger(process.env.CRAWLER_MIN_DELAY_MS, 1500),
    maxDelayMs: parseInteger(process.env.CRAWLER_MAX_DELAY_MS, 3000),
    concurrency: parseInteger(process.env.CRAWLER_CONCURRENCY, 2),
    deepCrawl: parseBoolean(process.env.CRAWLER_DEEP_CRAWL, false),
    categoryUrls: (process.env.CRAWLER_CATEGORY_URLS ?? '')
        .split(',')
        .map((url) => url.trim())
        .filter(Boolean),
    outputDir: process.env.CRAWLER_OUTPUT_DIR ?? '../crawl_output',
    maxPages: parseInteger(process.env.CRAWLER_MAX_PAGES, 0),
};

export function randomDelayMs(): number {
    const { minDelayMs, maxDelayMs } = config;

    return minDelayMs + Math.floor(Math.random() * (maxDelayMs - minDelayMs + 1));
}

export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
