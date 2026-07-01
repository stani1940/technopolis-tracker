<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Site;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class SiteController extends Controller
{
    public function index(): Response
    {
        $sites = Site::query()
            ->withCount(['products', 'categories', 'crawlRuns'])
            ->latest()
            ->get()
            ->map(fn (Site $site) => [
                'id' => $site->id,
                'name' => $site->name,
                'slug' => $site->slug,
                'base_url' => $site->base_url,
                'logo_url' => $site->logo_url,
                'is_active' => $site->is_active,
                'products_count' => $site->products_count,
                'categories_count' => $site->categories_count,
                'crawl_runs_count' => $site->crawl_runs_count,
                'scraper_config' => $site->scraper_config,
                'created_at' => $site->created_at?->toIso8601String(),
            ]);

        return Inertia::render('admin/sites/index', [
            'sites' => $sites,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/sites/form', [
            'site' => null,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'base_url' => ['required', 'url', 'max:255'],
            'logo_url' => ['nullable', 'url', 'max:255'],
            'is_active' => ['boolean'],
            'scraper_config' => ['nullable', 'array'],
            'scraper_config.category_urls' => ['nullable', 'array'],
            'scraper_config.category_urls.*' => ['url'],
            'scraper_config.min_delay_ms' => ['nullable', 'integer', 'min:500'],
            'scraper_config.max_delay_ms' => ['nullable', 'integer', 'min:500'],
        ]);

        $data['slug'] = Str::slug($data['name']);

        Site::create($data);

        return redirect()->route('admin.sites.index')
            ->with('success', "Site \"{$data['name']}\" created.");
    }

    public function edit(Site $site): Response
    {
        return Inertia::render('admin/sites/form', [
            'site' => [
                'id' => $site->id,
                'name' => $site->name,
                'slug' => $site->slug,
                'base_url' => $site->base_url,
                'logo_url' => $site->logo_url,
                'is_active' => $site->is_active,
                'scraper_config' => $site->scraper_config ?? [],
            ],
        ]);
    }

    public function update(Request $request, Site $site): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'base_url' => ['required', 'url', 'max:255'],
            'logo_url' => ['nullable', 'url', 'max:255'],
            'is_active' => ['boolean'],
            'scraper_config' => ['nullable', 'array'],
            'scraper_config.category_urls' => ['nullable', 'array'],
            'scraper_config.category_urls.*' => ['url'],
            'scraper_config.min_delay_ms' => ['nullable', 'integer', 'min:500'],
            'scraper_config.max_delay_ms' => ['nullable', 'integer', 'min:500'],
        ]);

        $site->update($data);

        return redirect()->route('admin.sites.index')
            ->with('success', "Site \"{$site->name}\" updated.");
    }

    public function destroy(Site $site): RedirectResponse
    {
        $name = $site->name;
        $site->delete();

        return redirect()->route('admin.sites.index')
            ->with('success', "Site \"{$name}\" deleted.");
    }
}
