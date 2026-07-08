import type { Page } from 'playwright';
import {
    absoluteUrl,
    extractBrandFromName,
    extractCategoryIdFromUrl,
    parseDualPriceText,
    slugFromUrl,
} from '../parser.js';
import type { CrawledCategory, CrawledProduct } from '../types.js';
import type { SiteAdapter } from './types.js';

export const technopolisAdapter: SiteAdapter = {
    slug: 'technopolis',

    matches(url: string): boolean {
        return url.includes('technopolis.bg');
    },

    async waitForListing(page: Page): Promise<void> {
        await page.waitForLoadState('domcontentloaded');
        await page.waitForLoadState('networkidle', { timeout: 45000 }).catch(() => undefined);
        await page.locator('te-product-box[data-product-id]').first().waitFor({ timeout: 45000 });
    },

    async dismissBanners(page: Page): Promise<void> {
        const acceptButton = page.getByRole('button', { name: /приемам|accept|съгласен/i }).first();

        if (await acceptButton.isVisible({ timeout: 4000 }).catch(() => false)) {
            await acceptButton.click();
            await page.waitForTimeout(400);
        }
    },

    async extractProducts(page: Page, categoryUrl: string, capturedAt: string): Promise<CrawledProduct[]> {
        const categoryName = await page.locator('h1.content-title').first().textContent().catch(() => null);
        const category: CrawledCategory = {
            technopolisCategoryId: extractCategoryIdFromUrl(categoryUrl),
            name: (categoryName ?? 'Unknown category').replace(/\s*Намерени:\s*\d+\s*$/i, '').trim(),
            slug: slugFromUrl(categoryUrl),
            url: absoluteUrl(categoryUrl),
        };

        const boxes = page.locator('te-product-box[data-product-id]');
        const count = await boxes.count();
        const products = new Map<string, CrawledProduct>();

        for (let index = 0; index < count; index++) {
            const box = boxes.nth(index);
            const sku = (await box.getAttribute('data-product-id')) ?? '';
            const nameLink = box.locator('.product-box__middle a').first();
            const href = await nameLink.getAttribute('href');
            const name = (await nameLink.textContent())?.replace(/\s+/g, ' ').trim();

            if (!sku || !href || !name) {
                continue;
            }

            const url = absoluteUrl(href);
            const imageUrl = await box.locator('img').first().getAttribute('src');
            const priceText = (await box.locator('.product-box__price').first().textContent())?.replace(/\s+/g, ' ') ?? '';
            const { priceBgn, priceEur } = parseDualPriceText(priceText);
            const outOfStock = await box.getByText(/изчерпан|няма наличност/i).isVisible().catch(() => false);
            const hasBuy = await box.locator('.js-add__cart, .button-buy').first().isVisible().catch(() => false);

            products.set(sku, {
                technopolisSku: sku,
                name,
                slug: slugFromUrl(url),
                url,
                brand: extractBrandFromName(name),
                imageUrl: imageUrl ? absoluteUrl(imageUrl) : null,
                priceBgn,
                priceEur,
                currency: 'BGN',
                inStock: !outOfStock && (hasBuy || priceBgn !== null || priceEur !== null),
                category,
                capturedAt,
            });
        }

        return [...products.values()];
    },

    async findNextPageUrl(page: Page, currentUrl: string): Promise<string | null> {
        const pageUrl = page.url() || currentUrl;

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
    },
};
