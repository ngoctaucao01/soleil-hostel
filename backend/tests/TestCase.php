<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected $withoutMiddleware = [
        \App\Http\Middleware\VerifyCsrfToken::class,
    ];

    protected function disableExceptionHandling()
    {
        $this->withoutExceptionHandling();
    }
}
