<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use App\Models\Platform;
use App\Models\TrackingTask;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller
{
    public function dashboard(Request $request)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json([
                'message' => 'Akses ditolak. Dashboard analitik hanya dapat diakses oleh Admin.',
            ], 403);
        }

        $brandSlug = $request->query('brand_slug');
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        $query = TrackingTask::query();

        $selectedBrand = null;
        if ($brandSlug) {
            $selectedBrand = Brand::where('slug', $brandSlug)->first();
            if ($selectedBrand) {
                $query->where('brand_id', $selectedBrand->id);
            }
        }

        if ($startDate) {
            $query->whereDate('task_date', '>=', $startDate);
        }
        if ($endDate) {
            $query->whereDate('task_date', '<=', $endDate);
        }

        // Summary metrics
        $totalLeads = (int) (clone $query)->sum('leads_count');
        $totalReach = (int) (clone $query)->sum('reach_count');
        $totalEngagement = (int) (clone $query)->sum('engagement_count');
        $totalTasks = (clone $query)->count();

        // 1. Leads by Platform (Mana yang paling 'kena')
        $platforms = Platform::all();
        $leadsByPlatform = $platforms->map(function ($platform) use ($query, $totalLeads) {
            $platformQuery = (clone $query)->where('platform_id', $platform->id);
            $platformLeads = (int) $platformQuery->sum('leads_count');
            $platformReach = (int) $platformQuery->sum('reach_count');
            $platformTasks = $platformQuery->count();
            $percentage = $totalLeads > 0 ? round(($platformLeads / $totalLeads) * 100, 1) : 0;

            return [
                'platform_id' => $platform->id,
                'name' => $platform->name,
                'slug' => $platform->slug,
                'color' => $platform->color,
                'icon' => $platform->icon,
                'leads' => $platformLeads,
                'reach' => $platformReach,
                'tasks_count' => $platformTasks,
                'percentage' => $percentage,
            ];
        })->sortByDesc('leads')->values();

        $topPlatform = $leadsByPlatform->first();

        // 2. Leads by Brand
        $brands = Brand::all();
        $leadsByBrand = $brands->map(function ($brand) use ($startDate, $endDate) {
            $brandQuery = TrackingTask::where('brand_id', $brand->id);
            if ($startDate) $brandQuery->whereDate('task_date', '>=', $startDate);
            if ($endDate) $brandQuery->whereDate('task_date', '<=', $endDate);

            $brandLeads = (int) $brandQuery->sum('leads_count');
            $brandReach = (int) $brandQuery->sum('reach_count');
            $brandTasks = $brandQuery->count();
            $target = $brand->monthly_lead_target ?: 100;
            $achievement = $target > 0 ? round(($brandLeads / $target) * 100, 1) : 0;

            return [
                'brand_id' => $brand->id,
                'name' => $brand->name,
                'slug' => $brand->slug,
                'color' => $brand->color,
                'leads' => $brandLeads,
                'reach' => $brandReach,
                'tasks_count' => $brandTasks,
                'target' => $target,
                'achievement_pct' => $achievement,
            ];
        })->sortByDesc('leads')->values();

        $topBrand = $leadsByBrand->first();

        // 3. Matrix & Per-Unit Brand Social Media Breakdown (WA, IG, FB, Threads)
        $brandPlatformMatrix = $brands->map(function ($brand) use ($platforms, $startDate, $endDate) {
            $row = [
                'brand_id' => $brand->id,
                'brand_name' => $brand->name,
                'brand_slug' => $brand->slug,
                'brand_color' => $brand->color,
                'target' => $brand->monthly_lead_target ?: 100,
            ];

            $totalBrandLeads = 0;
            $totalBrandReach = 0;
            $platformBreakdown = [];

            foreach ($platforms as $platform) {
                $q = TrackingTask::where('brand_id', $brand->id)
                    ->where('platform_id', $platform->id);
                if ($startDate) $q->whereDate('task_date', '>=', $startDate);
                if ($endDate) $q->whereDate('task_date', '<=', $endDate);

                $leads = (int) $q->sum('leads_count');
                $reach = (int) $q->sum('reach_count');
                $tasks = $q->count();

                $row[$platform->slug] = $leads;
                $row[$platform->slug . '_reach'] = $reach;
                $row[$platform->slug . '_tasks'] = $tasks;

                $totalBrandLeads += $leads;
                $totalBrandReach += $reach;

                $platformBreakdown[] = [
                    'platform_id' => $platform->id,
                    'name' => $platform->name,
                    'slug' => $platform->slug,
                    'color' => $platform->color,
                    'icon' => $platform->icon,
                    'leads' => $leads,
                    'reach' => $reach,
                    'tasks_count' => $tasks,
                ];
            }

            usort($platformBreakdown, function ($a, $b) {
                return $b['leads'] <=> $a['leads'];
            });

            $row['total_leads'] = $totalBrandLeads;
            $row['total_reach'] = $totalBrandReach;
            $row['achievement_pct'] = $row['target'] > 0 ? round(($totalBrandLeads / $row['target']) * 100, 1) : 0;
            $row['platforms'] = $platformBreakdown;
            $row['top_platform'] = count($platformBreakdown) > 0 ? $platformBreakdown[0] : null;

            return $row;
        });

        // 4. Trend Over Time (Last 14 days or filtered period)
        $minDate = $startDate ? Carbon::parse($startDate) : Carbon::today()->subDays(13);
        $maxDate = $endDate ? Carbon::parse($endDate) : Carbon::today();

        $trendData = [];
        $current = $minDate->copy();
        while ($current <= $maxDate) {
            $dateStr = $current->format('Y-m-d');
            $dateQuery = (clone $query)->whereDate('task_date', $dateStr);

            $entry = [
                'date' => $dateStr,
                'formatted_date' => $current->format('d M'),
                'total_leads' => (int) (clone $dateQuery)->sum('leads_count'),
            ];

            foreach ($platforms as $plat) {
                $entry[$plat->slug] = (int) (clone $dateQuery)->where('platform_id', $plat->id)->sum('leads_count');
            }

            $trendData[] = $entry;
            $current->addDay();
        }

        // 5. Recent Activity Logs
        $recentTasks = (clone $query)
            ->with(['user:id,name', 'brand:id,name,slug,color', 'platform:id,name,slug,color'])
            ->orderBy('task_date', 'desc')
            ->orderBy('id', 'desc')
            ->limit(10)
            ->get();

        return response()->json([
            'summary' => [
                'total_leads' => $totalLeads,
                'total_reach' => $totalReach,
                'total_engagement' => $totalEngagement,
                'total_tasks' => $totalTasks,
                'top_platform' => $topPlatform,
                'top_brand' => $topBrand,
                'conversion_rate' => $totalReach > 0 ? round(($totalLeads / $totalReach) * 100, 2) : 0,
            ],
            'leads_by_platform' => $leadsByPlatform,
            'leads_by_brand' => $leadsByBrand,
            'brand_platform_matrix' => $brandPlatformMatrix,
            'leads_trend' => $trendData,
            'recent_tasks' => $recentTasks,
            'selected_brand' => $selectedBrand,
        ]);
    }
}
