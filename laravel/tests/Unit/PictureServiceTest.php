<?php

namespace Tests\Unit;

use App\Models\Picture;
use App\Models\User;
use App\Repositories\PictureRepository;
use App\Services\PictureService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PictureServiceTest extends TestCase
{
    use RefreshDatabase;

    protected $pictureService;
    protected $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->pictureService = app(PictureService::class);
        $this->user = User::factory()->create();
    }

    public function test_get_all_pictures()
    {
        // Create some pictures
        Picture::factory()->count(3)->create();

        $pictures = $this->pictureService->getAll();

        $this->assertCount(3, $pictures);
    }

    public function test_get_pictures_by_user_id()
    {
        // Create pictures for our test user
        Picture::factory()->count(2)->create([
            'user_id' => $this->user->id
        ]);

        // Create pictures for another user
        Picture::factory()->count(3)->create();

        $pictures = $this->pictureService->getByUserId($this->user->id);

        $this->assertCount(2, $pictures);
        $this->assertEquals($this->user->id, $pictures->first()->user_id);
    }

    public function test_create_picture()
    {
        $data = [
            'user_id' => $this->user->id,
            'filename' => 'test.png',
            'path' => 'images/1/test.png',
            'url' => 'http://localhost/storage/images/1/test.png'
        ];

        $picture = $this->pictureService->create($data);

        $this->assertInstanceOf(Picture::class, $picture);
        $this->assertEquals($data['filename'], $picture->filename);
        $this->assertEquals($data['user_id'], $picture->user_id);
    }

    public function test_delete_picture()
    {
        Storage::fake('public');

        // Create a picture
        $picture = Picture::factory()->create([
            'user_id' => $this->user->id,
            'path' => 'images/1/test.png'
        ]);

        // Create the file
        Storage::disk('public')->put($picture->path, 'test content');

        // Delete the picture
        $result = $this->pictureService->delete($picture->id);

        $this->assertTrue($result);
        $this->assertDatabaseMissing('pictures', ['id' => $picture->id]);
$this->assertFalse(Storage::disk('public')->exists($picture->path));
    }
}
