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

        // Pass the entire validated data array, relying on $fillable in the model
        $picture = Picture::create($data);
        \Illuminate\Support\Facades\Log::info('Picture object AFTER creation:', $picture ? $picture->toArray() : ['Result' => 'null']); // Log the created object
        return $picture;
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

    public function replaceImage($id, $file)
    {
        return $this->pictureRepository->replace($id, $file);
    }
}
