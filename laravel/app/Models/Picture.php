<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Picture extends Model
{
    protected $fillable = [
        'user_id',
        'filename',
        'local_path',
        'url',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
