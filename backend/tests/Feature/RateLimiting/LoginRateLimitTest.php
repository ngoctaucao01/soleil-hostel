<?php

namespace Tests\Feature\RateLimiting;

use Tests\TestCase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

class LoginRateLimitTest extends TestCase
{
    use RefreshDatabase;

    #[\PHPUnit\Framework\Attributes\Test]
    public function test_login_rate_limit_5_per_minute_per_ip(): void
    {
        // Attempt 5 logins within 1 minute (should succeed)
        for ($i = 0; $i < 5; $i++) {
            $response = $this->post('/api/auth/login-httponly', [
                'email' => 'test@example.com',
                'password' => 'password',
            ]);

            // First 5 should return 401 (wrong credentials) not 429 (rate limited)
            $this->assertNotEquals(429, $response->status());
        }

        // 6th attempt should be rate limited (429 Too Many Requests)
        $response = $this->post('/api/auth/login-httponly', [
            'email' => 'test@example.com',
            'password' => 'password',
        ]);

        $this->assertEquals(429, $response->status());
        $this->assertJson($response->getContent());
        $data = $response->json();
        $this->assertStringContainsString('Too many login attempts', $data['message']);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function test_login_rate_limit_20_per_hour_per_email(): void
    {
        // Create test user
        $user = User::factory()->create([
            'email' => 'daily@example.com',
            'password' => bcrypt('password'),
        ]);

        // Attempt 20 logins for same email (should succeed)
        for ($i = 0; $i < 20; $i++) {
            $this->post('/api/auth/login-httponly', [
                'email' => 'daily@example.com',
                'password' => 'password',
            ]);
        }

        // 21st attempt should be rate limited
        $response = $this->post('/api/auth/login-httponly', [
            'email' => 'daily@example.com',
            'password' => 'password',
        ]);

        $this->assertEquals(429, $response->status());
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function test_different_emails_have_separate_limits(): void
    {
        // Email 1: Make 5 requests (hit per-IP limit)
        for ($i = 0; $i < 5; $i++) {
            $this->post('/api/auth/login-httponly', [
                'email' => 'email1@example.com',
                'password' => 'password',
            ]);
        }

        // Email 2: Should still work (different email bucket)
        $response = $this->post('/api/auth/login-httponly', [
            'email' => 'email2@example.com',
            'password' => 'password',
        ]);

        // Should NOT be rate limited (different email = separate 20/hour limit)
        $this->assertNotEquals(429, $response->status());
    }
}
