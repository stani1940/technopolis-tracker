import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    ExternalLink,
    Package,
    TrendingDown,
    TrendingUp,
} from 'lucide-react';
import { useState } from 'react';
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

type HistoryPoint = {
    date: string;
    priceBgn: number | null;
    priceEur: number | null;
    inStock: boolean | null;
};

type ProductDetail = {
    id: number;
    technopolisSku: string;
    name: string;
    slug: string;
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

type Summary = {
    current: number | null;
    lowest: number | null;
    highest: number | null;
    dataPoints: number;
};

type PageProps = {
    product: ProductDetail;
    history: HistoryPoint[];
    summary: Summary;
};

function fmt(value: number | null, suffix: string): string {
    if (value === null || value === undefined) {
return '—';
}

    return `${value.toFixed(2)} ${suffix}`;
}

function PriceImage({
    url,
    proxyUrl,
    name,
}: {
    url: string | null;
    proxyUrl: string | null;
    name: string;
}) {
    const [stage, setStage] = useState(0);
    const src = stage === 0 ? url : stage === 1 ? proxyUrl : null;

    if (!src) {
return <Package className="size-16 text-muted-foreground" />;
}

    return (
        <img
            key={stage}
            src={src}
            alt={name}
            referrerPolicy="no-referrer"
            className="max-h-full max-w-full object-contain"
            onError={() => setStage((s) => s + 1)}
        />
    );
}

function CustomTooltip({
    active,
    payload,
    label,
}: {
    active?: boolean;
    payload?: Array<{ value: number }>;
    label?: string;
}) {
    if (!active || !payload?.length) {
return null;
}

    return (
        <div className="rounded-md border bg-background px-3 py-2 text-sm shadow-md">
            <p className="mb-1 text-muted-foreground">{label}</p>
            <p className="font-semibold">{payload[0].value.toFixed(2)} лв.</p>
        </div>
    );
}

export default function ProductShow({ product, history, summary }: PageProps) {
    const chartData = history.filter((p) => p.priceBgn !== null);

    const discount =
        summary.highest && summary.current && summary.highest > summary.current
            ? Math.round(
                  ((summary.highest - summary.current) / summary.highest) * 100,
              )
            : null;

    return (
        <>
            <Head title={product.name} />

            <div className="mx-auto flex max-w-5xl flex-col gap-6 p-4">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/products">
                            <ArrowLeft className="size-4" />
                        </Link>
                    </Button>
                    <div className="min-w-0">
                        <p className="text-sm text-muted-foreground">
                            {product.category?.name ?? 'Unknown category'}
                        </p>
                        <h1 className="truncate text-xl leading-tight font-semibold">
                            {product.name}
                        </h1>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-[280px_1fr]">
                    {/* Image + meta */}
                    <div className="flex flex-col gap-4">
                        <Card className="overflow-hidden py-0">
                            <div className="flex h-56 items-center justify-center bg-muted/30 p-4">
                                <PriceImage
                                    url={product.imageUrl}
                                    proxyUrl={product.imageProxyUrl}
                                    name={product.name}
                                />
                            </div>
                        </Card>

                        <Card>
                            <CardContent className="flex flex-col gap-3 pt-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-2xl font-bold">
                                        {fmt(summary.current, 'лв.')}
                                    </span>
                                    <Badge
                                        variant={
                                            product.inStock
                                                ? 'default'
                                                : 'secondary'
                                        }
                                    >
                                        {product.inStock
                                            ? 'В наличност'
                                            : 'Изчерпан'}
                                    </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {fmt(
                                        product.currentPriceEur
                                            ? Number(product.currentPriceEur)
                                            : null,
                                        '€',
                                    )}
                                </p>

                                {discount !== null && (
                                    <div className="flex items-center gap-1 text-sm text-emerald-600">
                                        <TrendingDown className="size-4" />
                                        <span>
                                            {discount}% под най-високата цена
                                        </span>
                                    </div>
                                )}

                                <Button asChild className="mt-1">
                                    <a
                                        href={product.url}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        <ExternalLink className="mr-2 size-4" />
                                        Виж в Technopolis
                                    </a>
                                </Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="flex flex-col gap-2 pt-4 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                        SKU
                                    </span>
                                    <span className="font-mono">
                                        {product.technopolisSku}
                                    </span>
                                </div>
                                {product.brand && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">
                                            Марка
                                        </span>
                                        <span>{product.brand}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                        Записи
                                    </span>
                                    <span>{summary.dataPoints}</span>
                                </div>
                                {product.lastSeenAt && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">
                                            Последно
                                        </span>
                                        <span>
                                            {new Date(
                                                product.lastSeenAt,
                                            ).toLocaleDateString('bg-BG')}
                                        </span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Chart + stats */}
                    <div className="flex flex-col gap-4">
                        <div className="grid grid-cols-3 gap-3">
                            <Card>
                                <CardHeader className="px-4 pt-3 pb-1">
                                    <CardDescription>
                                        Текуща цена
                                    </CardDescription>
                                    <CardTitle className="text-xl">
                                        {fmt(summary.current, 'лв.')}
                                    </CardTitle>
                                </CardHeader>
                            </Card>
                            <Card>
                                <CardHeader className="px-4 pt-3 pb-1">
                                    <CardDescription className="flex items-center gap-1">
                                        <TrendingDown className="size-3" />{' '}
                                        Най-ниска
                                    </CardDescription>
                                    <CardTitle className="text-xl text-emerald-600">
                                        {fmt(summary.lowest, 'лв.')}
                                    </CardTitle>
                                </CardHeader>
                            </Card>
                            <Card>
                                <CardHeader className="px-4 pt-3 pb-1">
                                    <CardDescription className="flex items-center gap-1">
                                        <TrendingUp className="size-3" />{' '}
                                        Най-висока
                                    </CardDescription>
                                    <CardTitle className="text-xl text-rose-500">
                                        {fmt(summary.highest, 'лв.')}
                                    </CardTitle>
                                </CardHeader>
                            </Card>
                        </div>

                        <Card className="flex-1">
                            <CardHeader>
                                <CardTitle className="text-base">
                                    История на цената
                                </CardTitle>
                                <CardDescription>
                                    {chartData.length} точки на данни
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {chartData.length < 2 ? (
                                    <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                                        Нужни са поне 2 scrape-а за графика.
                                        <br />
                                        Стартирай{' '}
                                        <code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-xs">
                                            php artisan crawl:run
                                        </code>{' '}
                                        отново утре.
                                    </div>
                                ) : (
                                    <ResponsiveContainer
                                        width="100%"
                                        height={280}
                                    >
                                        <AreaChart
                                            data={chartData}
                                            margin={{
                                                top: 4,
                                                right: 4,
                                                left: 0,
                                                bottom: 0,
                                            }}
                                        >
                                            <defs>
                                                <linearGradient
                                                    id="priceGradient"
                                                    x1="0"
                                                    y1="0"
                                                    x2="0"
                                                    y2="1"
                                                >
                                                    <stop
                                                        offset="5%"
                                                        stopColor="hsl(var(--primary))"
                                                        stopOpacity={0.25}
                                                    />
                                                    <stop
                                                        offset="95%"
                                                        stopColor="hsl(var(--primary))"
                                                        stopOpacity={0}
                                                    />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                className="stroke-border"
                                            />
                                            <XAxis
                                                dataKey="date"
                                                tick={{ fontSize: 11 }}
                                                tickFormatter={(v: string) =>
                                                    new Date(
                                                        v,
                                                    ).toLocaleDateString(
                                                        'bg-BG',
                                                        {
                                                            day: '2-digit',
                                                            month: '2-digit',
                                                        },
                                                    )
                                                }
                                                className="text-muted-foreground"
                                            />
                                            <YAxis
                                                tick={{ fontSize: 11 }}
                                                tickFormatter={(v: number) =>
                                                    `${v} лв.`
                                                }
                                                width={72}
                                                className="text-muted-foreground"
                                            />
                                            <Tooltip
                                                content={<CustomTooltip />}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="priceBgn"
                                                stroke="hsl(var(--primary))"
                                                strokeWidth={2}
                                                fill="url(#priceGradient)"
                                                dot={chartData.length <= 10}
                                                activeDot={{ r: 5 }}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}

ProductShow.layout = {
    breadcrumbs: [
        { title: 'Products', href: '/products' },
        { title: 'Detail', href: '#' },
    ],
};
