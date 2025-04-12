<?php

namespace Database\Factories;

use App\Models\LoginLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class LoginLogFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = LoginLog::class;

    /**
     * Define the model's default state.
     *
     * @return array
     */
    public function definition()
    {
        return [
            'user_id' => User::factory(),
            'ip_address' => $this->faker->ipv4,
            'location' => $this->faker->city . ', ' . $this->faker->state . ', ' . $this->faker->countryCode,
            'login_at' => $this->faker->dateTimeThisMonth,
        ];
    }
}
