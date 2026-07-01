import { Head, Link, router } from '@inertiajs/react';
import { Edit, Globe, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type SiteItem = {
    id: number;
    name: string;
    slug: string;
    base_url: string;
    logo_url: string | null;
    is_active: boolean;
    products_count: number;
    categories_count: number;
    crawl_runs_count: number;
    scraper_config: Record<string, unknown> | null;
    created_at: string | null;
};

type PageProps = {
    sites: SiteItem[];
    flash?: { success?: string };
};

export default function AdminSitesIndex({ sites, flash }: PageProps) {
    function deleteSite(site: SiteItem) {
        if (!confirm(`Delete "${site.name}"? This will not delete its products.`)) return;
        router.delete(`/admin/sites/${site.id}`);
    }

    return (
        <>
            <Head title="Admin — Sites" />

            <div className="flex flex-col gap-6 p-4 max-w-4xl mx-auto">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">Tracked Sites</h1>
                        <p className="text-muted-foreground text-sm mt-0.5">
                            Manage the e-commerce sites to scrape prices from.
                        </p>
                    </div>
                    <Button asChild>
                        <Link href="/admin/sites/create">
                            <Plus className="size-4 mr-2" />
                            Add Site
                        </Link>
                    </Button>
                </div>

                {flash?.success && (
                    <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                        {flash.success}
                    </div>
                )}

                {sites.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center text-muted-foreground">
                            No sites yet. Add your first one.
                        </CardContent>
                    </Card>
                ) : (
                    <div className="flex flex-col gap-4">
                        {sites.map((site) => (
                            <Card key={site.id}>
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-muted flex size-10 items-center justify-center rounded-md">
                                                <Globe className="size-5 text-muted-foreground" />
                                            </div>
                                            <div>
                                                <CardTitle className="flex items-center gap-2 text-base">
                                                    {site.name}
                                                    <Badge variant={site.is_active ? 'default' : 'secondary'}>
                                                        {site.is_active ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </CardTitle>
                                                <CardDescription className="text-xs mt-0.5">
                                                    <a
                                                        href={site.base_url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="hover:underline"
                                                    >
                                                        {site.base_url}
                                                    </a>
                                                </CardDescription>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/admin/sites/${site.id}/edit`}>
                                                    <Edit className="size-3.5 mr-1" />
                                                    Edit
                                                </Link>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive hover:text-destructive"
                                                onClick={() => deleteSite(site)}
                                            >
                                                <Trash2 className="size-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <p className="text-muted-foreground text-xs">Products</p>
                                            <p className="font-semibold">{site.products_count.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground text-xs">Categories</p>
                                            <p className="font-semibold">{site.categories_count}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground text-xs">Crawl runs</p>
                                            <p className="font-semibold">{site.crawl_runs_count}</p>
                                        </div>
                                    </div>

                                    {site.scraper_config && (
                                        <div className="mt-3 rounded-md bg-muted/50 p-3">
                                            <p className="text-xs font-medium text-muted-foreground mb-1">
                                                Category URLs
                                            </p>
                                            {(site.scraper_config.category_urls as string[] | undefined)?.map((url) => (
                                                <p key={url} className="font-mono text-xs truncate">{url}</p>
                                            )) ?? <p className="text-xs text-muted-foreground italic">None configured</p>}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

AdminSitesIndex.layout = {
    breadcrumbs: [
        { title: 'Admin', href: '/admin/sites' },
        { title: 'Sites', href: '/admin/sites' },
    ],
};
