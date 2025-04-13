<?php

namespace App\Rules;

use Illuminate\Contracts\Validation\Rule;

class Base64Image implements Rule
{
    private $errorType = 'generic';

    public function passes($attribute, $value)
    {
        if (!preg_match('/^data:image\/jpeg;base64,/i', $value)) {
            $this->errorType = 'format';
            return false;
        }

        return preg_match('/^data:image\/jpeg;base64,[a-zA-Z0-9\/\r\n+]*={0,2}$/i', $value);
    }

    public function message()
    {
        $messages = [
            'format' => 'Invalid JPEG base64 format. Must start with "data:image/jpeg;base64,"',
            'encoding' => 'Invalid base64 encoding',
            'generic' => 'Invalid base64 image data'
        ];

        return $messages[$this->errorType] ?? $messages['generic'];
    }
}
