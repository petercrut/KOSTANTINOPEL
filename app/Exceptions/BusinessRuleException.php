<?php

namespace App\Exceptions;

use RuntimeException;

class BusinessRuleException extends RuntimeException
{
    public function __construct(string $message, public readonly int $status = 409, public readonly string $errorCode = 'CONFLICT')
    {
        parent::__construct($message);
    }
}
