<?php

namespace App\Services;

use App\Repositories\PictureRepository;
use App\Services\BaseService;

class PictureService implements BaseService
{
    protected $pictureRepository;

    public function __construct(PictureRepository $pictureRepository)
    {
        $this->pictureRepository = $pictureRepository;
    }

    public function getAll()
    {
        return $this->pictureRepository->all();
    }

    public function getById($id)
    {
        return $this->pictureRepository->find($id);
    }

    public function getByUserId($userId)
    {
        return $this->pictureRepository->getByUserId($userId);
    }

    public function create(array $data)
    {
        return $this->pictureRepository->create($data);
    }

    public function update($id, array $data)
    {
        return $this->pictureRepository->update($id, $data);
    }

    public function delete($id)
    {
        return $this->pictureRepository->delete($id);
    }
}
