import { Head, Link, useForm } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';
import { FormEvent } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

type SiteFormData = {
    name: string;
    base_url: string;
    logo_url: string;
    is_active: boolean;
    scraper_config: {
        category_urls: string[];
        min_delay_ms: number;
        max_delay_ms: number;
        notes: string;
    };
};

type SiteProps = {
    id?: number;
    name: string;
    slug?: string;
    base_url: string;
    logo_url: string | null;
    is_active: boolean;
    scraper_config: Partial<SiteFormData['scraper_config']> | null;
} | null;

type PageProps = {
    site: SiteProps;
};

export default function AdminSiteForm({ site }: PageProps) {
    const isEdit = site !== null;

    const { data, setData, post, put, processing, errors } = useForm<SiteFormData>({
        name: site?.name ?? '',
        base_url: site?.base_url ?? '',
        logo_url: site?.logo_url ?? '',
        is_active: site?.is_active ?? true,
        scraper_config: {
            category_urls: site?.scraper_config?.category_urls ?? [''],
            min_delay_ms: site?.scraper_config?.min_delay_ms ?? 1500,
            max_delay_ms: site?.scraper_config?.max_delay_ms ?? 3000,
            notes: site?.scraper_config?.notes ?? '',
        },
    });

    function submit(e: FormEvent) {
        e.preventDefault();
        // filter empty urls
        const filtered = {
            ...data,
            scraper_config: {
                ...data.scraper_config,
                category_urls: data.scraper_config.category_urls.filter((u) => u.trim() !== ''),
            },
        };

        if (isEdit) {
            put(`/admin/sites/${site.id}`, { data: filtered } as never);
        } else {
            post('/admin/sites', { data: filtered } as never);
        }
    }

    function addUrl() {
        setData('scraper_config', {
            ...data.scraper_config,
            category_urls: [...data.scraper_config.category_urls, ''],
        });
    }

    function removeUrl(index: number) {
        setData('scraper_config', {
            ...data.scraper_config,
            category_urls: data.scraper_config.category_urls.filter((_, i) => i !== index),
        });
    }

    function updateUrl(index: number, value: string) {
        const updated = [...data.scraper_config.category_urls];
        updated[index] = value;
        setData('scraper_config', { ...data.scraper_config, category_urls: updated });
    }

    return (
        <>
            <Head title={isEdit ? `Edit ${site.name}` : 'Add Site'} />

            <div className="flex flex-col gap-6 p-4 max-w-2xl mx-auto">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        {isEdit ? `Edit "${site.name}"` : 'Add New Site'}
                    </h1>
                    {isEdit && site.slug && (
                        <Badge variant="outline" className="mt-1 font-mono text-xs">
                            {site.slug}
                        </Badge>
                    )}
                </div>

                <form onSubmit={submit} className="flex flex-col gap-5">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Basic Info</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            <div className="grid gap-1.5">
                                <Label htmlFor="name">Site Name *</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Technopolis"
                                    required
                                />
                                {errors.name && <p className="text-destructive text-xs">{errors.name}</p>}
                            </div>

                            <div className="grid gap-1.5">
                                <Label htmlFor="base_url">Base URL *</Label>
                                <Input
                                    id="base_url"
                                    type="url"
                                    value={data.base_url}
                                    onChange={(e) => setData('base_url', e.target.value)}
                                    placeholder="https://www.example.com"
                                    required
                                />
                                {errors.base_url && <p className="text-destructive text-xs">{errors.base_url}</p>}
                            </div>

                            <div className="grid gap-1.5">
                                <Label htmlFor="logo_url">Logo URL</Label>
                                <Input
                                    id="logo_url"
                                    type="url"
                                    value={data.logo_url}
                                    onChange={(e) => setData('logo_url', e.target.value)}
                                    placeholder="https://..."
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                <Switch
                                    id="is_active"
                                    checked={data.is_active}
                                    onCheckedChange={(v) => setData('is_active', v)}
                                />
                                <Label htmlFor="is_active">Active (include in scheduled crawls)</Label>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Scraper Config</CardTitle>
                            <CardDescription>
                                URLs to crawl and timing settings.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <Label>Category URLs to Crawl</Label>
                                {data.scraper_config.category_urls.map((url, i) => (
                                    <div key={i} className="flex gap-2">
                                        <Input
                                            type="url"
                                            value={url}
                                            onChange={(e) => updateUrl(i, e.target.value)}
                                            placeholder="https://www.example.com/promo/"
                                            className="font-mono text-sm"
                                        />
                                        {data.scraper_config.category_urls.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:text-destructive shrink-0"
                                                onClick={() => removeUrl(i)}
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="self-start"
                                    onClick={addUrl}
                                >
                                    <Plus className="size-3.5 mr-1.5" />
                                    Add URL
                                </Button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-1.5">
                                    <Label htmlFor="min_delay">Min delay (ms)</Label>
                                    <Input
                                        id="min_delay"
                                        type="number"
                                        min={500}
                                        value={data.scraper_config.min_delay_ms}
                                        onChange={(e) =>
                                            setData('scraper_config', {
                                                ...data.scraper_config,
                                                min_delay_ms: Number(e.target.value),
                                            })
                                        }
                                    />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label htmlFor="max_delay">Max delay (ms)</Label>
                                    <Input
                                        id="max_delay"
                                        type="number"
                                        min={500}
                                        value={data.scraper_config.max_delay_ms}
                                        onChange={(e) =>
                                            setData('scraper_config', {
                                                ...data.scraper_config,
                                                max_delay_ms: Number(e.target.value),
                                            })
                                        }
                                    />
                                </div>
                            </div>

                            <div className="grid gap-1.5">
                                <Label htmlFor="notes">Notes</Label>
                                <Textarea
                                    id="notes"
                                    rows={3}
                                    value={data.scraper_config.notes}
                                    onChange={(e) =>
                                        setData('scraper_config', {
                                            ...data.scraper_config,
                                            notes: e.target.value,
                                        })
                                    }
                                    placeholder="e.g. CSS selectors need adjustment, pagination uses infinite scroll..."
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex gap-3">
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Site'}
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href="/admin/sites">Cancel</Link>
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

AdminSiteForm.layout = {
    breadcrumbs: [
        { title: 'Admin', href: '/admin/sites' },
        { title: 'Sites', href: '/admin/sites' },
        { title: 'Form', href: '#' },
    ],
};
