<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     *
     * @return void
     */
    public function register()
    {
        $this->app->bind(
            \App\Repositories\BaseRepository::class,
            \App\Repositories\UserRepository::class
        );

        $this->app->bind(
            \App\Services\BaseService::class,
            \App\Services\UserService::class
        );

        // Add to register() method
        $this->app->bind(
            \App\Repositories\LoginLogRepository::class,
            function ($app) {
                return new \App\Repositories\LoginLogRepository(
                    new \App\Models\LoginLog()
                );
            }
        );

        // In register() method
        $this->app->bind(\App\Repositories\PictureRepository::class, function ($app) {
            return new \App\Repositories\PictureRepository(new \App\Models\Picture());
        });

        $this->app->bind(\App\Services\PictureService::class, function ($app) {
            return new \App\Services\PictureService(
                $app->make(\App\Repositories\PictureRepository::class)
            );
        });
    }

    /**
     * Bootstrap any application services.
     *
     * @return void
     */
    public function boot()
    {
        //
    }
}
