<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Picture extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'user_id',
        'filename',
        'path',
        'url',
    ];

    /**
     * Get the user that owns the picture.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
