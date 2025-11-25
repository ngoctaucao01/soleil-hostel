<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Cache\RateLimiter;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ThrottleApiRequests
{
    /**
     * The rate limiter instance.
     */
    protected RateLimiter $limiter;

    /**
     * Create a new middleware instance.
     */
    public function __construct(RateLimiter $limiter)
    {
        $this->limiter = $limiter;
    }

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, ...$limits): Response
    {
        foreach ($limits as $limit) {
            if ($this->limiter->tooManyAttempts($limit, $this->resolveMaxAttempts($limit), $request)) {
                throw $this->buildException($request, $limit);
            }

            $this->limiter->hit($limit, $this->resolveLimitingPeriod($limit), $request);
        }

        return $next($request)
            ->header('X-RateLimit-Limit', $this->resolveMaxAttempts($limits[0]))
            ->header('X-RateLimit-Remaining', $this->limiter->remaining($limits[0], $this->resolveMaxAttempts($limits[0]), $request));
    }

    /**
     * Resolve the number of attempts allowed per limit.
     */
    protected function resolveMaxAttempts(string $limit): int
    {
        // Format: "limit-per-period" (e.g., "60-1" = 60 requests per minute)
        if (str_contains($limit, '-')) {
            return (int) explode('-', $limit)[0];
        }
        return 60; // Default
    }

    /**
     * Resolve the limiting period in seconds.
     */
    protected function resolveLimitingPeriod(string $limit): int
    {
        // Format: "limit-period" where period is in minutes
        // "60-1" = 60 requests per 1 minute = 60 seconds
        // "30-60" = 30 requests per 60 minutes = 3600 seconds
        if (str_contains($limit, '-')) {
            $parts = explode('-', $limit);
            return (int) $parts[1] * 60;
        }
        return 60; // Default 1 minute
    }

    /**
     * Create a rate limit exceeded response.
     */
    protected function buildException(Request $request, string $limit)
    {
        $maxAttempts = $this->resolveMaxAttempts($limit);
        $retryAfter = $this->limiter->availableIn($limit, $request);

        return response()->json([
            'success' => false,
            'message' => 'Too many requests. Please try again in ' . $retryAfter . ' seconds.',
        ], 429)
        ->header('Retry-After', $retryAfter)
        ->header('X-RateLimit-Limit', $maxAttempts)
        ->header('X-RateLimit-Remaining', 0);
    }
}
