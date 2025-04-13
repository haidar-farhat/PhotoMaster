<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\Models\User;
use App\Models\Picture;
use App\Services\PictureService;
use App\Rules\Base64Image;
use Illuminate\Support\Facades\Log;

class PictureController extends Controller
{
    protected $pictureService;

    public function __construct(PictureService $pictureService)
    {
        $this->pictureService = $pictureService;
    }

    public function index()
    {
        return $this->pictureService->getAll();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'user_id' => 'required|exists:users,id',
            'filename' => 'required|string|max:255',
            'photo' => 'required|file|image|max:10240',
        ]);

        try {
            $file = $request->file('photo');

            // Generate a unique filename with original extension
            $originalExtension = $file->getClientOriginalExtension();
            $uniqueFilename = uniqid() . '_' . time() . '.' . $originalExtension;

            // Create user-specific folder with better organization
            $userFolder = 'users/' . $data['user_id'] . '/' . date('Y/m');

            // Store with custom filename
            $path = $file->storeAs($userFolder, $uniqueFilename, 'public');

            // Generate optimized thumbnail
            $thumbnailPath = $this->createThumbnail($file, $userFolder, $uniqueFilename);

            // Make sure URLs are correctly generated
            $url = url('storage/' . $path);
            $thumbnailUrl = $thumbnailPath ? url('storage/' . $thumbnailPath) : null;

            $picture = $this->pictureService->create([
                'user_id' => $data['user_id'],
                'filename' => $data['filename'],
                'path' => $path,
                'thumbnail_path' => $thumbnailPath,
                'file_size' => $file->getSize(),
                'mime_type' => $file->getMimeType(),
                'url' => $url,
                'thumbnail_url' => $thumbnailUrl
            ]);

            // Add error handling for empty response
            if (!$picture) {
                throw new \Exception('Failed to create picture record');
            }

            return response()->json([
                'id' => $picture->id,
                'user_id' => $picture->user_id,
                'filename' => $picture->filename,
                'path' => $picture->path,
                'url' => $picture->url,
                'created_at' => $picture->created_at
            ], 201);

        } catch (\Exception $e) {
            Log::error('Image storage failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Image upload failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show(Picture $picture)
    {
        return response()->json($picture);
    }

    public function update(Request $request, Picture $picture)
    {
        $data = $request->validate([
            'filename' => 'sometimes|string|max:255',
        ]);

        $this->pictureService->update($picture->id, $data);

        return response()->json($picture->fresh());
    }

    public function destroy(Picture $picture)
    {
        $result = $this->pictureService->delete($picture->id);

        if ($result) {
            return response()->json(['message' => 'Picture deleted successfully']);
        }

        return response()->json(['message' => 'Failed to delete picture'], 500);
    }

    public function replaceImage(Request $request, Picture $picture)
    {
        $data = $request->validate([
            'base64_image' => ['required', new Base64Image],
        ]);

        try {
            $updatedPicture = $this->pictureService->replaceImage($picture, $data['base64_image']);

            return response()->json($updatedPicture);
        } catch (\Exception $e) {
            Log::error('Image replacement failed', [
                'error' => $e->getMessage(),
                'picture_id' => $picture->id
            ]);

            return response()->json([
                'message' => 'Image replacement failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getUserPhotos(User $user)
    {
        $photos = $this->pictureService->getByUserId($user->id);
        return response()->json($photos);
    }

    /**
     * Create a thumbnail version of the uploaded image
     *
     * @param mixed $file
     * @param mixed $folder
     * @param mixed $filename
     * @return string|null
     */
    private function createThumbnail($file, $folder, $filename)
    {
        try {
            // Load image with Intervention Image
            $image = \Intervention\Image\Facades\Image::make($file);

            // Create thumbnail filename
            $thumbnailFilename = 'thumb_' . $filename;
            $thumbnailPath = $folder . '/' . $thumbnailFilename;
            $fullPath = storage_path('app/public/' . $folder);

            // Create directory if it doesn't exist
            if (!file_exists($fullPath)) {
                mkdir($fullPath, 0755, true);
            }

            // Resize and save thumbnail
            $image->resize(300, null, function ($constraint) {
                $constraint->aspectRatio();
                $constraint->upsize();
            })->save(storage_path('app/public/' . $thumbnailPath));

            return $thumbnailPath;
        } catch (\Exception $e) {
            Log::error('Thumbnail creation failed: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Get the image file for a specific picture
     */
    public function getImage(Picture $picture)
    {
        // Check if file exists in storage
        $path = storage_path('app/public/' . $picture->path);

        if (!file_exists($path)) {
            return response()->json(['error' => 'Image not found'], 404);
        }

        // Return the file with proper content type
        return response()->file($path);
    }

    /**
     * Get the thumbnail image for a specific picture
     */
    public function getThumbnail(Picture $picture)
    {
        // If no thumbnail, return the original image
        if (!$picture->thumbnail_path) {
            return $this->getImage($picture);
        }

        // Check if thumbnail exists
        $path = storage_path('app/public/' . $picture->thumbnail_path);

        if (!file_exists($path)) {
            // Fallback to original image
            return $this->getImage($picture);
        }

        // Return the file with proper content type
        return response()->file($path);
    }
}
