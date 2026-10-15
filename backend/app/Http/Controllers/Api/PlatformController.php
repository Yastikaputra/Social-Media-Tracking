<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Platform;
use Illuminate\Http\Request;

class PlatformController extends Controller
{
    public function index()
    {
        $platforms = Platform::withCount('trackingTasks')
            ->withSum('trackingTasks as total_leads', 'leads_count')
            ->get();

        return response()->json([
            'platforms' => $platforms,
        ]);
    }
}
