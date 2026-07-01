const SKU_PATTERN = /\/p\/(\d+)(?:[/?#]|$)/;

export function extractSkuFromUrl(url: string): string | null {
    const match = url.match(SKU_PATTERN);

    return match?.[1] ?? null;
}

export function extractCategoryIdFromUrl(url: string): string | null {
    const match = url.match(/\/c\/([^/?#]+)/i);

    return match?.[1] ?? null;
}

export function slugFromUrl(url: string): string {
    try {
        const pathname = new URL(url, 'https://www.technopolis.bg').pathname;
        const segments = pathname.split('/').filter(Boolean);
        const productIndex = segments.indexOf('p');

        if (productIndex > 0) {
            return segments[productIndex - 1];
        }

        const categoryIndex = segments.indexOf('c');

        if (categoryIndex > 0) {
            return segments[categoryIndex - 1];
        }

        return segments.at(-1) ?? 'unknown';
    } catch {
        return 'unknown';
    }
}

export function absoluteUrl(url: string): string {
    return new URL(url, 'https://www.technopolis.bg').toString();
}

export function parsePriceAmount(raw: string | null | undefined): number | null {
    if (!raw) {
        return null;
    }

    const normalized = raw.replace(/\s+/g, '').replace(',', '.');
    const match = normalized.match(/(\d+(?:\.\d+)?)/);

    if (!match) {
        return null;
    }

    const value = Number.parseFloat(match[1]);

    return Number.isFinite(value) ? value : null;
}

export function normalizePrices(priceBgn: number | null, priceEur: number | null): { priceBgn: number | null; priceEur: number | null } {
    const BGN_PER_EUR = 1.95583;

    let bgn = priceBgn;
    let eur = priceEur;

    if (eur !== null && bgn === null) {
        bgn = Math.round(eur * BGN_PER_EUR * 100) / 100;
    }

    if (bgn !== null && eur === null) {
        eur = Math.round((bgn / BGN_PER_EUR) * 100) / 100;
    }

    return { priceBgn: bgn, priceEur: eur };
}

export function parseDualPriceText(text: string): { priceEur: number | null; priceBgn: number | null } {
    const eurMatch = text.match(/(\d[\d\s.,]*)\s*€/);
    const bgnMatch = text.match(/(\d[\d\s.,]*)\s*лв\.?/i);

    return normalizePrices(
        parsePriceAmount(bgnMatch?.[1] ?? null),
        parsePriceAmount(eurMatch?.[1] ?? null),
    );
}

export interface ParsedProductBox {
    technopolisSku: string;
    name: string;
    slug: string;
    url: string;
    imageUrl: string | null;
    priceBgn: number | null;
    priceEur: number | null;
    inStock: boolean;
}

export function parseProductBoxHtml(boxHtml: string, categoryUrl: string): ParsedProductBox | null {
    const sku = boxHtml.match(/data-product-id="(\d+)"/)?.[1]
        ?? extractSkuFromUrl(boxHtml.match(/href="([^"]*\/p\/\d+)"/)?.[1] ?? '');

    if (!sku) {
        return null;
    }

    const relativeHref = boxHtml.match(/class="product-box__middle"[\s\S]*?href="([^"]+)"/)?.[1]
        ?? boxHtml.match(/href="([^"]*\/p\/\d+)"/)?.[1];

    if (!relativeHref) {
        return null;
    }

    const url = absoluteUrl(relativeHref);
    const name = boxHtml
        .match(/class="product-box__middle"[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/)?.[1]
        ?.replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    if (!name) {
        return null;
    }

    const imageUrl = boxHtml.match(/<img[^>]+src="([^"]+)"/)?.[1] ?? null;
    const priceSection = boxHtml.match(/class="product-box__price[\s\S]*?(?=class="product-box__bottom-bottom"|$)/)?.[0] ?? boxHtml;
    const plainPriceText = priceSection.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    const { priceBgn, priceEur } = parseDualPriceText(plainPriceText);
    const outOfStock = /изчерпан|няма наличност|не е наличен/i.test(boxHtml);
    const hasBuyButton = /js-add__cart|button-buy|Добави/i.test(boxHtml);

    return {
        technopolisSku: sku,
        name,
        slug: slugFromUrl(url),
        url,
        imageUrl: imageUrl ? absoluteUrl(imageUrl) : null,
        priceBgn,
        priceEur,
        inStock: !outOfStock && (hasBuyButton || (!outOfStock && (priceBgn !== null || priceEur !== null))),
    };
}

export function parseCategoryPageHtml(html: string, categoryUrl: string): ParsedProductBox[] {
    const boxRegex = /<te-product-box[^>]*data-product-id="\d+"[\s\S]*?<\/te-product-box>/g;
    const products = new Map<string, ParsedProductBox>();

    for (const match of html.matchAll(boxRegex)) {
        const parsed = parseProductBoxHtml(match[0], categoryUrl);

        if (parsed) {
            products.set(parsed.technopolisSku, parsed);
        }
    }

    return [...products.values()];
}

export function extractCategoryNameFromHtml(html: string): string {
    const title = html.match(/<h1[^>]*class="content-title"[^>]*>([\s\S]*?)<\/h1>/)?.[1]
        ?? html.match(/<title>([\s\S]*?)<\/title>/)?.[1]
        ?? 'Unknown category';

    return title
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/\s*Намерени:\s*\d+\s*$/i, '')
        .trim();
}

export function extractBrandFromName(name: string): string | null {
    const match = name.match(/^(?:Смартфон GSM|Лаптоп|Телевизор|Конзола|Таблет|Смарт часовник|Монитор|Хладилник|Пералня|Сушилня|Климатик|Инверторен клimatik|Уред|Смарт)\s+([A-Z0-9][A-Z0-9+\-. ]{1,30}?)\b/i);

    return match?.[1]?.trim() ?? null;
}
