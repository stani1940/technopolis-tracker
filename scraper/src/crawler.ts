import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium, type Browser, type Page } from 'playwright';
import { config, randomDelayMs, sleep } from './config.js';
import { dismissCookieBanner, extractProductsLive, waitForListing } from './extract.js';
import type { CrawlError, CrawlLine, CrawlSummary, CrawledProduct } from './types.js';

const MAX_RETRIES = 3;

async function launchBrowser(): Promise<Browser> {
    return chromium.launch({
        headless: config.headless,
        channel: process.env.CRAWLER_BROWSER_CHANNEL ?? 'chrome',
    });
}

async function navigateWithRetry(page: Page, url: string): Promise<void> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const response = await page.goto(url, {
                waitUntil: 'domcontentloaded',
                timeout: 60000,
            });

            if (response && response.status() >= 400) {
                throw new Error(`HTTP ${response.status()} for ${url}`);
            }

            await waitForListing(page);
            await dismissCookieBanner(page);

            return;
        } catch (error) {
            lastError = error;

            if (attempt < MAX_RETRIES) {
                await sleep(1000 * attempt);
            }
        }
    }

    throw lastError;
}

async function findNextPageUrl(page: Page, currentUrl: string): Promise<string | null> {
    // Use the actual page URL (after any redirects) as base for resolving relative hrefs
    const pageUrl = page.url() || currentUrl;

    // cx-pagination uses a.next; when on last page the link gets class "disabled"
    const nextLink = page
        .locator('cx-pagination a.next:not(.disabled), a[rel="next"]:not(.disabled)')
        .first();

    if (!(await nextLink.isVisible({ timeout: 2000 }).catch(() => false))) {
        return null;
    }

    const href = await nextLink.getAttribute('href');

    if (!href) {
        return null;
    }

    const nextUrl = new URL(href, pageUrl).toString();
    const resolvedCurrent = new URL(pageUrl).toString();

    return nextUrl === resolvedCurrent ? null : nextUrl;
}

export async function crawlCategoryUrls(categoryUrls: string[]): Promise<{ products: CrawledProduct[]; summary: CrawlSummary }> {
    if (!config.enabled) {
        throw new Error('Crawler is disabled. Set CRAWLER_ENABLED=true to run.');
    }

    const startedAt = new Date().toISOString();
    const errors: CrawlError[] = [];
    const products = new Map<string, CrawledProduct>();
    let pagesCrawled = 0;

    const browser = await launchBrowser();
    const context = await browser.newContext({
        userAgent: config.userAgent,
        locale: 'bg-BG',
    });
    const page = await context.newPage();

    try {
        for (const categoryUrl of categoryUrls) {
            let currentUrl: string | null = categoryUrl;
            let pageIndex = 0;

            while (currentUrl) {
                pageIndex++;
                pagesCrawled++;

                if (config.maxPages > 0 && pageIndex > config.maxPages) {
                    break;
                }

                try {
                    await navigateWithRetry(page, currentUrl);
                    await sleep(randomDelayMs());

                    const capturedAt = new Date().toISOString();
                    const pageProducts = await extractProductsLive(page, currentUrl, capturedAt);

                    for (const product of pageProducts) {
                        products.set(product.technopolisSku, product);
                    }

                    console.error(`[crawl] ${currentUrl} -> ${pageProducts.length} products`);
                } catch (error) {
                    const message = error instanceof Error ? error.message : String(error);
                    errors.push({ url: currentUrl, message });
                    console.error(`[crawl:error] ${currentUrl}: ${message}`);
                    break;
                }

                currentUrl = await findNextPageUrl(page, currentUrl);

                if (currentUrl) {
                    await sleep(randomDelayMs());
                }
            }
        }
    } finally {
        await browser.close();
    }

    const finishedAt = new Date().toISOString();

    return {
        products: [...products.values()],
        summary: {
            startedAt,
            finishedAt,
            categoryUrl: categoryUrls.join(','),
            pagesCrawled,
            productsFound: products.size,
            errorsCount: errors.length,
            errors,
        },
    };
}

export async function writeNdjson(outputPath: string, products: CrawledProduct[], summary: CrawlSummary): Promise<void> {
    await mkdir(path.dirname(outputPath), { recursive: true });

    const lines: CrawlLine[] = [
        ...products.map((product) => ({ type: 'product' as const, product })),
        { type: 'summary' as const, summary },
    ];

    const payload = lines.map((line) => JSON.stringify(line)).join('\n') + '\n';
    await writeFile(outputPath, payload, 'utf8');
}
