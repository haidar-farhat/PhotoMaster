<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    protected $hidden = [
        'password',
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
