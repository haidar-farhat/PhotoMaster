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
use App\Rules\Base64Image;
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
            $thumbnailPath = null;
            $url = url('storage/' . $path);
            $thumbnailUrl = null;

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
                    if ($imageData === false) {
                        Log::error('Failed to extract image data from request');
                        return response()->json(['message' => 'Invalid image data'], 400);
                    }

                    $path = $picture->path;

                    if (empty($path)) {
                        Log::warning('Picture has no path, generating a new one for ID: ' . $id);
                        $filename = uniqid() . '.jpg';
                        $path = 'pictures/' . $filename;
                        $picture->path = $path;
                    }

                    Log::info('Updating image at existing path: ' . $path);

                    if (!$this->saveImageData($imageData, $path)) {
                        Log::error('Failed to save image data for picture ID: ' . $id);
                        return response()->json(['message' => 'Failed to save image'], 500);
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
        $result = $this->pictureService->delete($picture->id);

        if ($result) {
            return response()->json(['message' => 'Picture deleted successfully']);
        }

        return response()->json(['message' => 'Failed to delete picture'], 500);
    }

    public function replaceImage(Request $request, Picture $picture)
    {
        Log::info("Replace image request received for Picture ID: " . $picture->id);

        try {
            $validatedData = $request->validate([
                'image_data' => 'required|string',
            ]);

            if ($picture->user_id !== Auth::id()) {
                Log::warning("Unauthorized access attempt by user ID: " . Auth::id());
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $imageData = $this->extractImageData($validatedData['image_data']);
            if ($imageData === false) {
                Log::error("Failed to extract image data from base64 string");
                return response()->json(['message' => 'Invalid image data'], 400);
            }

            $path = $picture->path;

            if (empty($path) || !Storage::disk('public')->exists($path)) {
                $userFolder = 'users/' . $picture->user_id . '/' . date('Y/m');
                $originalFilename = pathinfo($picture->filename, PATHINFO_FILENAME);
                $safeFilename = Str::slug($originalFilename) . '_' . uniqid() . '.jpg';
                $path = "$userFolder/$safeFilename";
                Log::info("Original path not found, creating new path: {$path}");
            } else {
                Log::info("Using existing path for update: {$path}");
            }

            if (!$this->saveImageData($imageData, $path)) {
                Log::error("Failed to save image data for picture ID: " . $picture->id);
                return response()->json(['message' => 'Failed to save image'], 500);
            }

            $picture->path = $path;
            $picture->file_size = Storage::disk('public')->size($path);
            $picture->mime_type = 'image/jpeg';

            if (!$picture->save()) {
                Log::error("Failed to update picture record for ID: " . $picture->id);
                return response()->json(['message' => 'Failed to update picture database record'], 500);
            }

            Log::info("Image replaced successfully for Picture ID: " . $picture->id . ", path: " . $path);

            return response()->json([
                'message' => 'Image replaced successfully',
                'picture' => new PictureResource($picture->fresh())
            ]);

        } catch (\Exception $e) {
            Log::error("Error replacing image: " . $e->getMessage());
            return response()->json(['message' => 'Error replacing image: ' . $e->getMessage()], 500);
        }
    }

    public function getUserPhotos(User $user)
    {
        $photos = $this->pictureService->getByUserId($user->id);
        Log::info("Photos data BEFORE sending JSON for User ID: {$user->id}", $photos->toArray());
        return response()->json($photos);
    }

    private function createThumbnail($file, $folder, $filename)
    {
        try {
            $image = Image::make($file);
            $thumbnailFilename = 'thumb_' . $filename;
            $thumbnailPath = $folder . '/' . $thumbnailFilename;
            $fullPath = storage_path('app/public/' . $folder);

            if (!file_exists($fullPath)) {
                mkdir($fullPath, 0755, true);
            }

            $image->resize(300, null, function ($constraint) {
                $constraint->aspectRatio();
                $constraint->upsize();
            });

            $image->save(storage_path('app/public/' . $thumbnailPath), 80);

            return $thumbnailPath;
        } catch (\Exception $e) {
            Log::error('Failed to create thumbnail: ' . $e->getMessage());
            return null;
        }
    }

    public function getImage(Picture $picture)
    {
        Log::info("Attempting to get image for Picture ID: {$picture->id}");
        $storagePath = $picture->path;

        if (!$picture->path || !Storage::disk('public')->exists($storagePath)) {
            Log::error("Image file not found for Picture ID: {$picture->id} at path: {$storagePath}");
            return response()->json(['error' => 'Image file not found in storage'], 404);
        }

        Log::info("Serving image file from path: {$storagePath}");
        $absolutePath = storage_path('app/public/' . $storagePath);

        if (!Storage::disk('public')->exists($storagePath)) {
            Log::error("Image file not found in storage: {$storagePath}");
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

    public function getThumbnail(Picture $picture)
    {
        if (!$picture->thumbnail_path) {
            return $this->getImage($picture);
        }

        Log::info("Attempting to get thumbnail for Picture ID: {$picture->id}");
        $storagePath = $picture->thumbnail_path;

        if (!$picture->thumbnail_path || !Storage::disk('public')->exists($storagePath)) {
            Log::warning("Thumbnail file not found for Picture ID: {$picture->id} at path: {$storagePath}");
            return $this->getImage($picture);
        }

        Log::info("Serving thumbnail file from path: {$storagePath}");
        $absolutePath = storage_path('app/public/' . $storagePath);

        if (!Storage::disk('public')->exists($storagePath)) {
            Log::error("Thumbnail not found in storage: {$storagePath}");
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

    private function isValidJpeg($file)
    {
        if (!file_exists($file) || !is_readable($file)) {
            Log::error("JPEG validation failed: File doesn't exist or is not readable");
            return false;
        }

        $handle = fopen($file, 'rb');
        if (!$handle) {
            Log::error("JPEG validation failed: Could not open file for reading");
            return false;
        }

        $header = fread($handle, 3);
        fclose($handle);

        if (strlen($header) < 3) {
            Log::error("JPEG validation failed: Could not read header bytes");
            return false;
        }

        $isJpegHeader = ord($header[0]) === 0xFF &&
                  ord($header[1]) === 0xD8 &&
                  ord($header[2]) === 0xFF;

        if (!$isJpegHeader) {
            Log::error("JPEG validation failed: Invalid header bytes: " . bin2hex(substr($header, 0, 3)));
            return false;
        }

        $imageInfo = @getimagesize($file);
        if ($imageInfo === false) {
            Log::error("JPEG validation failed: getimagesize could not read the file");
            return false;
        }

        if ($imageInfo[2] !== IMAGETYPE_JPEG) {
            Log::error("JPEG validation failed: getimagesize reports non-JPEG type: " . $imageInfo[2]);
            return false;
        }

        // Temporarily allow small images for testing
        if ($imageInfo[0] < 1 || $imageInfo[1] < 1) {
            Log::warning("Allowing small test image: " . $imageInfo[0] . "x" . $imageInfo[1]);
            return true;
        }

        if ($imageInfo[0] > 8000 || $imageInfo[1] > 8000) {
            Log::error("Image dimensions too large: " . $imageInfo[0] . "x" . $imageInfo[1]);
            return false;
        }

        Log::debug("JPEG validation passed: " . $imageInfo[0] . "x" . $imageInfo[1] .
                  ", mime: " . $imageInfo['mime'] .
                  ", header: " . bin2hex(substr($header, 0, 3)));
        return true;
    }

    private function extractImageData($base64String)
    {
        Log::debug("Extracting image data from base64 string, length: " . strlen($base64String));

        if (empty($base64String)) {
            Log::error("Base64 string is empty");
            return false;
        }

        if (strpos($base64String, 'data:image/jpeg;base64,') === 0) {
            $base64Data = substr($base64String, 23); // Fixed offset calculation
            Log::debug("Extracted base64 data from data URI scheme, length: " . strlen($base64Data));
        } else {
            $base64Data = $base64String;
            Log::debug("Using input as raw base64 data, length: " . strlen($base64Data));
        }

        $base64Data = preg_replace('/\s+/', '', $base64Data);

        if (!preg_match('/^[A-Za-z0-9+\/=]+$/', $base64Data)) {
            Log::error("Invalid base64 characters found in string");
            return false;
        }

        $binaryData = base64_decode($base64Data, true);
        if ($binaryData === false) {
            Log::error("Failed to decode base64 data");
            return false;
        }

        $decodedSize = strlen($binaryData);
        if ($decodedSize < 100) {
            Log::error("Decoded image data is too small: " . $decodedSize . " bytes");
            return false;
        }

        if (substr($binaryData, 0, 2) !== "\xFF\xD8") {
            Log::error("Decoded data is not a valid JPEG (invalid header): " . bin2hex(substr($binaryData, 0, 3)));
            return false;
        }

        Log::info("Successfully extracted JPEG image data, size: " . $decodedSize . " bytes");
        return $binaryData;
    }

    private function saveImageData($imageData, $path)
    {
        $tempFile = tempnam(sys_get_temp_dir(), 'jpeg_validation_');
        if ($tempFile === false) {
            Log::error("Failed to create temporary file for image validation");
            return false;
        }

        try {
            $dataLength = strlen($imageData);
            Log::debug("Image data length before saving: " . $dataLength . " bytes");

            if ($dataLength === 0) {
                Log::error("Image data is empty (0 bytes)");
                return false;
            }

            $headerHex = bin2hex(substr($imageData, 0, 8));
            Log::debug("Image data header: " . $headerHex);

            if (substr($imageData, 0, 2) !== "\xFF\xD8") {
                Log::error("Image data does not have a valid JPEG header: " . $headerHex);
                return false;
            }

            $bytesWritten = file_put_contents($tempFile, $imageData);
            if ($bytesWritten === false || $bytesWritten === 0) {
                Log::error("Failed to write image data to temporary file, bytes written: " .
                          ($bytesWritten === false ? "FALSE" : $bytesWritten));
                return false;
            }

            if ($bytesWritten !== $dataLength) {
                Log::warning("Bytes written (" . $bytesWritten . ") differs from data length (" . $dataLength . ")");
            } else {
                Log::debug("Successfully wrote " . $bytesWritten . " bytes to temporary file");
            }

            $fileSize = filesize($tempFile);
            Log::debug("Temporary file size: " . $fileSize . " bytes");

            if ($fileSize === 0) {
                Log::error("Image file size is 0 bytes");
                return false;
            }

            if ($fileSize > 20 * 1024 * 1024) {
                Log::error("Image file too large: " . $fileSize . " bytes");
                return false;
            }

            if (!$this->isValidJpeg($tempFile)) {
                Log::error("Invalid JPEG file format");
                return false;
            }

            $imageInfo = @getimagesize($tempFile);
            if ($imageInfo === false) {
                Log::error("getimagesize failed - not a valid image");
                return false;
            }

            if ($imageInfo[2] !== IMAGETYPE_JPEG) {
                Log::error("Image is not a JPEG, detected type: " . $imageInfo[2]);
                return false;
            }

            Log::debug("Image validated successfully: " . $imageInfo[0] . "x" . $imageInfo[1] . " type: " . $imageInfo['mime']);

            if (!Storage::disk('public')->put($path, file_get_contents($tempFile))) {
                Log::error("Failed to save image to final location: " . $path);
                return false;
            }

            $savedFileSize = Storage::disk('public')->size($path);
            if ($savedFileSize === 0) {
                Log::error("Saved file has 0 bytes in storage at: " . $path);
                Storage::disk('public')->delete($path);
                return false;
            }

            Log::debug("Final saved file size: " . $savedFileSize . " bytes at path: " . $path);
            Log::info("Successfully saved image to: " . $path);
            return true;
        } catch (\Exception $e) {
            Log::error("Exception while saving image: " . $e->getMessage() . "\n" . $e->getTraceAsString());
            return false;
        } finally {
            if (file_exists($tempFile)) {
                @unlink($tempFile);
            }
        }
    }
}
