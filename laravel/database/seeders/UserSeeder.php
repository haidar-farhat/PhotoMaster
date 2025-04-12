<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        \App\Models\User::factory(10)->create()->each(function ($user) {
            // Create pictures for each user
            $user->pictures()->saveMany(
                \App\Models\Picture::factory(5)->make()
            );

            // Create login logs for each user
            $user->loginLogs()->saveMany(
                \App\Models\LoginLog::factory(5)->make()
            );
        });
    }
}
