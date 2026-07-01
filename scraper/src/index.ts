import path from 'node:path';
import { config } from './config.js';
import { crawlCategoryUrls, writeNdjson } from './crawler.js';

async function main(): Promise<void> {
    if (!config.enabled) {
        console.error('Crawler disabled via CRAWLER_ENABLED=false');
        process.exit(0);
    }

    const categoryUrls = config.categoryUrls.length > 0
        ? config.categoryUrls
        : ['https://www.technopolis.bg/bg/c/Promotions'];

    console.error(`Starting crawl for ${categoryUrls.length} category URL(s)...`);

    const { products, summary } = await crawlCategoryUrls(categoryUrls);
    const timestamp = summary.startedAt.replace(/[:.]/g, '-');
    const outputPath = path.resolve(config.outputDir, `${timestamp}.ndjson`);

    await writeNdjson(outputPath, products, summary);

    console.error(`Wrote ${products.length} products to ${outputPath}`);
    console.error(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
