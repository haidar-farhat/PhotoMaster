<?php

namespace App\Rules;

use Illuminate\Contracts\Validation\Rule;

class Base64Image implements Rule
{
    /**
     * Create a new rule instance.
     *
     * @return void
     */
    public function __construct()
    {
        //
    }

    /**
     * Determine if the validation rule passes.
     *
     * @param  string  $attribute
     * @param  mixed  $value
     * @return bool
     */
    public function passes($attribute, $value)
    {
        return preg_match('/^data:image\/(png|jpeg|jpg|gif);base64,/', $value);
    }

    public function message()
    {
        return 'The :attribute must be a valid base64 encoded image (PNG, JPEG, JPG, GIF)';
    }
}
