<?php

namespace App\Rules;

use Illuminate\Contracts\Validation\Rule;
use Illuminate\Support\Facades\Log;

class Base64Image implements Rule
{
    private $errorType = 'generic';
    private $details = '';

    public function passes($attribute, $value)
    {
        // Check if value is a string first
        if (!is_string($value)) {
            $this->errorType = 'string';
            $this->details = gettype($value);
            return false;
        }

        // Check if empty
        if (empty($value)) {
            $this->errorType = 'empty';
            return false;
        }

        // Check the basic format (starts with data:image/jpeg)
        if (!preg_match('/^data:image\/jpeg;base64,/i', $value)) {
            $this->errorType = 'format';
            $this->details = substr($value, 0, 30) . '...';
            return false;
        }

        // Extract the base64 part
        $base64String = substr($value, strpos($value, ',') + 1);

        // Check if base64 part is empty
        if (empty($base64String)) {
            $this->errorType = 'empty_data';
            return false;
        }

        // Log the length of the base64 string
        Log::info("Base64 validation: string length = " . strlen($base64String));

        // Try to decode it to verify it's valid base64
        $decoded = base64_decode($base64String, true);
        if ($decoded === false) {
            $this->errorType = 'encoding';
            return false;
        }

        // Check if the decoded data is a valid JPEG
        // At least check for the JPEG header
        if (strlen($decoded) < 3 || bin2hex(substr($decoded, 0, 3)) !== 'ffd8ff') {
            $this->errorType = 'not_jpeg';
            $this->details = bin2hex(substr($decoded, 0, 3));
            return false;
        }

        return true;
    }

    public function message()
    {
        $messages = [
            'string' => 'The image data must be a string (received: ' . $this->details . ')',
            'empty' => 'The image data cannot be empty',
            'format' => 'Invalid image format. Must start with "data:image/jpeg;base64,"',
            'empty_data' => 'The base64 part of the image data is empty',
            'encoding' => 'Invalid base64 encoding in the image data',
            'not_jpeg' => 'The decoded data is not a valid JPEG image (header: ' . $this->details . ')',
            'generic' => 'Invalid base64 image data'
        ];

        return $messages[$this->errorType] ?? $messages['generic'];
    }
}
