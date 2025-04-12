<?php

namespace Tests\Feature;

use App\Models\LoginLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class LoginLogTest extends TestCase
{
    use RefreshDatabase;

    protected $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    public function test_login_creates_log_entry()
    {
        // Mock the HTTP client for geolocation
        Http::fake([
            'ipinfo.io/*' => Http::response([
                'ip' => '8.8.8.8',
                'city' => 'Mountain View',
                'region' => 'California',
                'country' => 'US'
            ], 200)
        ]);

        // Perform login
        $response = $this->postJson('/api/login', [
            'email' => $this->user->email,
            'password' => 'password' // Default password from factory
        ]);

        $response->assertStatus(200);

        // Check that a login log was created
        $this->assertDatabaseHas('login_logs', [
            'user_id' => $this->user->id,
        ]);

        // Get the login log
        $log = LoginLog::where('user_id', $this->user->id)->first();

        // Verify location was set by observer
        $this->assertNotNull($log->location);
        $this->assertNotEquals('Unknown', $log->location);
    }

    public function test_get_user_login_history()
    {
        // Create some login logs
        LoginLog::factory()->count(3)->create([
            'user_id' => $this->user->id
        ]);

        // Get login history
        $response = $this->actingAs($this->user)
            ->getJson("/api/users/{$this->user->id}/login-history");

        $response->assertStatus(200)
            ->assertJsonCount(3)
            ->assertJsonStructure([
                '*' => ['id', 'user_id', 'ip_address', 'location', 'login_at']
            ]);
    }
}
