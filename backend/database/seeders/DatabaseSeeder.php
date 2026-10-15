<?php

namespace Database\Seeders;

use App\Models\Brand;
use App\Models\Platform;
use App\Models\TrackingTask;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Create Users
        $admin = User::firstOrCreate(
            ['email' => 'admin@kumtura.com'],
            [
                'name' => 'Admin Kumtura',
                'password' => Hash::make('password123'),
                'role' => 'admin',
                'status' => 'active',
            ]
        );

        $staff = User::firstOrCreate(
            ['email' => 'staff@kumtura.com'],
            [
                'name' => 'Marketing Staff',
                'password' => Hash::make('password123'),
                'role' => 'staff',
                'status' => 'active',
            ]
        );

        // 2. Create Brands
        $brandsData = [
            [
                'name' => 'Medispro',
                'slug' => 'medispro',
                'description' => 'Solusi Alat Kesehatan & Medis Profesional',
                'color' => '#0284c7', // Sky blue
                'monthly_lead_target' => 150,
            ],
            [
                'name' => 'Eleventrent',
                'slug' => 'eleventrent',
                'description' => 'Rental Kendaraan & Transportasi Terpercaya',
                'color' => '#7c3aed', // Violet
                'monthly_lead_target' => 120,
            ],
            [
                'name' => 'Kuuva',
                'slug' => 'kuuva',
                'description' => 'Fashion & Lifestyle Creative Products',
                'color' => '#059669', // Emerald
                'monthly_lead_target' => 180,
            ],
            [
                'name' => 'Pikago',
                'slug' => 'pikago',
                'description' => 'Layanan Logistik & Ekspedisi Cepat',
                'color' => '#d97706', // Amber
                'monthly_lead_target' => 100,
            ],
            [
                'name' => 'Kumtura',
                'slug' => 'kumtura',
                'description' => 'Holding & Layanan Digital Marketing Terpadu',
                'color' => '#dc2626', // Red
                'monthly_lead_target' => 200,
            ],
        ];

        $createdBrands = [];
        foreach ($brandsData as $b) {
            $createdBrands[$b['slug']] = Brand::firstOrCreate(['slug' => $b['slug']], $b);
        }

        // 3. Create Platforms
        $platformsData = [
            [
                'name' => 'Instagram',
                'slug' => 'instagram',
                'icon' => 'instagram',
                'color' => '#E1306C',
            ],
            [
                'name' => 'Facebook',
                'slug' => 'facebook',
                'icon' => 'facebook',
                'color' => '#1877F2',
            ],
            [
                'name' => 'Threads',
                'slug' => 'threads',
                'icon' => 'at-sign',
                'color' => '#111827',
            ],
            [
                'name' => 'WhatsApp',
                'slug' => 'whatsapp',
                'icon' => 'message-circle',
                'color' => '#25D366',
            ],
        ];

        $createdPlatforms = [];
        foreach ($platformsData as $p) {
            $createdPlatforms[$p['slug']] = Platform::firstOrCreate(['slug' => $p['slug']], $p);
        }

        // 4. Create Sample Tracking Data across brands and platforms
        $today = Carbon::today();
        
        $sampleActivities = [
            // Medispro
            [
                'brand' => 'medispro',
                'platform' => 'whatsapp',
                'days_ago' => 0,
                'title' => 'Broadcast Promo Klinik Awal Pekan',
                'content_type' => 'Broadcast',
                'link_url' => 'https://wa.me/6281234567890?text=Halo%20Medispro',
                'leads_count' => 38,
                'reach_count' => 450,
                'engagement_count' => 65,
                'notes' => 'Konversi leads sangat tinggi dari broadcast kontak loyal.',
            ],
            [
                'brand' => 'medispro',
                'platform' => 'instagram',
                'days_ago' => 1,
                'title' => 'Reels Edukasi Perawatan Alat Sterilisasi',
                'content_type' => 'Reels',
                'link_url' => 'https://www.instagram.com/reel/sample1',
                'leads_count' => 24,
                'reach_count' => 3400,
                'engagement_count' => 310,
                'notes' => 'Banyak DM menanyakan pricelist paket klinik.',
            ],
            [
                'brand' => 'medispro',
                'platform' => 'facebook',
                'days_ago' => 2,
                'title' => 'Post Katalog Produk Bedah & Alkes Rumah Sakit',
                'content_type' => 'Feed',
                'link_url' => 'https://facebook.com/medispro/posts/102',
                'leads_count' => 14,
                'reach_count' => 1800,
                'engagement_count' => 95,
                'notes' => 'Respons bagus dari grup komunitas pengadaan alkes.',
            ],
            [
                'brand' => 'medispro',
                'platform' => 'threads',
                'days_ago' => 3,
                'title' => 'Thread Tips Manajemen Inventaris Klinik',
                'content_type' => 'Story',
                'link_url' => 'https://threads.net/@medispro/post/301',
                'leads_count' => 6,
                'reach_count' => 890,
                'engagement_count' => 74,
                'notes' => 'Diskusi aktif dengan dokter muda dan praktisi.',
            ],

            // Eleventrent
            [
                'brand' => 'eleventrent',
                'platform' => 'instagram',
                'days_ago' => 0,
                'title' => 'Story Flash Sale Sewa Mobil Bulanan Perusahaan',
                'content_type' => 'Story',
                'link_url' => 'https://instagram.com/eleventrent',
                'leads_count' => 32,
                'reach_count' => 4100,
                'engagement_count' => 220,
                'notes' => 'Sticker link ke WA banyak diklik.',
            ],
            [
                'brand' => 'eleventrent',
                'platform' => 'whatsapp',
                'days_ago' => 1,
                'title' => 'Follow up Database Rental Mingguan',
                'content_type' => 'Direct Message',
                'link_url' => 'https://wa.me/628111222333',
                'leads_count' => 45,
                'reach_count' => 210,
                'engagement_count' => 78,
                'notes' => '12 dealing booking mobil operasional minggu ini.',
            ],
            [
                'brand' => 'eleventrent',
                'platform' => 'facebook',
                'days_ago' => 2,
                'title' => 'Iklan Facebook Marketplace Rental Armada Hiace',
                'content_type' => 'Ads',
                'link_url' => 'https://facebook.com/marketplace/item/103',
                'leads_count' => 22,
                'reach_count' => 5200,
                'engagement_count' => 140,
                'notes' => 'Inquiry rental luar kota banyak masuk.',
            ],
            [
                'brand' => 'eleventrent',
                'platform' => 'threads',
                'days_ago' => 4,
                'title' => 'Review Pelanggan Trip Wisata Eleventrent',
                'content_type' => 'Feed',
                'link_url' => 'https://threads.net/@eleventrent',
                'leads_count' => 8,
                'reach_count' => 1200,
                'engagement_count' => 110,
                'notes' => 'Branding awareness bagus.',
            ],

            // Kuuva
            [
                'brand' => 'kuuva',
                'platform' => 'instagram',
                'days_ago' => 0,
                'title' => 'Reels Launching Koleksi Terbaru Spring/Summer',
                'content_type' => 'Reels',
                'link_url' => 'https://instagram.com/reel/kuuva-new',
                'leads_count' => 52,
                'reach_count' => 8900,
                'engagement_count' => 920,
                'notes' => 'Traffic tertinggi minggu ini, klik link bio tembus 200+.',
            ],
            [
                'brand' => 'kuuva',
                'platform' => 'threads',
                'days_ago' => 1,
                'title' => 'Diskusi OOTD Minimalis & Styling Tips',
                'content_type' => 'Feed',
                'link_url' => 'https://threads.net/@kuuva/post/ootd',
                'leads_count' => 19,
                'reach_count' => 3100,
                'engagement_count' => 430,
                'notes' => 'Audiens Threads sangat cocok dengan target market fashion Kuuva.',
            ],
            [
                'brand' => 'kuuva',
                'platform' => 'whatsapp',
                'days_ago' => 2,
                'title' => 'CS Fast Response Chat WhatsApp Catalog',
                'content_type' => 'Broadcast',
                'link_url' => 'https://wa.me/628998877665',
                'leads_count' => 36,
                'reach_count' => 350,
                'engagement_count' => 88,
                'notes' => 'Order langsung via form catalog WA.',
            ],
            [
                'brand' => 'kuuva',
                'platform' => 'facebook',
                'days_ago' => 3,
                'title' => 'Photo Album Koleksi Aksesoris Wanita',
                'content_type' => 'Feed',
                'link_url' => 'https://facebook.com/kuuvafashion',
                'leads_count' => 15,
                'reach_count' => 2400,
                'engagement_count' => 115,
                'notes' => 'Peminat banyak dari kalangan ibu muda.',
            ],

            // Pikago
            [
                'brand' => 'pikago',
                'platform' => 'whatsapp',
                'days_ago' => 0,
                'title' => 'Hotline Penjemputan Paket Sameday Ekspedisi',
                'content_type' => 'Direct Message',
                'link_url' => 'https://wa.me/6287766554433',
                'leads_count' => 42,
                'reach_count' => 310,
                'engagement_count' => 92,
                'notes' => 'Banyak order pick-up dari seller marketplace.',
            ],
            [
                'brand' => 'pikago',
                'platform' => 'facebook',
                'days_ago' => 1,
                'title' => 'Posting di Grup Komunitas UMKM Pengiriman Murah',
                'content_type' => 'Feed',
                'link_url' => 'https://facebook.com/groups/umkm/post/99',
                'leads_count' => 28,
                'reach_count' => 4800,
                'engagement_count' => 160,
                'notes' => 'Leads seller baru bertambah signifikan.',
            ],
            [
                'brand' => 'pikago',
                'platform' => 'instagram',
                'days_ago' => 2,
                'title' => 'Behind The Scene Gudang Sortir Pikago',
                'content_type' => 'Reels',
                'link_url' => 'https://instagram.com/reel/pikago-bts',
                'leads_count' => 18,
                'reach_count' => 3200,
                'engagement_count' => 180,
                'notes' => 'Membangun trust kecepatan pengiriman paket.',
            ],
            [
                'brand' => 'pikago',
                'platform' => 'threads',
                'days_ago' => 3,
                'title' => 'Tips Packing Barang Pecah Belah',
                'content_type' => 'Feed',
                'link_url' => 'https://threads.net/@pikago',
                'leads_count' => 7,
                'reach_count' => 950,
                'engagement_count' => 84,
                'notes' => 'Edukasi pengirim barang.',
            ],

            // Kumtura
            [
                'brand' => 'kumtura',
                'platform' => 'instagram',
                'days_ago' => 0,
                'title' => 'Carousel Portofolio Kampanye Marketing Kumtura',
                'content_type' => 'Feed',
                'link_url' => 'https://instagram.com/p/kumtura-case-study',
                'leads_count' => 31,
                'reach_count' => 4500,
                'engagement_count' => 390,
                'notes' => 'Inquiry konsultasi digital agency corporate.',
            ],
            [
                'brand' => 'kumtura',
                'platform' => 'whatsapp',
                'days_ago' => 1,
                'title' => 'Konsultasi Privat via WhatsApp Official',
                'content_type' => 'Direct Message',
                'link_url' => 'https://wa.me/6281299001122',
                'leads_count' => 29,
                'reach_count' => 150,
                'engagement_count' => 60,
                'notes' => 'Leads B2B masuk untuk jasa digital ads management.',
            ],
            [
                'brand' => 'kumtura',
                'platform' => 'threads',
                'days_ago' => 2,
                'title' => 'Kupas Tuntas Trend Algoritma Social Media 2026',
                'content_type' => 'Feed',
                'link_url' => 'https://threads.net/@kumtura/post/algo2026',
                'leads_count' => 16,
                'reach_count' => 2900,
                'engagement_count' => 340,
                'notes' => 'Viral di kalangan marketer & founder bisnis.',
            ],
            [
                'brand' => 'kumtura',
                'platform' => 'facebook',
                'days_ago' => 3,
                'title' => 'Studi Kasus Efisiensi ROAS Ads untuk Bisnis Lokal',
                'content_type' => 'Feed',
                'link_url' => 'https://facebook.com/kumtura/case-study',
                'leads_count' => 21,
                'reach_count' => 3700,
                'engagement_count' => 145,
                'notes' => 'Komentar minta proposal kerjasama.',
            ],
        ];

        foreach ($sampleActivities as $act) {
            TrackingTask::create([
                'user_id' => $staff->id,
                'brand_id' => $createdBrands[$act['brand']]->id,
                'platform_id' => $createdPlatforms[$act['platform']]->id,
                'task_date' => $today->copy()->subDays($act['days_ago'])->format('Y-m-d'),
                'title' => $act['title'],
                'content_type' => $act['content_type'],
                'link_url' => $act['link_url'],
                'screenshot_path' => null,
                'leads_count' => $act['leads_count'],
                'reach_count' => $act['reach_count'],
                'engagement_count' => $act['engagement_count'],
                'notes' => $act['notes'],
                'status' => 'completed',
            ]);
        }
    }
}
