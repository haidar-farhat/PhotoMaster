<?php

namespace App\Repositories;

use App\Models\LoginLog;
use App\Repositories\BaseRepository;

class LoginLogRepository implements BaseRepository
{
    protected $model;

    public function __construct(LoginLog $model)
    {
        $this->model = $model;
    }

    public function all()
    {
        return $this->model->with('user:id,name')->get();
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
        $log = $this->find($id);
        $log->update($data);
        return $log;
    }

    public function delete($id)
    {
        $log = $this->find($id);
        return $log->delete();
    }
}
