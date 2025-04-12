<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory;

    protected $fillable = [
        'name',
        'email',
        'password'
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    public function pictures()
    {
        return $this->hasMany(\App\Models\Picture::class);
    }

    // Add login logs relationship
    public function loginLogs()
    {
        return $this->hasMany(\App\Models\LoginLog::class);
    }
}
