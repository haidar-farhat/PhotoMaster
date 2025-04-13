<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Response as ResponseFacade;
use App\Models\User;
use App\Models\Picture;
use App\Services\PictureService;
use App\Rules\Base64Image;
use Intervention\Image\Facades\Image;

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

            $pictureData = [
                'user_id' => $data['user_id'],
                'filename' => $data['filename'],
                'path' => $path,
                'thumbnail_path' => $thumbnailPath,
                'file_size' => $file->getSize(),
                'mime_type' => $file->getMimeType(),
                'url' => $url,
                'thumbnail_url' => $thumbnailUrl
            ];

            Log::info('Picture data before saving:', $pictureData); // Add logging here

            $picture = $this->pictureService->create($pictureData);

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
        try {
            ini_set('memory_limit', '512M');
            ini_set('max_execution_time', '300');

            $request->validate([
                'base64_image' => ['required', new Base64Image],
            ]);

            if (!preg_match('/^data:image\/jpeg;base64,(.+)/', $request->base64_image, $matches)) {
                throw new \Exception('Invalid JPEG base64 format');
            }

            $decodedData = base64_decode($matches[1], true);
            if ($decodedData === false) {
                throw new \Exception('Base64 decoding failed');
            }

            if (!@imagecreatefromstring($decodedData)) {
                throw new \Exception('Invalid JPEG content');
            }

            $img = Image::make($decodedData);
            $img->encode('jpg', 80);

            // Keep existing folder structure
            $userFolder = 'users/' . $picture->user_id . '/' . date('Y/m');
            $filename = uniqid() . '_' . time() . '.jpg';
            $storagePath = "$userFolder/$filename";

            // Delete old files (keep original implementation)
            Storage::disk('public')->delete([$picture->path, $picture->thumbnail_path]);

            // Store new image
            Storage::disk('public')->put($storagePath, $img->stream());

            // Create thumbnail (keep original implementation)
            // Create thumbnail - fix extension parameter
            $thumbnailPath = $this->createThumbnailFromIntervention($img, $userFolder, $filename, 'jpg');

            // Update database record (keep original fields)
            $updatedData = [
                'filename' => $filename,
                'path' => $storagePath,
                'thumbnail_path' => $thumbnailPath,
                'file_size' => $img->filesize(),
                'mime_type' => 'image/jpeg',
                'url' => url('storage/' . $storagePath),
                'thumbnail_url' => $thumbnailPath ? url('storage/' . $thumbnailPath) : null
            ];

            $this->pictureService->update($picture->id, $updatedData);

            return response()->json([
                'message' => 'Image replaced successfully',
                'picture' => $picture->fresh()
            ]);

        } catch (\Exception $e) {
            Log::error('IMAGE PROCESSING FAILURE', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'picture_id' => $picture->id
            ]);
            return response()->json([
                'message' => 'Image processing failed: ' . $e->getMessage(),
                'error' => $e->getMessage() // Add error details to response
            ], 500);
        }
    }

    public function getUserPhotos(User $user)
    {
        $photos = $this->pictureService->getByUserId($user->id);
        \Illuminate\Support\Facades\Log::info("Photos data BEFORE sending JSON for User ID: {$user->id}", $photos->toArray()); // Log the collection data
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
        Log::info("Attempting to get image for Picture ID: {$picture->id}");
        $storagePath = $picture->path; // Path relative to the disk's root (storage/app/public)

        if (!$picture->path || !Storage::disk('public')->exists($storagePath)) { // Use public disk
            Log::error("Image file not found for Picture ID: {$picture->id} at path: {$storagePath}");
            return response()->json(['error' => 'Image file not found in storage'], 404);
        }

        Log::info("Serving image file from path: {$storagePath}");
        // Return the file with proper content type
        // Use Storage facade to get file path if needed, or directly use response()->file
        // return response()->file(Storage::path($storagePath));
        // Get the full path from the storage disk and return the file response
        $absolutePath = storage_path('app/public/' . $storagePath);

        // Check using Storage facade to ensure path consistency
        if (!Storage::disk('public')->exists($storagePath)) {
            Log::error("Image file not found in storage: {$storagePath}");
            Log::error("Full storage path: " . storage_path('app/public/' . $storagePath));
            throw new NotFoundHttpException('Image not found');
        }

        return response(
            Storage::disk('public')->get($storagePath),
            200,
            [
                'Content-Type' => $picture->mime_type ?? 'application/octet-stream',
                'Cache-Control' => 'public, max-age=31536000'
            ]
        );
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
        Log::info("Attempting to get thumbnail for Picture ID: {$picture->id}");
        $storagePath = $picture->thumbnail_path; // Path relative to the disk's root (storage/app/public)

        if (!$picture->thumbnail_path || !Storage::disk('public')->exists($storagePath)) { // Use public disk
            Log::warning("Thumbnail file not found for Picture ID: {$picture->id} at path: {$storagePath}. Falling back to original image.");
            // Fallback to original image
            return $this->getImage($picture);
        }

        Log::info("Serving thumbnail file from path: {$storagePath}");
        // Return the file with proper content type
        // return response()->file(Storage::path($storagePath));
        // Get the full path from the storage disk and return the file response
        $absolutePath = storage_path('app/public/' . $storagePath);

        // Check using Storage facade to ensure path consistency
        if (!Storage::disk('public')->exists($storagePath)) {
            Log::error("Thumbnail not found in storage: {$storagePath}");
            Log::error("Full storage path: " . storage_path('app/public/' . $storagePath));
            throw new NotFoundHttpException('Thumbnail not found');
        }

        return response(
            Storage::disk('public')->get($storagePath),
            200,
            [
                'Content-Type' => $picture->mime_type ?? 'application/octet-stream',
                'Cache-Control' => 'public, max-age=31536000'
            ]
        );
    }

    /**
     * Create a thumbnail from an Intervention Image instance
     *
     * @param \Intervention\Image\Image $img
     * @param string $folder
     * @param string $filename
     * @return string|null
     */
    private function createThumbnailFromIntervention($img, $folder, $filename, $extension)
    {
        try {
            $thumbnailFilename = 'thumb_' . $filename;
            $thumbnailPath = "$folder/$thumbnailFilename";

            $thumbImg = clone $img;
            $thumbImg->resize(300, null, function ($constraint) {
                $constraint->aspectRatio();
                $constraint->upsize();
            });

            Storage::disk('public')->put($thumbnailPath, $thumbImg->encode($extension));

            return $thumbnailPath;
        } catch (\Exception $e) {
            Log::error('Thumbnail creation error: ' . $e->getMessage());
            return null;
        }
    }
}
