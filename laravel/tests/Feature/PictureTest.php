<?php

namespace Tests\Feature;

use App\Models\Picture;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PictureTest extends ApiTestCase
{
    use RefreshDatabase;

    public function test_get_pictures()
    {
        // Create some test pictures
        Picture::factory()->count(3)->create([
            'user_id' => $this->user->id
        ]);

        $response = $this->getJson('/api/pictures', $this->authHeaders());

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     '*' => ['id', 'user_id', 'filename', 'path', 'url', 'created_at']
                 ]);
    }

    public function test_upload_picture()
    {
        Storage::fake('public');

        // Add test user
        $user = \App\Models\User::factory()->create();

        $base64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

        $response = $this->postJson('/api/pictures', [
            'user_id' => $user->id,  // Use created user's ID
            'filename' => 'test-image.png',
            'base64_image' => $base64Image
        ], $this->authHeaders());

        $response->assertStatus(201)
            ->assertJsonStructure([
                'id', 'user_id', 'filename', 'path', 'url', 'created_at'
            ])
            ->assertJson(['user_id' => $user->id]);  // Add specific assertion

        // Verify file was stored in correct path
        // Fix storage path assertion
        // Change assertion method
        $this->assertFileExists(
            storage_path('app/public/images/'.$user->id.'/test-image.png')
        );
    }

    public function test_get_user_photos()
    {
        $response = $this->getJson('/api/users/' . $this->user->id . '/photos', $this->authHeaders());

        $response->assertStatus(200);
    }

    public function test_replace_image()
    {
        Storage::fake('public');

        // Create a picture first
        $user = \App\Models\User::factory()->create();
        $originalImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

        $response = $this->postJson('/api/pictures', [
            'user_id' => $user->id,
            'filename' => 'test-image.png',
            'base64_image' => $originalImage
        ], $this->authHeaders());

        $pictureId = $response->json('id');

        // Now replace the image
        $newImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAEklEQVR42mNkYPhfz8DAAAAFBQEA/7gzaQAAAABJRU5ErkJggg==';

        $replaceResponse = $this->postJson("/api/pictures/{$pictureId}/replace", [
            'base64_image' => $newImage
        ], $this->authHeaders());

        $replaceResponse->assertStatus(200)
            ->assertJsonStructure([
                'id', 'user_id', 'filename', 'path', 'url'
            ]);

        // Verify the file exists
        $path = 'images/' . $user->id . '/test-image.png';
        $this->assertFileExists(storage_path('app/public/' . $path));
    }

    public function test_delete_picture()
    {
        Storage::fake('public');

        // Create a picture first
        $user = \App\Models\User::factory()->create();
        $image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

        $response = $this->postJson('/api/pictures', [
            'user_id' => $user->id,
            'filename' => 'delete-test.png',
            'base64_image' => $image
        ], $this->authHeaders());

        $pictureId = $response->json('id');

        // Now delete the picture
        $deleteResponse = $this->deleteJson("/api/pictures/{$pictureId}", [], $this->authHeaders());

        $deleteResponse->assertStatus(200)
            ->assertJson([
                'message' => 'Picture deleted successfully'
            ]);

        // Verify the picture no longer exists in the database
        $this->assertDatabaseMissing('pictures', ['id' => $pictureId]);

        // Verify the file was deleted
        $path = 'images/' . $user->id . '/delete-test.png';
$this->assertFalse(Storage::disk('public')->exists($path));
    }
}
