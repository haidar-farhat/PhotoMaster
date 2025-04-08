<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\Models\User;
use App\Services\PictureService;

class PictureController extends Controller
{
    protected $pictureService;

    public function __construct(PictureService $pictureService)
    {
        $this->pictureService = $pictureService;
    }

    public function index() {
        return $this->pictureService->getAll();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'user_id' => 'required|exists:users,id',
            'base64_image' => ['required', new \App\Rules\Base64Image], // Fixed validation
            'filename' => 'required|string|max:255'
        ]);

        try {
            $imageData = base64_decode(preg_replace('#^data:image/\w+;base64,#i', '', $data['base64_image']));
            $path = 'images/' . $data['user_id'] . '/' . $data['filename'];

            // Create directory if not exists
            Storage::makeDirectory('images/' . $data['user_id']);

            Storage::put($path, $imageData);

            $picture = $this->pictureService->create([
                'user_id' => $data['user_id'],
                'filename' => $data['filename'],
                'path' => $path,
                'url' => asset(Storage::url($path))
            ]);

            return response()->json($picture, 201);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Image save failed: ' . $e->getMessage()], 500);
        }
    }

    public function getUserPhotos(User $user)
    {
        $photos = $this->pictureService->getByUserId($user->id);
        return response()->json($photos);
    }
}
