import type { Page } from 'playwright';
import type { CrawledProduct } from '../types.js';

export interface SiteAdapter {
    /** Site slug matching the `sites.slug` column in the Laravel DB. */
    slug: string;

    /** Returns true when this adapter can handle the given URL. */
    matches(url: string): boolean;

    /** Waits until the product listing is rendered. */
    waitForListing(page: Page): Promise<void>;

    /** Dismisses cookie/consent banners if present. */
    dismissBanners(page: Page): Promise<void>;

    /** Extracts all products from the current listing page. */
    extractProducts(page: Page, categoryUrl: string, capturedAt: string): Promise<CrawledProduct[]>;

    /** Returns the absolute URL of the next page, or null when on the last page. */
    findNextPageUrl(page: Page, currentUrl: string): Promise<string | null>;
}
