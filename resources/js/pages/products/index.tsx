import { Head, Link, router } from '@inertiajs/react';
import { ExternalLink, Package, RefreshCw, Search } from 'lucide-react';
import { FormEvent, useState, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type ProductItem = {
    id: number;
    technopolisSku: string;
    name: string;
    url: string;
    brand: string | null;
    imageUrl: string | null;
    imageProxyUrl: string | null;
    category: { id: number; name: string; slug: string } | null;
    currentPriceBgn: string | null;
    currentPriceEur: string | null;
    inStock: boolean | null;
    lastSeenAt: string | null;
};

type PaginatedProducts = {
    data: ProductItem[];
    links: Array<{ url: string | null; label: string; page: number | null; active: boolean }>;
    current_page: number;
    last_page: number;
    total: number;
};

type CrawlStatus = {
    id: number;
    status: string;
    startedAt: string | null;
    finishedAt: string | null;
    pagesCrawled: number;
    productsFound: number;
    errorsCount: number;
} | null;

type PageProps = {
    products: PaginatedProducts;
    filters: {
        search: string;
        category_id: number | null;
        sort: string;
    };
    crawlStatus: CrawlStatus;
    stats: {
        totalProducts: number;
        activeProducts: number;
    };
};

function formatPrice(value: string | null, suffix: string): string {
    if (!value) {
        return '—';
    }

    return `${Number.parseFloat(value).toFixed(2)} ${suffix}`;
}

function ProductImage({ url, proxyUrl, name }: { url: string | null; proxyUrl: string | null; name: string }) {
    // 0 = direct (no-referrer), 1 = proxy fallback, 2 = failed
    const [stage, setStage] = useState(0);

    const src = stage === 0 ? url : stage === 1 ? proxyUrl : null;

    if (!src) {
        return <Package className="text-muted-foreground size-10" />;
    }

    return (
        <img
            key={stage}
            src={src}
            alt={name}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="max-h-full max-w-full object-contain"
            onError={() => setStage((s) => s + 1)}
        />
    );
}

function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
    switch (status) {
        case 'completed':
            return 'default';
        case 'running':
            return 'secondary';
        case 'failed':
            return 'destructive';
        default:
            return 'outline';
    }
}

export default function ProductsIndex({
    products,
    filters,
    crawlStatus,
    stats,
}: PageProps) {
    const [search, setSearch] = useState(filters.search);

    function submitSearch(event: FormEvent) {
        event.preventDefault();

        router.get(
            '/products',
            { search, sort: filters.sort },
            { preserveState: true, replace: true },
        );
    }

    return (
        <>
            <Head title="Price Tracker" />

            <div className="flex flex-col gap-6 p-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Technopolis Price Tracker
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Scraped product prices from technopolis.bg. Run{' '}
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                            php artisan crawl:run
                        </code>{' '}
                        to refresh data.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Products in database</CardDescription>
                            <CardTitle className="text-3xl">{stats.totalProducts}</CardTitle>
                        </CardHeader>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Active products</CardDescription>
                            <CardTitle className="text-3xl">{stats.activeProducts}</CardTitle>
                        </CardHeader>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription className="flex items-center gap-2">
                                <RefreshCw className="size-4" />
                                Last crawl
                            </CardDescription>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                {crawlStatus ? (
                                    <>
                                        <Badge variant={statusVariant(crawlStatus.status)}>
                                            {crawlStatus.status}
                                        </Badge>
                                        <span className="font-normal text-muted-foreground">
                                            {crawlStatus.productsFound} products
                                        </span>
                                    </>
                                ) : (
                                    'No crawls yet'
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-muted-foreground text-sm">
                            {crawlStatus?.finishedAt
                                ? new Date(crawlStatus.finishedAt).toLocaleString('bg-BG')
                                : crawlStatus?.startedAt
                                  ? `Started ${new Date(crawlStatus.startedAt).toLocaleString('bg-BG')}`
                                  : 'Import or run a crawl to populate this page.'}
                            {crawlStatus && crawlStatus.errorsCount > 0 && (
                                <p className="mt-1 text-destructive">
                                    {crawlStatus.errorsCount} error(s)
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <form onSubmit={submitSearch} className="flex gap-2">
                    <div className="relative max-w-md flex-1">
                        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                        <Input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search by name, SKU or brand..."
                            className="pl-9"
                        />
                    </div>
                    <Button type="submit">Search</Button>
                </form>

                {products.data.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                            <Package className="text-muted-foreground size-10" />
                            <p className="font-medium">No products yet</p>
                            <p className="text-muted-foreground max-w-md text-sm">
                                Import an existing crawl file or run the scraper:
                            </p>
                            <code className="rounded bg-muted px-3 py-2 text-xs">
                                php artisan crawl:import crawl_output/*.ndjson
                            </code>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {products.data.map((product) => (
                            <Card key={product.id} className="overflow-hidden py-0">
                                <div className="bg-muted/30 flex h-44 items-center justify-center p-4">
                                    <ProductImage url={product.imageUrl} proxyUrl={product.imageProxyUrl} name={product.name} />
                                </div>
                                <CardHeader className="gap-2 px-4 pt-4 pb-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <CardTitle className="line-clamp-2 text-base leading-snug">
                                            {product.name}
                                        </CardTitle>
                                        <a
                                            href={product.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-muted-foreground hover:text-foreground shrink-0"
                                        >
                                            <ExternalLink className="size-4" />
                                        </a>
                                    </div>
                                    <CardDescription className="flex flex-wrap gap-2">
                                        <span>SKU {product.technopolisSku}</span>
                                        {product.brand && <span>• {product.brand}</span>}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex items-end justify-between px-4 pb-4">
                                    <div>
                                        <p className="text-lg font-semibold">
                                            {formatPrice(product.currentPriceBgn, 'лв.')}
                                        </p>
                                        <p className="text-muted-foreground text-sm">
                                            {formatPrice(product.currentPriceEur, '€')}
                                        </p>
                                    </div>
                                    <Badge variant={product.inStock ? 'default' : 'secondary'}>
                                        {product.inStock ? 'In stock' : 'Out of stock'}
                                    </Badge>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {products.last_page > 1 && (
                    <div className="flex flex-wrap gap-2">
                        {products.links.map((link) =>
                            link.url ? (
                                <Link
                                    key={link.label}
                                    href={link.url}
                                    preserveScroll
                                    className={`rounded-md border px-3 py-1 text-sm ${
                                        link.active
                                            ? 'bg-primary text-primary-foreground'
                                            : 'hover:bg-muted'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ) : null,
                        )}
                    </div>
                )}
            </div>
        </>
    );
}

ProductsIndex.layout = {
    breadcrumbs: [{ title: 'Products', href: '/products' }],
};
