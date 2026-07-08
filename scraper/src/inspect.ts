import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium  } from 'playwright';
import type {Page} from 'playwright';
import { config } from './config.js';

async function dismissCookieBanner(page: Page): Promise<void> {
    const acceptButton = page.getByRole('button', { name: /приемам|accept|съгласен/i }).first();

    if (await acceptButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await acceptButton.click();
        await page.waitForTimeout(500);
    }
}

async function main(): Promise<void> {
    const apiCalls: string[] = [];
    const browser = await chromium.launch({
        headless: config.headless,
        channel: process.env.CRAWLER_BROWSER_CHANNEL ?? 'chrome',
    });
    const context = await browser.newContext({
        userAgent: config.userAgent,
        locale: 'bg-BG',
    });
    const page = await context.newPage();

    page.on('response', (response) => {
        const url = response.url();

        if (url.includes('api.technopolis') || url.includes('/search') || url.includes('/products')) {
            apiCalls.push(`${response.status()} ${url.slice(0, 200)}`);
        }
    });

    const fixturesDir = path.resolve('tests/fixtures');
    await mkdir(fixturesDir, { recursive: true });

    console.log('Loading homepage...');
    await page.goto('https://www.technopolis.bg/bg/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForLoadState('networkidle', { timeout: 45000 }).catch(() => undefined);
    await dismissCookieBanner(page);
    await page.waitForTimeout(3000);

    const categoryLinks = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('a[href*="/c/"]'))
            .map((anchor) => (anchor as HTMLAnchorElement).href)
            .filter((href, index, all) => all.indexOf(href) === index)
            .slice(0, 15);
    });

    console.log('\nCategory links from homepage:');
    categoryLinks.forEach((link) => console.log(`  ${link}`));

    const targetUrl = categoryLinks[0] ?? 'https://www.technopolis.bg/bg/search?q=iphone';
    console.log(`\nInspecting category: ${targetUrl}`);

    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForLoadState('networkidle', { timeout: 45000 }).catch(() => undefined);
    await dismissCookieBanner(page);
    await page.waitForTimeout(4000);

    console.log(`Title: ${await page.title()}`);

    const counts = await page.evaluate(() => ({
        productLinks: document.querySelectorAll('a[href*="/p/"]').length,
        articles: document.querySelectorAll('article').length,
        productTiles: document.querySelectorAll('[class*="product"], [class*="Product"], [data-testid*="product"]').length,
    }));

    console.log('Element counts:', counts);

    const sampleCards = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a[href*="/p/"]')).slice(0, 5);

        return links.map((link) => {
            const anchor = link as HTMLAnchorElement;
            const card = anchor.closest('article, li, div');

            return {
                href: anchor.href,
                text: anchor.textContent?.replace(/\s+/g, ' ').trim().slice(0, 160) ?? '',
                cardClass: card?.className?.slice(0, 120) ?? null,
                cardText: card?.textContent?.replace(/\s+/g, ' ').trim().slice(0, 300) ?? null,
            };
        });
    });

    console.log('\nSample product cards:');
    console.log(JSON.stringify(sampleCards, null, 2));

    console.log('\nRelevant API calls:');
    apiCalls.slice(0, 30).forEach((call) => console.log(`  ${call}`));

    const slug = targetUrl.split('/').filter(Boolean).slice(-2).join('-') || 'category';
    const html = await page.content();
    await writeFile(path.join(fixturesDir, `${slug}.html`), html, 'utf8');
    console.log(`\nSaved fixture: tests/fixtures/${slug}.html`);

    await browser.close();
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
