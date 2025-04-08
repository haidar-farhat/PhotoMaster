<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LoginLog extends Model
{
    protected $fillable = [
        'user_id',
        'ip_address',
        'location'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
