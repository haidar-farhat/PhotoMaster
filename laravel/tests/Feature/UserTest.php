<?php

namespace Tests\Feature;

class UserTest extends ApiTestCase
{
    public function test_get_users()
    {
        $response = $this->getJson('/api/users', $this->authHeaders());

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     '*' => ['id', 'name', 'email', 'created_at']
                 ]);
    }

    public function test_get_user()
    {
        $response = $this->getJson('/api/users/' . $this->user->id, $this->authHeaders());

        $response->assertStatus(200)
                 ->assertJson([
                     'id' => $this->user->id,
                     'name' => $this->user->name,
                     'email' => $this->user->email
                 ]);
    }

    public function test_update_user()
    {
        $response = $this->putJson('/api/users/' . $this->user->id, [
            'name' => 'Updated Name'
        ], $this->authHeaders());

        $response->assertStatus(200)
                 ->assertJson([
                     'name' => 'Updated Name'
                 ]);
    }
}
