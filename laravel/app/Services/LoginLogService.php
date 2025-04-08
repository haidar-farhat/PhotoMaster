<?php

namespace App\Services;

use App\Repositories\LoginLogRepository;
use App\Services\BaseService;

class LoginLogService implements BaseService
{
    protected $logRepository;

    public function __construct(LoginLogRepository $logRepository)
    {
        $this->logRepository = $logRepository;
    }

    public function getAll()
    {
        return $this->logRepository->all();
    }

    public function createLoginLog($userId, $ip) {
        return $this->logRepository->create([
            'user_id' => $userId,
            'ip_address' => $ip,
            'location' => $this->getLocationFromIP($ip)
        ]);
    }

    private function getLocationFromIP($ip) {
        // Implement IP geolocation lookup
        return 'Unknown';
    }

    // Add these methods to implement BaseService
    public function getById($id)
    {
        return $this->logRepository->find($id);
    }

    public function create(array $data)
    {
        return $this->logRepository->create($data);
    }

    public function update($id, array $data)
    {
        return $this->logRepository->update($id, $data);
    }

    public function delete($id)
    {
        return $this->logRepository->delete($id);
    }
}
