<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, \Illuminate\Database\Eloquent\Factories\HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    public function pictures()
    {
        return $this->hasMany(Picture::class);
    }

    public function loginLogs()
    {
        return $this->hasMany(LoginLog::class);
    }
}
