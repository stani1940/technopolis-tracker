import { Head } from '@inertiajs/react';
import { CheckCircle, Clock, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type CrawlRun = {
    id: number;
    status: string;
    startedAt: string | null;
    finishedAt: string | null;
    pagesCrawled: number;
    productsFound: number;
    errorsCount: number;
    categoryUrl: string | null;
    durationSeconds: number | null;
};

type PaginatedRuns = {
    data: CrawlRun[];
    current_page: number;
    last_page: number;
    total: number;
};

type PageProps = {
    runs: PaginatedRuns;
};

function statusIcon(status: string) {
    switch (status) {
        case 'completed':
            return <CheckCircle className="size-4 text-emerald-500" />;
        case 'running':
            return <Clock className="size-4 text-blue-500 animate-pulse" />;
        case 'failed':
            return <XCircle className="size-4 text-destructive" />;
        default:
            return <Clock className="size-4 text-muted-foreground" />;
    }
}

function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
    switch (status) {
        case 'completed': return 'default';
        case 'running': return 'secondary';
        case 'failed': return 'destructive';
        default: return 'outline';
    }
}

function fmtDuration(seconds: number | null): string {
    if (seconds === null) return '—';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}м ${s}с` : `${s}с`;
}

export default function CrawlRunsIndex({ runs }: PageProps) {
    return (
        <>
            <Head title="Crawl History" />

            <div className="flex flex-col gap-6 p-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">История на crawl-овете</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Всички стартирани scraping сесии. Стартирай нов с{' '}
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">php artisan crawl:run</code>.
                    </p>
                </div>

                {runs.data.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center text-muted-foreground">
                            Няма crawl история. Стартирай първия scrape.
                        </CardContent>
                    </Card>
                ) : (
                    <div className="flex flex-col gap-3">
                        {runs.data.map((run) => (
                            <Card key={run.id}>
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-2">
                                            {statusIcon(run.status)}
                                            <CardTitle className="text-base">
                                                Crawl #{run.id}
                                            </CardTitle>
                                            <Badge variant={statusVariant(run.status)}>
                                                {run.status}
                                            </Badge>
                                        </div>
                                        <span className="text-muted-foreground text-sm shrink-0">
                                            {run.startedAt
                                                ? new Date(run.startedAt).toLocaleString('bg-BG')
                                                : '—'}
                                        </span>
                                    </div>
                                    {run.categoryUrl && (
                                        <CardDescription className="truncate text-xs">
                                            {run.categoryUrl}
                                        </CardDescription>
                                    )}
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
                                        <div>
                                            <p className="text-muted-foreground text-xs">Намерени</p>
                                            <p className="font-semibold">{run.productsFound}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground text-xs">Страници</p>
                                            <p className="font-semibold">{run.pagesCrawled}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground text-xs">Грешки</p>
                                            <p className={`font-semibold ${run.errorsCount > 0 ? 'text-destructive' : ''}`}>
                                                {run.errorsCount}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground text-xs">Продължителност</p>
                                            <p className="font-semibold">{fmtDuration(run.durationSeconds)}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

CrawlRunsIndex.layout = {
    breadcrumbs: [{ title: 'Crawl History', href: '/crawl-runs' }],
};
