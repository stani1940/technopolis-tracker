import { technomarketAdapter } from './technomarket.js';
import { technopolisAdapter } from './technopolis.js';
import type { SiteAdapter } from './types.js';

export const adapters: SiteAdapter[] = [technopolisAdapter, technomarketAdapter];

export function resolveAdapter(url: string): SiteAdapter {
    const adapter = adapters.find((candidate) => candidate.matches(url));

    if (!adapter) {
        throw new Error(`No site adapter found for URL: ${url}`);
    }

    return adapter;
}

export type { SiteAdapter } from './types.js';
