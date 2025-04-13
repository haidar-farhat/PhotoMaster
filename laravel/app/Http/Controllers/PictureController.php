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
            'photo' => 'required|file|image|max:10240', // 10MB max
        ]);

        try {
            Log::info('Processing image upload', ['user_id' => $data['user_id'], 'filename' => $data['filename']]);

            $path = $request->file('photo')->store('images/' . $data['user_id'], 'public');

            $picture = $this->pictureService->create([
                'path' => $path,  // Should be like 'images/1/filename.jpg'
                'url' => asset('storage/'.$path)  // Should generate full URL like http://localhost:8000/storage/images/1/filename.jpg
            ]);

            return response()->json($picture, 201);
        } catch (\Exception $e) {
            Log::error('Image upload failed', [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);

            return response()->json([
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
}
