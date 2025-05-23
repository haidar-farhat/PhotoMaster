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
    Route::apiResource('pictures', PictureController::class);
    Route::post('/pictures/{id}/replace', [PictureController::class, 'replace']);
    Route::patch('/pictures/{picture}/image', [PictureController::class, 'replaceImage']);
    Route::options('/pictures/{picture}/image', function() {
        return response()->json(['message' => 'OK'], 200);
    });

    // User photos - FIXED: removed duplicate route
    Route::get('/users/{user}/photos', [PictureController::class, 'getUserPhotos']);

    // Login history
    Route::get('/users/{user}/login-history', [LoginLogController::class, 'getUserLoginHistory']);

    // User management
    Route::apiResource('users', UserController::class)->except(['store']);

    // Image retrieval routes
    Route::get('pictures/{picture}/image', [PictureController::class, 'getImage'])->name('pictures.image');
    Route::get('pictures/{picture}/thumbnail', [PictureController::class, 'getThumbnail'])->name('pictures.thumbnail');
});
