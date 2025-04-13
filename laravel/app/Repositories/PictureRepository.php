<?php

namespace App\Repositories;

use App\Models\Picture;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;

class PictureRepository
{
    protected $model;

    public function __construct(Picture $picture)
    {
        $this->model = $picture;
    }

    public function getAll(): Collection
    {
        return $this->model->with('user')->get();
    }

    public function getById(int $id): ?Picture
    {
        return $this->model->find($id);
    }

    public function getByUserId(int $userId): Collection
    {
        return $this->model->where('user_id', $userId)->get();
    }

    public function create(array $data): Picture
    {
        return $this->model->create($data);
    }

    public function update(int $id, array $data): bool
    {
        try {
            $result = $this->model->where('id', $id)->update($data);

            // Log the update operation
            \Illuminate\Support\Facades\Log::info("Picture update operation for ID: {$id}", [
                'success' => (bool)$result,
                'fields_updated' => array_keys($data)
            ]);

            return (bool)$result;
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Picture update failed for ID: {$id}", [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return false;
        }
    }

    public function delete(int $id): bool
    {
        return $this->model->destroy($id);
    }

    public function replace($id, $file)
    {
        $picture = Picture::findOrFail($id);

        // Get the old file path to delete it later
        $oldPath = $picture->path;

        // Generate new file path
        $filename = $file->getClientOriginalName();
        $path = 'images/' . time() . '_' . $filename;

        // Store the new file
        Storage::disk('public')->put($path, file_get_contents($file));

        // Update the picture record
        $picture->update([
            'filename' => $filename,
            'path' => $path,
            'updated_at' => now()
        ]);

        // Delete the old file
        if ($oldPath && Storage::disk('public')->exists($oldPath)) {
            Storage::disk('public')->delete($oldPath);
        }

        return $picture;
    }
}
