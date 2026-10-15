<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use Illuminate\Http\Request;

class BrandController extends Controller
{
    public function index()
    {
        $brands = Brand::withCount('trackingTasks')
            ->withSum('trackingTasks as total_leads', 'leads_count')
            ->withSum('trackingTasks as total_reach', 'reach_count')
            ->get();

        return response()->json([
            'brands' => $brands,
        ]);
    }

    public function show($slug)
    {
        $brand = Brand::where('slug', $slug)
            ->withCount('trackingTasks')
            ->withSum('trackingTasks as total_leads', 'leads_count')
            ->withSum('trackingTasks as total_reach', 'reach_count')
            ->firstOrFail();

        // Get leads by platform for this brand
        $platformStats = \App\Models\Platform::all()->map(function ($platform) use ($brand) {
            $tasks = $brand->trackingTasks()->where('platform_id', $platform->id);
            return [
                'platform_id' => $platform->id,
                'name' => $platform->name,
                'slug' => $platform->slug,
                'color' => $platform->color,
                'icon' => $platform->icon,
                'total_tasks' => $tasks->count(),
                'total_leads' => (int) $tasks->sum('leads_count'),
                'total_reach' => (int) $tasks->sum('reach_count'),
                'total_engagement' => (int) $tasks->sum('engagement_count'),
            ];
        });

        return response()->json([
            'brand' => $brand,
            'platform_stats' => $platformStats,
        ]);
    }
}
