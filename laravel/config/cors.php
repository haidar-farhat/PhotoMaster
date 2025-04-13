<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'login', 'logout', 'register'],
    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    'allowed_origins' => ['http://localhost:3000', 'http://localhost:8080', 'http://localhost'],
    'allowed_origins_patterns' => ['/^http:\/\/localhost(:[0-9]+)?$/'],
    'allowed_headers' => ['Content-Type', 'X-Requested-With', 'Authorization', 'X-CSRF-TOKEN', 'Accept'],
    'exposed_headers' => ['Authorization'],
    'max_age' => 86400,
    'supports_credentials' => true,
];
