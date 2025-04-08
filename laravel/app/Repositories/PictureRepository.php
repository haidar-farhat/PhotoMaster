<?php

namespace App\Repositories;

use App\Models\Picture;
use App\Repositories\BaseRepository;

class PictureRepository implements BaseRepository
{
    protected $model;

    public function __construct(Picture $model)
    {
        $this->model = $model;
    }

    public function all()
    {
        return $this->model->with('user')->get();
    }

    public function find($id)
    {
        return $this->model->findOrFail($id);
    }

    public function create(array $data)
    {
        return $this->model->create($data);
    }

    public function update($id, array $data)
    {
        $picture = $this->find($id);
        $picture->update($data);
        return $picture;
    }

    public function delete($id)
    {
        $picture = $this->find($id);
        return $picture->delete();
    }

    public function getByUserId($userId)
    {
        return $this->model->where('user_id', $userId)->get();
    }
}
