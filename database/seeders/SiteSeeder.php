<?php

namespace Database\Seeders;

use App\Models\Site;
use Illuminate\Database\Seeder;

class SiteSeeder extends Seeder
{
    public function run(): void
    {
        $sites = [
            [
                'name' => 'Technopolis',
                'slug' => 'technopolis',
                'base_url' => 'https://www.technopolis.bg',
                'logo_url' => null,
                'is_active' => true,
                'scraper_config' => [
                    'category_urls' => [
                        'https://www.technopolis.bg/bg/c/Promotions',
                    ],
                    'product_box_selector' => 'te-product-box[data-product-id]',
                    'product_name_selector' => '.product-box__middle a',
                    'price_selector' => '.product-box__price',
                    'pagination_selector' => 'cx-pagination a.next:not(.disabled)',
                    'min_delay_ms' => 1200,
                    'max_delay_ms' => 2500,
                ],
            ],
            [
                'name' => 'Technomarket',
                'slug' => 'technomarket',
                'base_url' => 'https://www.technomarket.bg',
                'logo_url' => null,
                'is_active' => true,
                'scraper_config' => [
                    'category_urls' => [
                        'https://www.technomarket.bg/promocii/ot-broshurata',
                    ],
                    'product_box_selector' => 'tm-product-item[data-product]',
                    'pagination_selector' => '.filter-footer .pages a:has(.page-arrowN):not(.disabled)',
                    'min_delay_ms' => 1500,
                    'max_delay_ms' => 3000,
                ],
            ],
        ];

        foreach ($sites as $data) {
            Site::updateOrCreate(
                ['slug' => $data['slug']],
                $data,
            );
        }

        $this->command->info('Seeded '.count($sites).' sites.');
    }
}
