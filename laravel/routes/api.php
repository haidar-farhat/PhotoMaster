<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\PictureController;
use App\Http\Controllers\LoginLogController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserController;

// Test route
Route::get('/test', function () {
    return response()->json(['message' => 'API is working!']);
});

// Auth routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth management
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/profile', function (Request $request) {
        return $request->user();
    });

    // Pictures management
    Route::apiResource('pictures', PictureController::class)->except(['update']);
    Route::post('pictures/{picture}/upload', [PictureController::class, 'upload']);

    // Login logs
    Route::apiResource('login-logs', LoginLogController::class)->only(['index', 'show']);

    // User management
// UserController routes are defined below

    // In protected routes group:
Route::apiResource('users', UserController::class)->except(['store']);

// Protected routes group
Route::get('/users/{user}/photos', [PictureController::class, 'getUserPhotos']);
});

// Catch-all for undefined routes
Route::any('{any}', function () {
    return response()->json(['message' => 'Endpoint not found'], 404);
})->where('any', '.*');
