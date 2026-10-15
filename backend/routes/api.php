<?php

use App\Http\Controllers\Api\AnalyticsController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BrandController;
use App\Http\Controllers\Api\PlatformController;
use App\Http\Controllers\Api\TrackingTaskController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

// Public routes
Route::post('/login', [AuthController::class, 'login']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth & Profile
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Brands & Platforms
    Route::get('/brands', [BrandController::class, 'index']);
    Route::get('/brands/{slug}', [BrandController::class, 'show']);
    Route::get('/platforms', [PlatformController::class, 'index']);

    // Users Management
    Route::apiResource('users', UserController::class);

    // Tracking Tasks (SS, link, leads)
    Route::apiResource('tracking-tasks', TrackingTaskController::class);

    // Analytics & Diagrams
    Route::get('/analytics/dashboard', [AnalyticsController::class, 'dashboard']);
});
