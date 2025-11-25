# Quick Start Guide - Soleil Hostel

## Prerequisites
- Docker and Docker Compose installed
- Git for version control
- Node.js 18+ (for frontend development outside Docker)
- PHP 8.2+ (for backend development outside Docker)

## Local Development Setup

### 1. Clone and Setup Environment

```bash
# Clone the repository
git clone <repository-url>
cd soleil-hostel

# Copy environment template and update with your values
cp .env.example .env

# Edit .env with your preferred database password
# Default values are fine for local development
```

### 2. Configure Environment Variables

Edit `.env` file:
```env
# Use secure passwords in production
MYSQL_ROOT_PASSWORD=your_secure_root_password
MYSQL_PASSWORD=your_secure_db_password
DB_PASSWORD=your_secure_db_password

# Keep defaults for local development
APP_ENV=local
APP_DEBUG=true
```

### 3. Start Services with Docker Compose

```bash
# Start all services (database, backend, frontend)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 4. Access the Application

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000/api
- **Database:** localhost:3306 (MySQL 8.0)

## Testing the Secure Setup

### Test Authentication Flow

```bash
# 1. Register a new user
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePassword123!",
    "password_confirmation": "SecurePassword123!"
  }'

# Response will include JWT token
# {
#   "success": true,
#   "message": "User registered successfully",
#   "data": {
#     "user": { ... },
#     "access_token": "token_here"
#   }
# }

# 2. Login with credentials
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePassword123!"
  }'

# 3. Create a booking (requires token)
curl -X POST http://localhost:8000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "room_id": 1,
    "check_in": "2024-12-25",
    "check_out": "2024-12-27",
    "guest_name": "John Doe",
    "guest_email": "john@example.com"
  }'

# 4. Get your bookings (authenticated)
curl http://localhost:8000/api/bookings \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# 5. Try accessing another user's booking (should fail with 403)
curl http://localhost:8000/api/bookings/999 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
# Will return: 403 Forbidden - "This action is unauthorized"
```

### Test Rate Limiting

```bash
# Try logging in more than 5 times in a minute
# On 6th attempt, should get 429 Too Many Requests
for i in {1..10}; do
  curl -X POST http://localhost:8000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email": "test@test.com", "password": "wrong"}'
  echo "Attempt $i"
  sleep 1
done
```

### Test XSS Protection

```bash
# Try submitting script tag (will be escaped)
curl -X POST http://localhost:8000/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test<script>alert(\"XSS\")</script>",
    "email": "test@example.com",
    "message": "This is a test message"
  }'

# Response will reject suspicious patterns
# {
#   "success": false,
#   "message": "Invalid characters detected in input."
# }
```

## Backend Operations

### Access Backend Container

```bash
# Open bash in backend container
docker-compose exec backend bash

# Run Artisan commands
docker-compose exec backend php artisan migrate
docker-compose exec backend php artisan tinker
docker-compose exec backend php artisan cache:clear
```

### Database

```bash
# Access MySQL
docker-compose exec db mysql -u root -p

# Use credentials from .env
# Username: root
# Password: (from MYSQL_ROOT_PASSWORD)
# Database: homestay

# Show tables
SHOW TABLES;

# Check bookings
SELECT * FROM bookings;
SELECT * FROM users;
```

### View Logs

```bash
# Backend logs
docker-compose logs backend

# Database logs
docker-compose logs db

# Frontend logs
docker-compose logs frontend

# Real-time logs
docker-compose logs -f
```

## Frontend Development

### Install Dependencies

```bash
# Inside frontend directory
cd frontend
npm install
```

### Run Development Server

```bash
# With Docker (already running)
# Access at http://localhost:5173

# Or locally (requires Node.js)
npm run dev
```

### Build for Production

```bash
npm run build
# Output in dist/ directory
```

## Key Security Features

✅ **Authentication:** JWT tokens via Laravel Sanctum
✅ **Authorization:** Policy-based access control
✅ **XSS Protection:** HTML entity encoding
✅ **Rate Limiting:** 5/min auth, 10/min bookings, 3/min contact
✅ **Input Validation:** Server-side + client-side validation
✅ **IDOR Protection:** Users can only access own bookings
✅ **Database Constraints:** Unique constraint prevents double-booking
✅ **Secrets Management:** No credentials in version control

## Troubleshooting

### Port Already in Use

```bash
# Find and kill process using port 8000 (backend)
lsof -i :8000
kill -9 <PID>

# Find and kill process using port 5173 (frontend)
lsof -i :5173
kill -9 <PID>

# Or change ports in docker-compose.yml
```

### Database Connection Error

```bash
# Check if database is running
docker-compose logs db

# Verify .env has correct credentials
# Restart database
docker-compose restart db

# Run migrations
docker-compose exec backend php artisan migrate --force
```

### Frontend Can't Connect to API

```bash
# Check if backend is running
docker-compose logs backend

# Verify VITE_API_URL in docker-compose.yml
# Should be http://localhost:8000/api

# Check browser console for CORS errors
```

### Clean Restart

```bash
# Stop all services
docker-compose down

# Remove all data
docker-compose down -v

# Start fresh
docker-compose up -d

# Check logs
docker-compose logs -f
```

## Production Deployment

### Before Deploying

1. Update `.env` with production values:
   - Set `APP_ENV=production`
   - Set `APP_DEBUG=false`
   - Update `SANCTUM_STATEFUL_DOMAINS` to your domain
   - Use strong database passwords
   - Configure email settings

2. Generate Laravel APP_KEY:
   ```bash
   php artisan key:generate
   ```

3. Build frontend for production:
   ```bash
   npm run build
   ```

4. Run migrations on production database:
   ```bash
   php artisan migrate --force
   ```

5. Set up HTTPS/SSL certificates

6. Configure firewall and security groups

### Security Checklist

- [ ] `.env` file excludes from git (in `.gitignore`)
- [ ] All passwords are strong (16+ characters)
- [ ] HTTPS is enabled
- [ ] CORS is properly configured
- [ ] Database backups are automated
- [ ] Logs are being monitored
- [ ] Rate limiting is active
- [ ] Email notifications are configured

## Support

For issues or questions:
1. Check logs: `docker-compose logs`
2. Review SECURITY_IMPLEMENTATION.md
3. Check individual component READMEs:
   - `backend/README.md`
   - `frontend/README.md`

---

**Last Updated:** November 18, 2024
**Version:** 1.0 (Production Ready)
