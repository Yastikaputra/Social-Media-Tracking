<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class TrackingTask extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'pic_name',
        'brand_id',
        'platform_id',
        'task_date',
        'title',
        'content_type',
        'link_url',
        'screenshot_path',
        'leads_count',
        'reach_count',
        'engagement_count',
        'notes',
        'status',
    ];

    protected $appends = ['screenshot_url'];

    public function getScreenshotUrlAttribute()
    {
        if ($this->screenshot_path) {
            return asset('storage/' . $this->screenshot_path);
        }
        return null;
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function brand()
    {
        return $this->belongsTo(Brand::class);
    }

    public function platform()
    {
        return $this->belongsTo(Platform::class);
    }
}
