export interface CrawledCategory {
    technopolisCategoryId: string | null;
    name: string;
    slug: string;
    url: string;
    parentUrl?: string | null;
}

export interface CrawledProduct {
    technopolisSku: string;
    name: string;
    slug: string;
    url: string;
    brand: string | null;
    imageUrl: string | null;
    priceBgn: number | null;
    priceEur: number | null;
    currency: string;
    inStock: boolean;
    category: CrawledCategory;
    capturedAt: string;
}

export interface CrawlError {
    url: string;
    message: string;
}

export interface CrawlSummary {
    startedAt: string;
    finishedAt: string;
    categoryUrl: string;
    pagesCrawled: number;
    productsFound: number;
    errorsCount: number;
    errors: CrawlError[];
}

export interface CrawlOutputLine {
    type: 'product';
    product: CrawledProduct;
}

export interface CrawlSummaryLine {
    type: 'summary';
    summary: CrawlSummary;
}

export type CrawlLine = CrawlOutputLine | CrawlSummaryLine;
