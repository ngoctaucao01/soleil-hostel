# 🔥 REDIS SETUP GUIDE - PRODUCTION READY

## Ubuntu 22.04/24.04 Installation

```bash
# ========== UPDATE SYSTEM ==========
sudo apt update && sudo apt upgrade -y

# ========== INSTALL REDIS SERVER ==========
sudo apt install -y redis-server redis-tools

# ========== ENABLE & START REDIS ==========
sudo systemctl enable redis-server
sudo systemctl start redis-server

# ========== CHECK REDIS STATUS ==========
sudo systemctl status redis-server
redis-cli ping # Should return: PONG

# ========== INSTALL PHP-REDIS EXTENSION ==========
# Đừng dùng Predis (slow như rùa)! Dùng phpredis (C-extension, 10x faster)

sudo apt install -y php-redis
# Hoặc build từ source nếu version mới hơn:
sudo pecl install redis
echo "extension=redis.so" | sudo tee -a /etc/php/8.3/cli/php.ini
echo "extension=redis.so" | sudo tee -a /etc/php/8.3/fpm/php.ini

# ========== VERIFY PHP-REDIS ==========
php -i | grep redis
php -r "var_dump(extension_loaded('redis'));" # true = cài ok

# ========== RESTART PHP-FPM ==========
sudo systemctl restart php8.3-fpm

# ========== REDIS CONNECTION TEST ==========
redis-cli -n 0 info server # Check Redis version & memory
redis-cli MONITOR # Live command monitor (for debugging)

# ========== REDIS MEMORY USAGE ==========
redis-cli INFO memory
# used_memory_human: 10MB (initial)
# maxmemory: 2GB (set in redis.conf)
```

## Laravel 11 Redis Connection Setup

```php
// config/database.php - Redis configuration
'redis' => [
    'client' => env('REDIS_CLIENT', 'phpredis'), // ← Predis is SLOW!
    'options' => [
        'cluster' => env('REDIS_CLUSTER', false),
        'prefix' => env('REDIS_PREFIX', Illuminate\Support\Str::slug(env('APP_NAME', 'laravel'), '_').'_database_'),
        'serializer' => 2, // igbinary (fastest), fallback to json
        'read_write_timeout' => 0, // No timeout (blocking commands)
        'connection_pool_size' => 50, // Connection pooling for high concurrency
    ],

    'default' => [
        'url' => env('REDIS_URL'),
        'host' => env('REDIS_HOST', '127.0.0.1'),
        'password' => env('REDIS_PASSWORD', null),
        'port' => env('REDIS_PORT', 6379),
        'database' => env('REDIS_CACHE_DB', 1), // Cache database (0 = sessions, 1 = cache)
    ],

    'cache' => [
        'url' => env('REDIS_URL'),
        'host' => env('REDIS_HOST', '127.0.0.1'),
        'password' => env('REDIS_PASSWORD', null),
        'port' => env('REDIS_PORT', 6379),
        'database' => env('REDIS_CACHE_DB', 1),
    ],

    'session' => [
        'url' => env('REDIS_URL'),
        'host' => env('REDIS_HOST', '127.0.0.1'),
        'password' => env('REDIS_PASSWORD', null),
        'port' => env('REDIS_PORT', 6379),
        'database' => env('REDIS_SESSION_DB', 2),
    ],

    'rate_limit' => [
        'url' => env('REDIS_URL'),
        'host' => env('REDIS_HOST', '127.0.0.1'),
        'password' => env('REDIS_PASSWORD', null),
        'port' => env('REDIS_PORT', 6379),
        'database' => env('REDIS_RATE_LIMIT_DB', 3), // Separate DB for rate limiting
    ],
],
```

## Docker Compose Setup

```bash
# Start Redis in Docker
docker-compose up -d redis

# Check Redis connection
docker exec redis redis-cli ping

# Monitor Redis
docker exec redis redis-cli MONITOR

# Clear all data
docker exec redis redis-cli FLUSHALL
```

---

## Performance Checklist

✅ phpredis C-extension (installed)
✅ Connection pooling (50 connections)
✅ Separate Redis databases (cache, session, rate_limit)
✅ Compression (igbinary serializer)
✅ Health check endpoint (/health)
✅ Rate limiting configured
✅ Cache tags enabled
✅ Automatic invalidation on model save
✅ Memory limits + eviction policy
✅ AOF persistence (append-only file)

---

Next: Run Pest tests để verify rate limiter + cache hoạt động đúng.
