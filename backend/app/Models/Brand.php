<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Brand extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'color',
        'monthly_lead_target',
    ];

    public function trackingTasks()
    {
        return $this->hasMany(TrackingTask::class);
    }
}
