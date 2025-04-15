<?php

namespace App\Observers;

use App\Models\LoginLog;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class LoginLogObserver
{
    /**
     * Handle the LoginLog "creating" event.
     *
     * @param  \App\Models\LoginLog  $loginLog
     * @return void
     */
    public function creating(LoginLog $loginLog)
    {
        // If location is not set and we have an IP address
        if (empty($loginLog->location) && !empty($loginLog->ip_address)) {
            $loginLog->location = $this->getGeolocation($loginLog->ip_address);
        }
    }

    /**
     * Get geolocation data from IP address
     *
     * @param string $ip
     * @return string
     */
    private function getGeolocation(string $ip): string
    {
        try {
            // Skip for localhost/private IPs
            if (in_array($ip, ['127.0.0.1', '::1']) || filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) === false) {
                return 'Local';
            }

            $response = Http::get("https://ipinfo.io/{$ip}/json");

            if ($response->successful()) {
                $data = $response->json();
                return ($data['city'] ?? '') . ', ' . ($data['region'] ?? '') . ', ' . ($data['country'] ?? '');
            }
        } catch (\Exception $e) {
            Log::error('Geolocation failed', ['error' => $e->getMessage()]);
        }

        return 'Unknown';
    }
}
