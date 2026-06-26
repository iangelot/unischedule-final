# UniSchedule Backend — Setup & Development Guide

> ## ⚠️ Status: Optional — Phase 2 (multi-campus sync). NOT wired to the app.
>
> UniSchedule runs **fully offline** out of the box: the frontend stores all data
> locally in the browser (IndexedDB/Dexie) and needs no server — launch it with
> `START.bat`. This backend is **not used by the running app**. It exists as the
> future path for a hosted, multi-campus, multi-user deployment (shared database,
> real auth, a public timetable viewer), and as a reference API design.
>
> Nothing in `frontend/` calls these endpoints today. Do not assume the two halves
> are connected. If/when multi-user sync is adopted, this is where it starts.

## Overview

UniSchedule is a timetable scheduling system built with **Next.js 14** and **PostgreSQL**. This guide covers setup, development, testing, and deployment.

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ (https://nodejs.org)
- **PostgreSQL** 14+ (local or cloud)
- **npm** or **yarn**

### Local Development (without Docker)

1. **Clone and install dependencies:**

```bash
cd backend
npm install
```

2. **Create `.env.local` from `.env.example`:**

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in your database URL and JWT secrets.

3. **Run database migrations:**

```bash
npm run db:migrate
```

4. **Start development server:**

```bash
npm run dev
```

Server runs on `http://localhost:3000`

---

## 🐳 Docker Setup (Recommended for Local Development)

### Start All Services (Backend + PostgreSQL + Frontend)

```bash
cd ..  # Go to project root
docker-compose up
```

Services:
- **Backend**: http://localhost:3000
- **Frontend**: http://localhost:5173
- **PostgreSQL**: localhost:5432

### Useful Docker Commands

```bash
# View logs
docker-compose logs -f backend

# Run migrations in container
docker-compose exec backend npm run db:migrate

# Access PostgreSQL shell
docker-compose exec postgres psql -U unischedule_user -d unischedule_dev

# Stop all services
docker-compose down

# Remove volumes (reset database)
docker-compose down -v
```

---

## 📊 Database Migrations

### Create a New Migration

```bash
npm run db:migrate:create -- create_students_table
```

Creates: `scripts/migrations/20260605000002_create_students_table.sql`

### Write Migration SQL

Format: UP statement first, then `-- DOWN\n`, then DOWN statement

```sql
-- UP: Create students table
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  matric_number VARCHAR(20) NOT NULL UNIQUE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE,
  institution_id UUID NOT NULL REFERENCES institutions(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(institution_id, matric_number)
);

-- DOWN: Drop students table
DROP TABLE IF EXISTS students;
```

### Apply Migrations

```bash
# Run all pending migrations
npm run db:migrate

# Rollback last migration
npm run db:migrate rollback

# Rollback last 3 migrations
npm run db:migrate rollback 3
```

---

## 🧪 Testing

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm test -- --watch
```

### Generate Coverage Report

```bash
npm test -- --coverage
```

Coverage thresholds: 60% branches, functions, lines, statements

### Test Structure

Tests follow the AAA pattern:
1. **Arrange** — Set up mocks and data
2. **Act** — Call the function/endpoint
3. **Assert** — Verify the output

```typescript
it('should detect lecturer double-bookings', async () => {
  // ARRANGE
  mockQuery.mockResolvedValueOnce({ rows: [...], rowCount: 1 });

  // ACT
  const conflicts = await detectTimetableConflicts(timetableId, institutionId);

  // ASSERT
  expect(conflicts[0].type).toBe('LECTURER_DOUBLE_BOOKED');
});
```

---

## 🔐 Security

### Environment Variables

All sensitive data must be in `.env.local`, never in source code:

- `JWT_SECRET` — Min 32 chars, randomized
- `JWT_REFRESH_SECRET` — Min 32 chars, randomized
- `DATABASE_URL` — Never commit
- `CORS_ORIGIN` — Restrict to your domain

### Generate Random Secrets

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### CORS Configuration

Edit `next.config.js` to allow your frontend domain:

```javascript
headers: [
  { key: 'Access-Control-Allow-Origin', value: 'https://yourdomain.com' },
]
```

### Rate Limiting

Implemented on `/api/auth/login`: **5 attempts per 15 minutes per IP/email**

**Production**: Switch from in-memory to Redis:

```bash
npm install redis
# Then update security.ts to use Redis store
```

---

## 📝 API Endpoints

### Authentication

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/refresh` | Refresh JWT token |

### Courses

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| GET | `/api/courses` | List courses |
| POST | `/api/courses` | Create course |
| GET | `/api/courses/:id` | Get course |

### Sessions

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| GET | `/api/sessions` | List sessions |
| POST | `/api/sessions` | Create session |

### Timetables

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| GET | `/api/timetables` | List timetables |
| POST | `/api/timetables` | Create timetable |
| GET | `/api/timetables/:id` | Get timetable |

### Health

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| GET | `/api/health` | Health check |

---

## 🏗️ Project Structure

```
backend/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   ├── courses/
│   │   │   ├── sessions/
│   │   │   └── timetables/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── lib/
│   │   ├── auth.ts         # JWT & password hashing
│   │   ├── db.ts           # Database connection pool
│   │   ├── logger.ts       # Pino structured logging
│   │   ├── env.ts          # Environment validation
│   │   ├── sentry.ts       # Error tracking
│   │   ├── response.ts     # Response helpers
│   │   └── __tests__/      # Unit tests
│   └── middleware/
│       ├── security.ts     # CORS, rate limiting, headers
│       └── withAuth.ts     # JWT verification
├── scripts/
│   ├── migrations/         # Database migrations
│   ├── migrate.js          # Migration CLI
│   ├── seed.js             # Database seeding
│   └── schema.sql          # Initial schema
├── .env.example
├── jest.config.js          # Test configuration
├── next.config.js          # Next.js configuration
└── package.json
```

---

## 🚢 Production Deployment

### 1. Environment Setup

Create `.env.production` with production values:

```bash
NODE_ENV=production
APP_ENV=production
LOG_LEVEL=info
DATABASE_URL=postgresql://...  # Production database
JWT_SECRET=<random 64-char hex>
JWT_REFRESH_SECRET=<random 64-char hex>
CORS_ORIGIN=https://yourdomain.com
SENTRY_DSN=https://...          # Optional error tracking
```

### 2. Build Docker Image

```bash
docker build -t unischedule:latest .
```

### 3. Push to Registry

```bash
docker tag unischedule:latest ghcr.io/yourusername/unischedule:latest
docker push ghcr.io/yourusername/unischedule:latest
```

### 4. Deploy (Railway, Render, Fly.io, or Kubernetes)

**Railway:**

```bash
railway link  # Connect to your project
railway up
```

**Docker Compose (VPS):**

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 5. Run Migrations

```bash
docker exec unischedule-backend npm run db:migrate
```

### 6. Monitor

- **Logs**: `docker logs -f container-id`
- **Errors**: Check Sentry dashboard
- **Health**: `curl https://api.yourdomain.com/api/health`

---

## 🔍 Troubleshooting

### Database Connection Failed

```bash
# Test database URL
psql $DATABASE_URL

# Check PostgreSQL is running (Docker)
docker-compose ps
```

### Tests Failing

```bash
# Clear Jest cache
npm test -- --clearCache

# Run with verbose output
npm test -- --verbose
```

### Migrations Not Applied

```bash
# Check applied migrations
psql $DATABASE_URL -c "SELECT * FROM schema_migrations;"

# Check migration files exist
ls scripts/migrations/
```

### Port Already in Use

```bash
# Find process on port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

---

## 📚 Additional Resources

- [Next.js Docs](https://nextjs.org/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [JWT Handbook](https://auth0.com/resources/ebooks/jwt-handbook)
- [Pino Logger](https://getpino.io/)

---

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/your-feature`
2. Write tests for new code
3. Run linter and tests: `npm test && npm run lint`
4. Commit with clear message: `git commit -m "feat: add X"`
5. Push and create PR

---

## 📄 License

MIT License — See LICENSE file

---

**Last Updated**: December 2025
**Maintainer**: UniSchedule Team
