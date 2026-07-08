import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
    extractCategoryIdFromUrl,
    extractSkuFromUrl,
    parseCategoryPageHtml,
    parseDualPriceText,
    parseProductBoxHtml,
} from '../src/parser.js';

const fixturePath = path.resolve('tests/fixtures/c-Promotions.html');
const fixtureHtml = readFileSync(fixturePath, 'utf8');
const categoryUrl = 'https://www.technopolis.bg/bg/c/Promotions';

describe('parser', () => {
    it('extracts SKU from product URLs', () => {
        expect(extractSkuFromUrl('/bg/foo/p/510422')).toBe('510422');
        expect(extractCategoryIdFromUrl(categoryUrl)).toBe('Promotions');
    });

    it('parses dual EUR/BGN prices', () => {
        expect(parseDualPriceText('399.00 € / 780.38 лв.')).toEqual({
            priceEur: 399,
            priceBgn: 780.38,
        });
    });

    it('parses individual product boxes from fixture HTML', () => {
        const firstBox = fixtureHtml.match(/<te-product-box[^>]*data-product-id="\d+"[\s\S]*?<\/te-product-box>/)?.[0];

        expect(firstBox).toBeTruthy();

        const parsed = parseProductBoxHtml(firstBox!);

        expect(parsed).toMatchObject({
            technopolisSku: '510422',
            name: expect.stringContaining('SAMSUNG GALAXY A37'),
            priceEur: 399,
            priceBgn: 780.38,
            inStock: true,
        });
    });

    it('parses multiple unique products from category fixture', () => {
        const products = parseCategoryPageHtml(fixtureHtml);

        expect(products.length).toBeGreaterThan(10);

        const samsung = products.find((product) => product.technopolisSku === '510422');

        expect(samsung).toMatchObject({
            technopolisSku: '510422',
            priceEur: 399,
            priceBgn: 780.38,
            url: expect.stringContaining('/p/510422'),
        });
    });
});
