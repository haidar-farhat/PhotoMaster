<?php

namespace App\Repositories;

use App\Models\Picture;
use Illuminate\Support\Collection;

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
        return $this->model->where('id', $id)->update($data);
    }

    public function delete(int $id): bool
    {
        return $this->model->destroy($id);
    }
}
