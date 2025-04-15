<?php

namespace Database\Factories;

use App\Models\Picture;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class PictureFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Picture::class;

    /**
     * Define the model's default state.
     *
     * @return array
     */
    public function definition()
    {
        $userId = User::factory()->create()->id;
        $filename = $this->faker->uuid . '.png';
        $path = "images/{$userId}/{$filename}";

        return [
            'user_id' => $userId,
            'filename' => $filename,
            'path' => $path,
            'url' => asset('storage/' . $path),
        ];
    }
}
