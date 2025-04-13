<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Response as ResponseFacade;
use App\Models\User;
use App\Models\Picture;
use App\Services\PictureService;
use Intervention\Image\Facades\Image;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Http\Resources\PictureResource;
use Illuminate\Database\Eloquent\ModelNotFoundException;

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
        try {
            $validator = Validator::make($request->all(), [
                'photo' => 'required|file|image|mimes:jpeg,png|max:10240',
                'user_id' => 'required|exists:users,id',
                'filename' => 'required|string|max:255'
            ]);

            if ($validator->fails()) {
                throw new \Exception($validator->errors()->first());
            }

            $file = $request->file('photo');

            Log::info('File details:', [
                'original_name' => $file->getClientOriginalName(),
                'mime_type' => $file->getMimeType(),
                'size' => $file->getSize(),
            ]);

            $originalExtension = $file->getClientOriginalExtension();
            $safeFilename = Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME));
            $uniqueFilename = $safeFilename . '_' . uniqid() . '.' . $originalExtension;

            $userFolder = 'users/' . $request->user_id . '/' . date('Y/m');
            $path = $file->storeAs($userFolder, $uniqueFilename, 'public');
            $thumbnailPath = $this->createThumbnail($file, $userFolder, $uniqueFilename);
            $url = url('storage/' . $path);
            $thumbnailUrl = $thumbnailPath ? url('storage/' . $thumbnailPath) : null;

            $pictureData = [
                'user_id' => $request->user_id,
                'filename' => $request->filename,
                'path' => $path,
                'thumbnail_path' => $thumbnailPath,
                'file_size' => $file->getSize(),
                'mime_type' => $file->getMimeType(),
                'url' => $url,
                'thumbnail_url' => $thumbnailUrl
            ];

            Log::info('Picture data before saving:', $pictureData);

            $picture = $this->pictureService->create($pictureData);

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
            Log::error('UPLOAD ERROR: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'request' => $request->all()
            ]);
            return response()->json([
                'error' => 'FILE_PROCESSING_ERROR',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function show(Picture $picture)
    {
        return response()->json($picture);
    }

    public function update(Request $request, $id)
    {
        try {
            $picture = Picture::findOrFail($id);

            if ($picture->user_id !== Auth::id()) {
                Log::warning('User ' . Auth::id() . ' attempted to update picture ' . $id . ' belonging to user ' . $picture->user_id);
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $this->validate($request, [
                'title' => 'sometimes|required|string|max:255',
                'image' => 'sometimes|required|string',
            ]);

            DB::beginTransaction();

            if ($request->has('title')) {
                $picture->title = $request->title;
            }

            if ($request->has('image')) {
                try {
                    $imageData = $this->extractImageData($request->image);
                    $path = $picture->path;

                    if (empty($path)) {
                        Log::warning('Picture has no path, generating a new one for ID: ' . $id);
                        $filename = uniqid() . '.jpg';
                        $path = 'pictures/' . $filename;
                        $picture->path = $path;
                    }

                    Log::info('Updating image at existing path: ' . $path);

                    if (!$this->saveImageData($imageData, $path)) {
                        throw new \Exception('Failed to save image data');
                    }

                    $picture->file_size = Storage::disk('public')->size($path);
                    $picture->mime_type = 'image/jpeg';

                } catch (\Exception $e) {
                    Log::error('Error processing image update: ' . $e->getMessage());
                    DB::rollBack();
                    return response()->json(['message' => 'Error processing image: ' . $e->getMessage()], 500);
                }
            }

            if (!$picture->save()) {
                Log::error('Failed to save picture to database, ID: ' . $id);
                DB::rollBack();
                return response()->json(['message' => 'Failed to update picture'], 500);
            }

            DB::commit();

            return response()->json([
                'message' => 'Picture updated successfully',
                'picture' => new PictureResource($picture)
            ]);
        } catch (ModelNotFoundException $e) {
            Log::error('Picture not found: ' . $id);
            return response()->json(['message' => 'Picture not found'], 404);
        } catch (\Exception $e) {
            Log::error('Error updating picture: ' . $e->getMessage());
            DB::rollBack();
            return response()->json(['message' => 'Error updating picture: ' . $e->getMessage()], 500);
        }
    }

    public function destroy(Picture $picture)
    {
        try {
            DB::beginTransaction();

            // Delete associated files
            if ($picture->path && Storage::disk('public')->exists($picture->path)) {
                Storage::disk('public')->delete($picture->path);
            }
            if ($picture->thumbnail_path && Storage::disk('public')->exists($picture->thumbnail_path)) {
                Storage::disk('public')->delete($picture->thumbnail_path);
            }

            // Delete database record
            $result = $this->pictureService->delete($picture->id);

            if (!$result) {
                throw new \Exception('Failed to delete picture record');
            }

            DB::commit();
            return response()->json(['message' => 'Picture deleted successfully']);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Deletion Error: ' . $e->getMessage());
            return response()->json([
                'error' => 'DELETION_ERROR',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function replaceImage(Request $request, Picture $picture)
    {
        try {
            $validated = $request->validate([
                'image_data' => 'required|string|min:100'
            ]);

            $binaryData = $this->extractImageData($validated['image_data']);
            $tempFile = tempnam(sys_get_temp_dir(), 'img');
            file_put_contents($tempFile, $binaryData);

            $imageInfo = @getimagesize($tempFile);
            if ($imageInfo === false || $imageInfo[2] !== IMAGETYPE_JPEG) {
                throw new \Exception("Invalid JPEG file content");
            }

            $path = $this->storeProcessedImage($tempFile, $picture);

            $picture->update([
                'path' => $path,
                'file_size' => filesize($tempFile),
                'mime_type' => 'image/jpeg'
            ]);

            return response()->json([
                'message' => 'Image updated successfully',
                'path' => $path
            ]);

        } catch (\Exception $e) {
            Log::error("Image replacement failed: " . $e->getMessage(), [
                'trace' => $e->getTrace(),
                'request' => $request->all()
            ]);
            return response()->json([
                'error' => 'IMAGE_PROCESSING_ERROR',
                'message' => $e->getMessage()
            ], 400);
        } finally {
            if (isset($tempFile) && file_exists($tempFile)) {
                unlink($tempFile);
            }
        }
    }

    public function getUserPhotos(User $user)
    {
        try {
            $photos = $this->pictureService->getByUserId($user->id);
            Log::info("Photos data for User ID: {$user->id}", ['count' => count($photos)]);
            return response()->json($photos);
        } catch (\Exception $e) {
            Log::error("Error fetching user photos: " . $e->getMessage());
            return response()->json([
                'error' => 'PHOTO_FETCH_ERROR',
                'message' => 'Failed to retrieve user photos'
            ], 500);
        }
    }

    public function getImage(Picture $picture)
    {
        try {
            if (!$picture->path || !Storage::disk('public')->exists($picture->path)) {
                throw new NotFoundHttpException('Image not found');
            }

            return response(
                Storage::disk('public')->get($picture->path),
                200,
                [
                    'Content-Type' => $picture->mime_type ?? 'image/jpeg',
                    'Cache-Control' => 'public, max-age=31536000'
                ]
            );
        } catch (\Exception $e) {
            Log::error("Image retrieval failed: " . $e->getMessage());
            return response()->json([
                'error' => 'IMAGE_NOT_FOUND',
                'message' => 'Requested image could not be found'
            ], 404);
        }
    }

    public function getThumbnail(Picture $picture)
    {
        try {
            $path = $picture->thumbnail_path ?? $picture->path;

            if (!$path || !Storage::disk('public')->exists($path)) {
                throw new NotFoundHttpException('Thumbnail not found');
            }

            return response(
                Storage::disk('public')->get($path),
                200,
                [
                    'Content-Type' => $picture->mime_type ?? 'image/jpeg',
                    'Cache-Control' => 'public, max-age=31536000'
                ]
            );
        } catch (\Exception $e) {
            Log::error("Thumbnail retrieval failed: " . $e->getMessage());
            return response()->json([
                'error' => 'THUMBNAIL_NOT_FOUND',
                'message' => 'Requested thumbnail could not be found'
            ], 404);
        }
    }

    private function createThumbnail($file, $folder, $filename)
    {
        try {
            $image = Image::make($file);

            $image->resize(300, null, function ($constraint) {
                $constraint->aspectRatio();
                $constraint->upsize();
            });

            $thumbnailFilename = 'thumb_' . $filename;
            $thumbnailPath = $folder . '/' . $thumbnailFilename;

            Storage::disk('public')->put($thumbnailPath, (string) $image->encode('jpg', 80));

            return $thumbnailPath;
        } catch (\Exception $e) {
            Log::error('Thumbnail creation failed: ' . $e->getMessage());
            return null;
        }
    }

    private function extractImageData($base64String)
    {
        try {
            $base64Data = preg_replace('/^data:image\/\w+;base64,/', '', $base64String);
            $base64Data = str_replace([' ', '-', '_'], ['', '+', '/'], $base64Data);

            if (strlen($base64Data) % 4 !== 0 || !preg_match('/^[A-Za-z0-9+\/=]*$/', $base64Data)) {
                throw new \Exception("Invalid base64 encoding");
            }

            $binaryData = base64_decode($base64Data, true);
            if ($binaryData === false) {
                throw new \Exception("Base64 decoding failed");
            }

            if (strlen($binaryData) < 100 || substr($binaryData, 0, 2) !== "\xFF\xD8") {
                throw new \Exception("Invalid JPEG file structure");
            }

            return $binaryData;
        } catch (\Exception $e) {
            Log::error("Image extraction failed: " . $e->getMessage());
            throw $e;
        }
    }

    private function storeProcessedImage($tempPath, $picture)
    {
        try {
            if (!file_exists($tempPath) || filesize($tempPath) < 1024) {
                throw new \Exception("Invalid source file");
            }

            $image = Image::make($tempPath);

            if ($image->width() < 10 || $image->height() < 10) {
                throw new \Exception("Invalid image dimensions");
            }

            $path = "images/{$picture->user_id}/" . Str::uuid() . '.jpg';
            $image->save(storage_path("app/public/$path"), 92);

            if (!Storage::disk('public')->exists($path)) {
                throw new \Exception("Failed to persist image");
            }

            return $path;
        } catch (\Exception $e) {
            Log::error("Image processing failed: " . $e->getMessage());
            throw $e;
        }
    }

    private function isValidJpeg($file)
    {
        try {
            if (!file_exists($file) || !is_readable($file)) {
                throw new \Exception("File inaccessible");
            }

            $handle = fopen($file, 'rb');
            if (!$handle) {
                throw new \Exception("Could not open file");
            }

            $header = fread($handle, 4);
            fclose($handle);

            $validHeaders = [
                bin2hex("\xFF\xD8\xFF\xE0"), // JFIF
                bin2hex("\xFF\xD8\xFF\xE1"), // Exif
                bin2hex("\xFF\xD8\xFF\xDB"), // Baseline
            ];

            if (!in_array(bin2hex($header), $validHeaders)) {
                throw new \Exception("Invalid JPEG header");
            }

            $imageInfo = @getimagesize($file);
            if ($imageInfo === false || $imageInfo[2] !== IMAGETYPE_JPEG) {
                throw new \Exception("Invalid JPEG content");
            }

            return true;
        } catch (\Exception $e) {
            Log::error("JPEG validation failed: " . $e->getMessage());
            return false;
        }
    }

    private function saveImageData($imageData, $path)
    {
        $tempFile = tempnam(sys_get_temp_dir(), 'jpeg');
        try {
            if (file_put_contents($tempFile, $imageData) === false) {
                throw new \Exception("Failed to write temp file");
            }

            if (!$this->isValidJpeg($tempFile)) {
                throw new \Exception("Invalid JPEG format");
            }

            Storage::disk('public')->put($path, file_get_contents($tempFile));

            if (!Storage::disk('public')->exists($path)) {
                throw new \Exception("File storage failed");
            }

            return true;
        } catch (\Exception $e) {
            Log::error("Image save failed: " . $e->getMessage());
            return false;
        } finally {
            if (file_exists($tempFile)) {
                unlink($tempFile);
            }
        }
    }
}
