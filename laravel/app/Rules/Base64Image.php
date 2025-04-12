<?php

namespace App\Rules;

use Illuminate\Contracts\Validation\Rule;

class Base64Image implements Rule
{
    /**
     * Determine if the validation rule passes.
     *
     * @param  string  $attribute
     * @param  mixed  $value
     * @return bool
     */
    public function passes($attribute, $value)
    {
        if (!is_string($value) || !preg_match('/^data:image\/(\w+);base64,/', $value, $matches)) {
            return false;
        }

        // Check if the image type is valid
        $imageType = $matches[1];
        if (!in_array($imageType, ['jpeg', 'jpg', 'png', 'gif'])) {
            return false;
        }

        // Decode the base64 data
        $data = substr($value, strpos($value, ',') + 1);
        $decoded = base64_decode($data, true);

        if ($decoded === false) {
            return false;
        }

        return true;
    }

    /**
     * Get the validation error message.
     *
     * @return string
     */
    public function message()
    {
        return 'The :attribute must be a valid base64 encoded image.';
    }
}
