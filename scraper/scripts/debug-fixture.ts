import { readFileSync } from 'node:fs';

const html = readFileSync('tests/fixtures/c-Promotions.html', 'utf8');
const boxRegex = /<te-product-box[^>]*data-product-id="(\d+)"[\s\S]*?<\/te-product-box>/g;

let match: RegExpExecArray | null;
let count = 0;

while ((match = boxRegex.exec(html)) !== null && count < 3) {
    const box = match[1];
    const chunk = match[0];
    const href = chunk.match(/href="([^"]*\/p\/\d+)"/)?.[1];
    const name = chunk.match(/class="product-box__middle"[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/)?.[1]
        ?.replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    const priceText = chunk.match(/class="product-box__price[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<div _ngcontent-ng-c2944081819="" class="product-box__bottom-bottom"/)?.[0]
        ?? chunk.match(/class="product-box__price[\s\S]{0,800}/)?.[0]
        ?? '';
    console.log({ sku: box, href, name, priceText: priceText.replace(/<[^>]+>/g, '|').replace(/\s+/g, ' ').slice(0, 300) });
    count++;
}
