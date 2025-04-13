<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\PictureController;
use App\Http\Controllers\LoginLogController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserController;
use App\Models\User;

// Test route
Route::get('/test', function () {
    return response()->json(['message' => 'API is working!']);
});

// Auth routes
// Change this line
// Update the AuthController route registration
// AuthController is already imported at the top of the file

// Add these routes with proper namespace
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::middleware('auth:sanctum')->post('/logout', [AuthController::class, 'logout']);

// Protected routes
// Update the pictures routes in the auth:sanctum middleware group
Route::middleware('auth:sanctum')->group(function () {
    // Auth management
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/profile', function (Request $request) {
        return $request->user();
    });

    // Pictures management
    Route::apiResource('pictures', PictureController::class);
    Route::post('pictures/{picture}/replace', [PictureController::class, 'replaceImage']);

    // User photos
    Route::get('/users/{user}/photos', [PictureController::class, 'getUserPhotos']);

    // Login history
    Route::get('/users/{user}/login-history', [LoginLogController::class, 'getUserLoginHistory']);

    // User management
    Route::apiResource('users', UserController::class)->except(['store']);
    Route::get('/users/{user}/photos', [PictureController::class, 'getUserPhotos']);

    // Login logs
    Route::get('/users/{user}/login-history', [LoginLogController::class, 'getUserLoginHistory']);

    // Routes inside this group are still protected by auth:sanctum
});

// Image retrieval routes (moved outside group, but still protected)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('pictures/{picture}/image', [PictureController::class, 'getImage'])->name('pictures.image');
    Route::get('pictures/{picture}/thumbnail', [PictureController::class, 'getThumbnail'])->name('pictures.thumbnail');
});

// Catch-all for undefined routes
Route::any('{any}', function () {
    return response()->json(['message' => 'Endpoint not found'], 404);
})->where('any', '.*');
