<?php

namespace App\Services;

use App\Models\Picture;
use App\Repositories\PictureRepository;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;

class PictureService
{
    protected $pictureRepository;

    public function __construct(PictureRepository $pictureRepository)
    {
        $this->pictureRepository = $pictureRepository;
    }

    public function getAll(): Collection
    {
        return $this->pictureRepository->getAll();
    }

    public function getById(int $id): ?Picture
    {
        return $this->pictureRepository->getById($id);
    }

    public function getByUserId(int $userId): Collection
    {
        return $this->pictureRepository->getByUserId($userId);
    }

    public function create(array $data)
    {
        // Make sure user_id is included in the data being saved
        if (!isset($data['user_id'])) {
            throw new \Exception('User ID is required');
        }

        return Picture::create([
            'user_id' => $data['user_id'],
            'filename' => $data['filename'] ?? null,
            'path' => $data['path'],
            'url' => $data['url'],
        ]);
    }

    public function update(int $id, array $data): bool
    {
        return $this->pictureRepository->update($id, $data);
    }

    public function delete(int $id): bool
    {
        $picture = $this->getById($id);

        if ($picture) {
            // Delete the file
            Storage::disk('public')->delete($picture->path);

            // Delete the record
            return $this->pictureRepository->delete($id);
        }

        return false;
    }

    public function replaceImage(Picture $picture, string $base64Image): Picture
    {
        // Decode base64 image
        $imageData = base64_decode(preg_replace('#^data:image/\w+;base64,#i', '', $base64Image));

        // Store the new image
        Storage::disk('public')->put($picture->path, $imageData);

        return $picture->fresh();
    }
}
