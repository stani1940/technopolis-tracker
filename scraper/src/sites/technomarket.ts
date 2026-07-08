import type { Page } from 'playwright';
import { normalizePrices, parsePriceAmount } from '../parser.js';
import type { CrawledCategory, CrawledProduct } from '../types.js';
import type { SiteAdapter } from './types.js';

const BASE_URL = 'https://www.technomarket.bg';

function absolute(url: string): string {
    return new URL(url, BASE_URL).toString();
}

function slugFromPath(url: string): string {
    try {
        const segments = new URL(url, BASE_URL).pathname.split('/').filter(Boolean);

        return segments.at(-1) ?? 'unknown';
    } catch {
        return 'unknown';
    }
}

/**
 * Technomarket product URLs end with an 8-digit SKU: /peralni/neo-wm-sin601026-ng-09240876
 */
function skuFromProductUrl(url: string): string | null {
    return url.match(/-(\d{7,9})(?:[/?#]|$)/)?.[1] ?? null;
}

export const technomarketAdapter: SiteAdapter = {
    slug: 'technomarket',

    matches(url: string): boolean {
        return url.includes('technomarket.bg');
    },

    async waitForListing(page: Page): Promise<void> {
        await page.waitForLoadState('domcontentloaded');
        // Angular SPA: wait for product cards to render, networkidle never settles
        await page.locator('tm-product-item[data-product]').first().waitFor({ timeout: 45000 });
    },

    async dismissBanners(page: Page): Promise<void> {
        const acceptButton = page
            .locator('tm-terms-consent button, [class*="consent"] button, [class*="cookie"] button')
            .filter({ hasText: /приемам|разбрах|съгласен|ok/i })
            .first();

        if (await acceptButton.isVisible({ timeout: 3000 }).catch(() => false)) {
            await acceptButton.click().catch(() => undefined);
            await page.waitForTimeout(400);
        }
    },

    async extractProducts(page: Page, categoryUrl: string, capturedAt: string): Promise<CrawledProduct[]> {
        const pageTitle = await page.title().catch(() => '');
        const category: CrawledCategory = {
            technopolisCategoryId: null,
            name: pageTitle.replace(/\s*[|–-]\s*Техномаркет.*$/i, '').trim() || 'Technomarket',
            slug: slugFromPath(categoryUrl),
            url: absolute(categoryUrl),
        };

        const cards = page.locator('tm-product-item[data-product]');
        const count = await cards.count();
        const products = new Map<string, CrawledProduct>();

        for (let index = 0; index < count; index++) {
            const card = cards.nth(index);
            const sku = (await card.getAttribute('data-product')) ?? '';
            const titleLink = card.locator('a.title').first();
            const href = await titleLink.getAttribute('href');

            if (!sku || !href) {
                continue;
            }

            const url = absolute(href);
            // Name is split into .type + .brand + .name spans
            const name = (await titleLink.textContent())?.replace(/\s+/g, ' ').trim();

            if (!name) {
                continue;
            }

            const brand = (await titleLink.getAttribute('data-brand'))?.trim() || null;
            const imageUrl = await card.locator('a.product-image img').first().getAttribute('src');

            // Current price lives in .price-block .price (old price is in .old-price — skip it)
            const priceBgnText = await card
                .locator('.price-block .price .bgn_price')
                .first()
                .textContent()
                .catch(() => null);
            const priceEurText = await card
                .locator('.price-block .price .euro_price')
                .first()
                .textContent()
                .catch(() => null);

            const { priceBgn, priceEur } = normalizePrices(
                parsePriceAmount(priceBgnText),
                parsePriceAmount(priceEurText),
            );

            const hasBuy = await card
                .locator('button[data-action="addCart"]')
                .first()
                .isVisible()
                .catch(() => false);

            products.set(sku, {
                technopolisSku: sku,
                name,
                slug: slugFromPath(url),
                url,
                brand,
                imageUrl: imageUrl ? absolute(imageUrl) : null,
                priceBgn,
                priceEur,
                currency: 'BGN',
                inStock: hasBuy || priceBgn !== null,
                category,
                capturedAt,
            });
        }

        return [...products.values()];
    },

    async findNextPageUrl(page: Page, currentUrl: string): Promise<string | null> {
        const pageUrl = page.url() || currentUrl;

        // Pagination footer: .pages > a (next arrow has .page-arrowN inside, disabled class when on last page)
        const nextLink = page
            .locator('.filter-footer .pages a:not(.disabled)')
            .filter({ has: page.locator('.page-arrowN') })
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
    },
};
