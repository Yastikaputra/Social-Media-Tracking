<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use App\Models\Platform;
use App\Models\TrackingTask;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class TrackingTaskController extends Controller
{
    public function index(Request $request)
    {
        $query = TrackingTask::with(['user:id,name,email,role', 'brand', 'platform']);

        if ($request->filled('brand_slug')) {
            $brand = Brand::where('slug', $request->brand_slug)->first();
            if ($brand) {
                $query->where('brand_id', $brand->id);
            }
        } elseif ($request->filled('brand_id')) {
            $query->where('brand_id', $request->brand_id);
        }

        if ($request->filled('platform_slug')) {
            $platform = Platform::where('slug', $request->platform_slug)->first();
            if ($platform) {
                $query->where('platform_id', $platform->id);
            }
        } elseif ($request->filled('platform_id')) {
            $query->where('platform_id', $request->platform_id);
        }

        if ($request->filled('start_date')) {
            $query->whereDate('task_date', '>=', $request->start_date);
        }

        if ($request->filled('end_date')) {
            $query->whereDate('task_date', '<=', $request->end_date);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('notes', 'like', "%{$search}%")
                  ->orWhere('follow_up', 'like', "%{$search}%")
                  ->orWhere('pic_name', 'like', "%{$search}%")
                  ->orWhere('link_url', 'like', "%{$search}%");
            });
        }

        $tasks = $query->orderBy('task_date', 'desc')
                       ->orderBy('id', 'desc')
                       ->paginate($request->input('per_page', 50));

        return response()->json($tasks);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'brand_id' => 'required|exists:brands,id',
            'platform_id' => 'required|exists:platforms,id',
            'task_date' => 'required|date',
            'title' => 'required|string|max:255',
            'pic_name' => 'nullable|string|max:255',
            'content_type' => 'nullable|string|max:100',
            'link_url' => 'nullable|url|max:2000',
            'screenshot' => 'nullable|image|max:10240', // max 10MB
            'leads_count' => 'nullable|integer|min:0',
            'reach_count' => 'nullable|integer|min:0',
            'engagement_count' => 'nullable|integer|min:0',
            'notes' => 'nullable|string',
            'follow_up' => 'nullable|string',
            'status' => 'nullable|string|in:completed,in_progress,reviewed',
        ]);

        $screenshotPath = null;
        if ($request->hasFile('screenshot')) {
            $screenshotPath = $request->file('screenshot')->store('screenshots', 'public');
        }

        $task = TrackingTask::create([
            'user_id' => $request->user()->id,
            'pic_name' => $validated['pic_name'] ?? $request->user()->name,
            'brand_id' => $validated['brand_id'],
            'platform_id' => $validated['platform_id'],
            'task_date' => $validated['task_date'],
            'title' => $validated['title'],
            'content_type' => $validated['content_type'] ?? 'Post/Content',
            'link_url' => $validated['link_url'] ?? null,
            'screenshot_path' => $screenshotPath,
            'leads_count' => $validated['leads_count'] ?? 0,
            'reach_count' => $validated['reach_count'] ?? 0,
            'engagement_count' => $validated['engagement_count'] ?? 0,
            'notes' => $validated['notes'] ?? null,
            'follow_up' => $validated['follow_up'] ?? null,
            'status' => $validated['status'] ?? 'completed',
        ]);

        $task->load(['user:id,name,email,role', 'brand', 'platform']);

        return response()->json([
            'message' => 'Tracking task berhasil disimpan',
            'task' => $task,
        ], 201);
    }

    public function show($id)
    {
        $task = TrackingTask::with(['user:id,name,email,role', 'brand', 'platform'])->findOrFail($id);
        return response()->json(['task' => $task]);
    }

    public function update(Request $request, $id)
    {
        $task = TrackingTask::findOrFail($id);

        $validated = $request->validate([
            'brand_id' => 'sometimes|exists:brands,id',
            'platform_id' => 'sometimes|exists:platforms,id',
            'task_date' => 'sometimes|date',
            'title' => 'sometimes|string|max:255',
            'pic_name' => 'nullable|string|max:255',
            'content_type' => 'nullable|string|max:100',
            'link_url' => 'nullable|url|max:2000',
            'screenshot' => 'nullable|image|max:10240',
            'leads_count' => 'nullable|integer|min:0',
            'reach_count' => 'nullable|integer|min:0',
            'engagement_count' => 'nullable|integer|min:0',
            'notes' => 'nullable|string',
            'follow_up' => 'nullable|string',
            'status' => 'nullable|string|in:completed,in_progress,reviewed',
        ]);

        if ($request->hasFile('screenshot')) {
            // Delete old screenshot if exists
            if ($task->screenshot_path && Storage::disk('public')->exists($task->screenshot_path)) {
                Storage::disk('public')->delete($task->screenshot_path);
            }
            $task->screenshot_path = $request->file('screenshot')->store('screenshots', 'public');
        }

        $task->fill(collect($validated)->except('screenshot')->toArray());
        $task->save();
        $task->load(['user:id,name,email,role', 'brand', 'platform']);

        return response()->json([
            'message' => 'Tracking task berhasil diperbarui',
            'task' => $task,
        ]);
    }

    public function destroy($id)
    {
        $task = TrackingTask::findOrFail($id);

        if ($task->screenshot_path && Storage::disk('public')->exists($task->screenshot_path)) {
            Storage::disk('public')->delete($task->screenshot_path);
        }

        $task->delete();

        return response()->json([
            'message' => 'Tracking task berhasil dihapus',
        ]);
    }
}
