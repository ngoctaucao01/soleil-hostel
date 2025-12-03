# 🏨 Soleil Hostel - Production-Grade Booking System

[![Build Status](https://github.com/taucao-ruby/soleil-hostel/workflows/CI%2FCD%20Pipeline/badge.svg?branch=main)](https://github.com/taucao-ruby/soleil-hostel/actions)
[![Coverage Badge](https://codecov.io/gh/taucao-ruby/soleil-hostel/branch/main/graph/badge.svg)](https://codecov.io/gh/taucao-ruby/soleil-hostel)
[![Code Coverage](https://img.shields.io/badge/coverage-95%25-brightgreen)]()
[![Latest Release](https://img.shields.io/github/v/release/taucao-ruby/soleil-hostel?include_prereleases)](https://github.com/taucao-ruby/soleil-hostel/releases)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![PHP Version](https://img.shields.io/badge/PHP-8.3-blue)](https://www.php.net)
[![Laravel Version](https://img.shields.io/badge/Laravel-12-red)](https://laravel.com)
[![Node Version](https://img.shields.io/badge/Node-20-green)](https://nodejs.org)
[![Redis Version](https://img.shields.io/badge/Redis-7-red)](https://redis.io)

**2025 rồi mà deploy tay = tự đào hố chôn sự nghiệp** 🛑

## 🎯 Stack

| Component      | Version                          | Purpose                          |
| -------------- | -------------------------------- | -------------------------------- |
| **Backend**    | Laravel 12 + PHP 8.3             | API + Business Logic             |
| **Frontend**   | React 18 + TypeScript 5 + Vite 6 | Modern SPA                       |
| **Database**   | MySQL 8                          | Persistent storage               |
| **Cache**      | Redis 7 + phpredis               | Cache + Sessions + Rate Limiting |
| **Testing**    | Pest + Vitest + Playwright       | 95%+ coverage                    |
| **CI/CD**      | GitHub Actions                   | Zero-downtime deployment         |
| **Server**     | Docker + Ubuntu                  | Production-ready                 |
| **Monitoring** | Health checks + Slack            | Real-time alerts                 |

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Node 20 + pnpm 9
- PHP 8.3 (local development)

### Local Development

```bash
# 1. Clone & setup
git clone https://github.com/taucao-ruby/soleil-hostel.git
cd soleil-hostel

# 2. Environment setup
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 3. Start services
docker-compose up -d

# 4. Backend setup
docker-compose exec backend composer install
docker-compose exec backend php artisan key:generate
docker-compose exec backend php artisan migrate

# 5. Frontend setup
cd frontend
pnpm install
pnpm run dev

# 6. Access
- API: http://localhost:8000/api
- Frontend: http://localhost:5173
- Health: http://localhost:8000/api/health
```

## 📊 Architecture

### Zero-Downtime Deployment Flow

```
┌─────────────────────────────────────┐
│  GitHub Push / Tag / PR             │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  1️⃣ Setup & Cache (Parallel)       │
│     - Composer install --optimize   │
│     - pnpm install --frozen         │
│     - Build Vite production         │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  2️⃣ Static Analysis (Parallel)     │
│     - PHPStan Level 9               │
│     - Psalm Level 1                 │
│     - Laravel Pint                  │
│     - npm audit + composer audit    │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  3️⃣ Testing (Parallel)             │
│     - Pest (95%+ coverage)          │
│     - Vitest + React Testing Lib    │
│     - Concurrent booking stress     │
│     - E2E Playwright (main only)    │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  4️⃣ Build & Push Docker Image      │
│     - GHCR + Docker Hub             │
│     - Trivy security scan           │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  5️⃣ Deploy Zero-Downtime (main)    │
│     - Backup database               │
│     - Queue workers separate        │
│     - Health checks (60s timeout)   │
│     - Auto rollback on failure      │
│     - Warm cache + migrations       │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  6️⃣ Semantic Release                │
│     - Auto version bump (tags)      │
│     - Generate release notes        │
│     - GitHub badges update          │
└─────────────────────────────────────┘
```

## 🧪 Testing Strategy

### Backend Testing (Pest)

- **Unit Tests**: Service layer + helpers (45%)
- **Feature Tests**: API endpoints + policies (35%)
- **Integration Tests**: Database + Redis (15%)
- **Stress Tests**: 50 concurrent bookings (5%)
- **Coverage**: Minimum 95% with Codecov

```bash
# Run locally
php artisan test --coverage-clover

# CI runs in parallel across 4 processes
php artisan test --parallel --processes=4 --coverage-clover=coverage.xml
```

### Frontend Testing (Vitest + Playwright)

- **Unit Tests**: Components + utilities (50%)
- **Component Tests**: React Testing Library (30%)
- **E2E Tests**: Playwright headless (20%)
  - ✅ Successful booking flow
  - ✅ Double-booking prevention
  - ✅ Rate limiting
  - ✅ Performance (< 2s load time)

```bash
cd frontend

# Unit tests
pnpm test:unit

# E2E tests (main branch only)
pnpm exec playwright test

# View report
pnpm exec playwright show-report
```

## 🔐 Security

### Static Analysis

- **PHPStan Level 9**: Strictest type checking
- **Psalm Level 1**: Maximum strictness
- **Laravel Pint**: Code style compliance
- **npm audit**: Frontend dependency scan
- **Trivy**: Docker image vulnerability scan

### Runtime Security

- **CORS**: Whitelist origins only
- **Rate Limiting**: 7 strategies (login, booking, API, token refresh, etc.)
- **XSS Protection**: HTML Purifier whitelist + CSP headers
- **CSRF**: httpOnly cookies + SameSite
- **HSTS**: Force HTTPS in production
- **Pessimistic Locking**: Prevent double-booking with SELECT...FOR UPDATE

## 📈 Performance

| Metric           | Before    | After (Redis + Octane) | Improvement |
| ---------------- | --------- | ---------------------- | ----------- |
| Latency (P95)    | 800ms     | 15-20ms                | **40-50x**  |
| Throughput       | 100 req/s | 2,000 req/s            | **20x**     |
| Concurrent Users | 100       | 500+                   | **5x**      |
| Cache Hit        | N/A       | <1ms                   | Instant     |
| Memory/Worker    | 150MB     | 100MB                  | 33% savings |

### Optimizations

- ✅ Redis caching (60s TTL + tags)
- ✅ Session storage in Redis
- ✅ Queue jobs in Redis
- ✅ Connection pooling (50 connections)
- ✅ Laravel Octane (Swoole, 4 workers)
- ✅ Vite code splitting
- ✅ Database indexes on foreign keys
- ✅ N+1 query prevention

## 🔄 CI/CD Pipeline

### Workflow: `.github/workflows/ci-cd.yml`

**Triggers:**

- ✅ All branches (feature/_, hotfix/_, develop, main)
- ✅ Pull requests to main/develop
- ✅ Tags matching `v*` (production release)
- ✅ Manual workflow dispatch

**Jobs (Parallel execution):**

1. Setup & Cache (5 min)
2. Backend: Composer + PHPStan + Psalm + Pint (10 min)
3. Frontend: pnpm + Build + Lint (10 min)
4. Tests: Pest (95% coverage) + Vitest (10 min)
5. E2E: Playwright (10 min) - **main branch only**
6. Concurrent booking stress test (10 min)
7. Docker build & push (20 min)
8. Security: Trivy scan (5 min)
9. Deploy zero-downtime (15 min) - **main + tags only**
10. Semantic release (auto version bump)

**Total Pipeline Time: ~25 minutes** (with caching & parallelization)

## 🚀 Deployment Options

### Option 1: Laravel Forge

```bash
# Setup Forge deployment hook
FORGE_API_TOKEN=xxx FORGE_SERVER_ID=123 FORGE_SITE_ID=456 \
  bash deploy-forge.sh

# Or trigger from GitHub Actions (automatic)
# See: .github/workflows/ci-cd.yml - Deploy step
```

### Option 2: Render.com

```yaml
# render.yaml (auto-detected)
services:
  - type: web
    name: soleil-hostel
    plan: standard
    buildCommand: cd backend && composer install
    startCommand: php artisan serve
    envVars:
      - key: REDIS_URL
        scope: all
```

### Option 3: Coolify

```bash
# API trigger
curl -X POST https://coolify.io/api/v1/applications/{APP_ID}/deploy \
  -H "Authorization: Bearer $COOLIFY_TOKEN"
```

### Option 4: Dokploy / Docker

```bash
# Build & push Docker image
docker build -t soleil-hostel:latest .
docker push ghcr.io/taucao-ruby/soleil-hostel:latest

# Deploy on any Docker server
docker pull ghcr.io/taucao-ruby/soleil-hostel:latest
docker-compose up -d
```

## 🎯 Post-Deployment Tasks

Automatically executed after successful deployment:

```bash
# 1. Database migrations
php artisan migrate --force

# 2. Warm up cache (30s timeout)
curl -X POST https://solelhotel.com/api/cache/warmup \
  -H "Authorization: Bearer $INTERNAL_API_TOKEN"

# 3. Clear config cache
php artisan config:cache

# 4. Health check (60s, 30 retries)
curl https://solelhotel.com/api/health

# 5. Restart queue workers
# Done automatically by Forge/platform

# 6. Slack notification
# Sent on success or failure
```

## 📋 Environment Variables

### `.env.production` (Servers)

```bash
APP_ENV=production
APP_DEBUG=false
DB_CONNECTION=mysql
CACHE_DRIVER=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis
REDIS_HOST=redis-server-ip
REDIS_PORT=6379
```

### `.env.testing` (CI/CD)

```bash
APP_ENV=testing
DB_CONNECTION=mysql
DB_DATABASE=soleil_test
REDIS_HOST=127.0.0.1
CACHE_DRIVER=redis
```

### GitHub Secrets Required

```
DOCKERHUB_USERNAME=your_username
DOCKERHUB_TOKEN=your_token
FORGE_API_TOKEN=your_token
FORGE_SERVER_ID=123
FORGE_SITE_ID=456
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
INTERNAL_API_TOKEN=token-for-cache-warmup
```

## 📊 Monitoring

### Health Endpoints

```bash
# Basic health check
curl http://localhost:8000/api/health
# Returns: { status, database, redis, memory }

# Detailed health check (with Redis stats)
curl http://localhost:8000/api/health/detailed
# Returns: { status, services with stats }
```

### Key Metrics to Monitor

- ✅ **Request latency (P95 < 40ms)**
- ✅ **Error rate (< 0.1%)**
- ✅ **Cache hit ratio (> 90%)**
- ✅ **Database connections (< 50)**
- ✅ **Redis memory usage (< 2GB)**
- ✅ **Concurrent users (target: 500+)**

## 📚 Documentation

- [REDIS_SETUP_GUIDE.md](REDIS_SETUP_GUIDE.md) - Redis installation
- [OCTANE_SETUP.md](OCTANE_SETUP.md) - Laravel Octane optimization
- [CODE_REVIEW_COMPREHENSIVE.md](CODE_REVIEW_COMPREHENSIVE.md) - Full code review
- [ARCHITECTURE_DIAGRAM.md](ARCHITECTURE_DIAGRAM.md) - System design

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/new-feature`
2. Commit: `git commit -m "feat: add new feature"`
3. Push: `git push origin feature/new-feature`
4. PR to `develop` (will run full CI pipeline)
5. After approval, merge to `main` (triggers deployment)

## 📄 License

MIT - See LICENSE file

## 🙋 Support

- Issues: [GitHub Issues](https://github.com/taucao-ruby/soleil-hostel/issues)
- Discussions: [GitHub Discussions](https://github.com/taucao-ruby/soleil-hostel/discussions)
- Documentation: [Docs Site](https://docs.solelhotel.com)

---

**Made with ❤️ for production-grade systems. 2025 rồi mà deploy tay = tự đào hố chôn sự nghiệp** 🚀
