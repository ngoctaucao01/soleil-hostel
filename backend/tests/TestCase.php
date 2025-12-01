<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

abstract class TestCase extends BaseTestCase
{
    use RefreshDatabase;

    protected $withoutMiddleware = [
        \App\Http\Middleware\VerifyCsrfToken::class,
    ];

    // Disable confirmation prompts during testing
    protected function setUp(): void
    {
        parent::setUp();
        // Run migrations in app test database, not prompted
    }

    protected function disableExceptionHandling()
    {
        $this->withoutExceptionHandling();
    }
}
